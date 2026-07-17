import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
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
    rows: dataRows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]))),
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

  const activeAttributes = useMemo(
    () => definitions.filter((definition) => definition.active && definition.visible),
    [definitions]
  );

  const mappedTargets = Object.values(mapping).filter((target) => target !== "ignore");
  const duplicateTargets = mappedTargets.filter(
    (target, index) => mappedTargets.indexOf(target) !== index && target !== "tags"
  );
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative my-auto flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[5px] border border-slate-100 bg-white shadow-2xl"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
              <div className="min-w-0">
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 sm:text-[10px]">
                  Import Contacts
                </div>
                <h2 className="mt-1 truncate text-sm font-black text-slate-900 sm:text-lg">
                  Map CSV Columns
                </h2>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500 sm:text-sm">
                  {fileName || "CSV file"} • {rows.length} rows detected
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-shrink-0 rounded-[5px] p-2 text-slate-400 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:gap-5 sm:p-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="rounded-[5px] border border-slate-100 bg-white p-4 shadow-sm">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Duplicate strategy
                  </label>
                  <select
                    className="mt-2 h-10 w-full rounded-[5px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400"
                    value={duplicateStrategy}
                    onChange={(event) => setDuplicateStrategy(event.target.value as "skip" | "update" | "merge")}
                    disabled={saving}
                  >
                    <option value="merge">Merge existing contacts</option>
                    <option value="update">Update existing contacts</option>
                    <option value="skip">Skip duplicates</option>
                  </select>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
                    Merge keeps existing data and adds new tags/attributes where possible.
                  </p>
                </div>

                <div className="rounded-[5px] border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="text-sm font-black text-slate-900">Column mapping</div>
                  <p className="mt-1 text-xs font-medium text-slate-500">Phone is required. Extra columns can be ignored.</p>

                  <div className="mt-4 space-y-3">
                    {headers.map((header) => (
                      <div key={header}>
                        <label className="block truncate text-xs font-bold text-slate-500">{header}</label>
                        <select
                          className="mt-1 h-9 w-full rounded-[5px] border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400"
                          value={mapping[header] || "ignore"}
                          disabled={saving}
                          onChange={(event) =>
                            setMapping((current) => ({ ...current, [header]: event.target.value as MappingTarget }))
                          }
                        >
                          <option value="ignore">Ignore column</option>
                          <option value="name">Name</option>
                          <option value="phone">Phone *</option>
                          <option value="email">Email</option>
                          <option value="company">Company</option>
                          <option value="tags">Tags</option>
                          {activeAttributes.map((attribute) => (
                            <option key={attribute.key} value={`attribute:${attribute.key}`}>
                              Attribute: {attribute.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard label="Valid rows" value={validRows.length} />
                  <SummaryCard label="Missing phone" value={missingPhoneRows} />
                  <SummaryCard label="Invalid phone" value={invalidPhoneRows} />
                  <SummaryCard label="Duplicate phones" value={duplicatePhones} />
                </div>

                {!phoneColumn ? (
                  <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    Map one column to Phone before importing.
                  </div>
                ) : null}

                {duplicateTargets.length ? (
                  <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    A field is mapped more than once. Use Ignore column for duplicate mappings.
                  </div>
                ) : null}

                <div className="rounded-[5px] border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <div className="text-sm font-black text-slate-900">CSV preview</div>
                      <div className="text-xs font-semibold text-slate-500">Showing first 10 rows</div>
                    </div>
                    <div className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                      Preview
                    </div>
                  </div>

                  <div className="max-h-[42vh] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <tr>
                          {headers.map((header) => (
                            <th key={header} className="whitespace-nowrap px-3 py-2">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.slice(0, 10).map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50/70">
                            {headers.map((header) => (
                              <td
                                key={header}
                                className="max-w-[220px] truncate px-3 py-2 font-semibold text-slate-700"
                                title={row[header] || "-"}
                              >
                                {row[header] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6 sm:py-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving} className="text-xs sm:text-sm">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canSave}
                onClick={() => onImport({ rows: validRows, options: { duplicateStrategy } })}
                className="text-xs sm:text-sm"
              >
                {saving ? "Saving..." : `Save ${validRows.length} Contacts`}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[5px] border border-slate-100 bg-white p-3 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}