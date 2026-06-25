import { useEffect, useMemo, useState } from "react";
import { Button } from "@components/ui/Button";
import type { AttributeDefinition } from "../Attributes";

type CsvImportRow = Record<string, string>;
type MappingTarget = "ignore" | "name" | "phone" | "email" | "company" | "tags" | `attribute:${string}`;

type Props = {
  open: boolean;
  fileName: string;
  headers: string[];
  rows: CsvImportRow[];
  definitions: AttributeDefinition[];
  saving: boolean;
  onClose: () => void;
  onImport: (payload: { rows: ImportContactRow[]; options: { duplicateStrategy: "skip" | "update" | "merge" } }) => void;
};

export type ImportContactRow = {
  name?: string;
  phone: string;
  email?: string;
  company?: string;
  tags?: string[];
  attributes?: Record<string, string>;
};

function normalizePhone(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function splitTags(value: string) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function guessTarget(header: string): MappingTarget {
  const key = header.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (["name", "fullname", "contactname", "customername"].includes(key)) return "name";
  if (["phone", "mobile", "mobilenumber", "whatsapp", "whatsappnumber"].includes(key)) return "phone";
  if (["email", "emailaddress"].includes(key)) return "email";
  if (["company", "business", "businessname"].includes(key)) return "company";
  if (["tag", "tags"].includes(key)) return "tags";
  return "ignore";
}

export function parseCsvText(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }

  row.push(current.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  if (!rows.length) return { headers: [], rows: [] };

  const firstRow = rows[0];
  const headerLike = firstRow.some((cell) => /name|phone|mobile|email|company|tag/i.test(cell));
  const headers = headerLike
    ? firstRow.map((cell, index) => cell || `Column ${index + 1}`)
    : firstRow.map((_, index) => `Column ${index + 1}`);
  const dataRows = headerLike ? rows.slice(1) : rows;

  return {
    headers,
    rows: dataRows.map((cells) =>
      Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]))
    ),
  };
}

export function ContactImportModal(props: Props) {
  const { open, fileName, headers, rows, definitions, saving, onClose, onImport } = props;
  const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "update" | "merge">("merge");
  const [mapping, setMapping] = useState<Record<string, MappingTarget>>(() =>
    Object.fromEntries(headers.map((header) => [header, guessTarget(header)]))
  );

  useEffect(() => {
    setMapping(Object.fromEntries(headers.map((header) => [header, guessTarget(header)])));
  }, [headers]);

  const activeAttributes = definitions.filter((definition) => definition.active && definition.visible);
  const mappedTargets = Object.values(mapping).filter((target) => target !== "ignore");
  const duplicateTargets = mappedTargets.filter((target, index) => mappedTargets.indexOf(target) !== index && target !== "tags");
  const phoneColumn = Object.entries(mapping).find(([, target]) => target === "phone")?.[0] || "";

  const builtRows = useMemo(() => {
    return rows.map((row) => {
      const out: ImportContactRow = { phone: "" };
      const attributes: Record<string, string> = {};
      for (const [header, target] of Object.entries(mapping)) {
        const value = String(row[header] || "").trim();
        if (!value || target === "ignore") continue;
        if (target === "name") out.name = value;
        else if (target === "phone") out.phone = normalizePhone(value);
        else if (target === "email") out.email = value;
        else if (target === "company") out.company = value;
        else if (target === "tags") out.tags = splitTags(value);
        else if (target.startsWith("attribute:")) attributes[target.slice("attribute:".length)] = value;
      }
      if (Object.keys(attributes).length) out.attributes = attributes;
      return out;
    });
  }, [mapping, rows]);

  const missingPhoneRows = builtRows.filter((row) => !row.phone).length;
  const invalidPhoneRows = builtRows.filter((row) => row.phone && row.phone.length < 8).length;
  const duplicatePhones = builtRows.reduce((acc, row, index) => {
    if (!row.phone) return acc;
    return builtRows.findIndex((item) => item.phone === row.phone) !== index ? acc + 1 : acc;
  }, 0);
  const validRows = builtRows.filter((row) => row.phone && row.phone.length >= 8);
  const canSave = Boolean(phoneColumn) && !duplicateTargets.length && validRows.length > 0 && !saving;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[8px] bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="text-xl font-black text-slate-900">Import contacts</div>
          <div className="mt-1 text-sm font-semibold text-slate-500">{fileName} - {rows.length} rows detected</div>
        </div>

        <div className="grid max-h-[65vh] gap-5 overflow-auto p-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Duplicate strategy</label>
              <select className="mt-2 h-10 w-full rounded-[5px] border border-slate-200 px-3 text-sm font-semibold" value={duplicateStrategy} onChange={(event) => setDuplicateStrategy(event.target.value as "skip" | "update" | "merge")}>
                <option value="merge">Merge existing contacts</option>
                <option value="update">Update existing contacts</option>
                <option value="skip">Skip duplicates</option>
              </select>
            </div>

            <div className="rounded-[6px] border border-slate-200 p-4">
              <div className="text-sm font-black text-slate-900">Column mapping</div>
              <div className="mt-3 space-y-3">
                {headers.map((header) => (
                  <div key={header}>
                    <label className="text-xs font-bold text-slate-500">{header}</label>
                    <select className="mt-1 h-9 w-full rounded-[5px] border border-slate-200 px-2 text-sm" value={mapping[header] || "ignore"} onChange={(event) => setMapping((current) => ({ ...current, [header]: event.target.value as MappingTarget }))}>
                      <option value="ignore">Ignore column</option>
                      <option value="name">Name</option>
                      <option value="phone">Phone *</option>
                      <option value="email">Email</option>
                      <option value="company">Company</option>
                      <option value="tags">Tags</option>
                      {activeAttributes.map((attribute) => (
                        <option key={attribute.key} value={`attribute:${attribute.key}`}>Attribute: {attribute.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <SummaryCard label="Valid rows" value={validRows.length} />
              <SummaryCard label="Missing phone" value={missingPhoneRows} />
              <SummaryCard label="Invalid phone" value={invalidPhoneRows} />
              <SummaryCard label="Duplicate phones" value={duplicatePhones} />
            </div>
            {!phoneColumn ? <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">Map one column to Phone before importing.</div> : null}
            {duplicateTargets.length ? <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">A field is mapped more than once. Use Ignore column for duplicates.</div> : null}
            <div className="overflow-auto rounded-[6px] border border-slate-200">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>{headers.map((header) => <th key={header} className="px-3 py-2">{header}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 10).map((row, index) => (
                    <tr key={index}>{headers.map((header) => <td key={header} className="max-w-[220px] truncate px-3 py-2 font-semibold text-slate-700">{row[header] || "-"}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="button" disabled={!canSave} onClick={() => onImport({ rows: validRows, options: { duplicateStrategy } })}>
            {saving ? "Saving..." : "Save Contacts"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[6px] border border-slate-200 bg-white p-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}
