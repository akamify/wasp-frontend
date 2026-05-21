import { FileSpreadsheet } from "lucide-react";

import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Select } from "@components/ui/Select";
import type { CampaignButtonValueTarget } from "@modules/campaigns/types/campaign-form.types";
import { inspectTemplate } from "@shared/utils/templateRuntime";

type CampaignCsvUploadSectionProps = {
  csvBusy: boolean;
  csvFileName: string;
  csvColumns: string[];
  csvPhoneColumn: string;
  csvHeaderMap: string[];
  csvBodyMap: string[];
  csvButtonMap: string[];
  csvFirstRow: Record<string, string> | null;
  summary: ReturnType<typeof inspectTemplate>;
  buttonsNeedingValue: CampaignButtonValueTarget[];
  onCsvFileLoad: (fileName: string, text: string) => void;
  onCsvBusyChange: (busy: boolean) => void;
  onCsvPhoneColumnChange: (value: string) => void;
  onCsvHeaderMapChange: (values: string[]) => void;
  onCsvBodyMapChange: (values: string[]) => void;
  onCsvButtonMapChange: (values: string[]) => void;
};

export function CampaignCsvUploadSection({
  csvBusy,
  csvFileName,
  csvColumns,
  csvPhoneColumn,
  csvHeaderMap,
  csvBodyMap,
  csvButtonMap,
  csvFirstRow,
  summary,
  buttonsNeedingValue,
  onCsvFileLoad,
  onCsvBusyChange,
  onCsvPhoneColumnChange,
  onCsvHeaderMapChange,
  onCsvBodyMapChange,
  onCsvButtonMapChange,
}: CampaignCsvUploadSectionProps) {
  return (
    <Card className="p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">CSV</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">Upload & map</div>
      <CsvUploadBox csvBusy={csvBusy} csvFileName={csvFileName} onCsvBusyChange={onCsvBusyChange} onCsvFileLoad={onCsvFileLoad} />
      <div className="mt-4 grid gap-3 md:grid-cols-1">
        <CsvColumnSelect label="Phone column" value={csvPhoneColumn} columns={csvColumns} emptyLabel="Select column..." onChange={onCsvPhoneColumnChange} />
      </div>
      {summary.headerVariableCount > 0 ? (
        <CsvMapSelects labelPrefix="Header" values={csvHeaderMap} columns={csvColumns} onChange={onCsvHeaderMapChange} />
      ) : null}
      {summary.bodyVariableCount > 0 ? (
        <CsvMapSelects labelPrefix="Body" values={csvBodyMap} columns={csvColumns} onChange={onCsvBodyMapChange} />
      ) : null}
      {buttonsNeedingValue.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-1">
          {buttonsNeedingValue.map((button, index) => (
            <CsvColumnSelect
              key={`btn-${button.index}`}
              label={`Button ${button.index + 1} value (${button.label})`}
              value={csvButtonMap[index] || ""}
              columns={csvColumns}
              emptyLabel="(use global button values)"
              onChange={(value) => onCsvButtonMapChange(csvButtonMap.map((item, itemIndex) => (itemIndex === index ? value : item)))}
            />
          ))}
        </div>
      ) : null}
      {csvFirstRow ? (
        <CsvRecipientPreview csvFirstRow={csvFirstRow} csvPhoneColumn={csvPhoneColumn} csvBodyMap={csvBodyMap} csvHeaderMap={csvHeaderMap} />
      ) : null}
    </Card>
  );
}

function CsvUploadBox({
  csvBusy,
  csvFileName,
  onCsvBusyChange,
  onCsvFileLoad,
}: Pick<CampaignCsvUploadSectionProps, "csvBusy" | "csvFileName" | "onCsvBusyChange" | "onCsvFileLoad">) {
  return (
    <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-slate-50 px-4 py-3">
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        id="campaigns-create-csv"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          onCsvBusyChange(true);
          try {
            onCsvFileLoad(file.name, await file.text());
          } finally {
            onCsvBusyChange(false);
            event.target.value = "";
          }
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink-900">{csvFileName ? csvFileName : "Choose a CSV file"}</div>
        <Button type="button" size="sm" variant="ghost" className="rounded-[7px] bg-white border border-ink-900/10" onClick={() => document.getElementById("campaigns-create-csv")?.click()}>
          <FileSpreadsheet size={14} /> {csvBusy ? "Loading..." : "Upload"}
        </Button>
      </div>
      <div className="mt-2 text-xs text-ink-800/70">Auto-map runs when mapping is empty.</div>
    </div>
  );
}

function CsvMapSelects({
  labelPrefix,
  values,
  columns,
  onChange,
}: {
  labelPrefix: string;
  values: string[];
  columns: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-1">
      {values.map((value, index) => (
        <CsvColumnSelect
          key={index}
          label={`${labelPrefix} {{${index + 1}}}`}
          value={value}
          columns={columns}
          emptyLabel="(empty)"
          onChange={(nextValue) => onChange(values.map((item, itemIndex) => (itemIndex === index ? nextValue : item)))}
        />
      ))}
    </div>
  );
}

function CsvColumnSelect({
  label,
  value,
  columns,
  emptyLabel,
  onChange,
}: {
  label: string;
  value: string;
  columns: string[];
  emptyLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={!columns.length}>
      <option value="">{emptyLabel}</option>
      {columns.map((column) => <option key={column} value={column}>{column}</option>)}
    </Select>
  );
}

function CsvRecipientPreview({
  csvFirstRow,
  csvPhoneColumn,
  csvBodyMap,
  csvHeaderMap,
}: Pick<CampaignCsvUploadSectionProps, "csvFirstRow" | "csvPhoneColumn" | "csvBodyMap" | "csvHeaderMap">) {
  if (!csvFirstRow) return null;

  return (
    <div className="mt-6 rounded-[5px] border border-ink-900/10 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-800/50">Real-time mapping (row #1)</div>
      <div className="mt-3 grid gap-1 text-xs text-ink-800/75">
        <PreviewRow label="phone" value={csvPhoneColumn ? String(csvFirstRow[csvPhoneColumn] ?? "") : "â€”"} />
        {csvBodyMap.map((column, index) => (
          <PreviewRow key={`b-${index}`} label={`body{{${index + 1}}}`} value={column ? String(csvFirstRow[column] ?? "") : "â€”"} />
        ))}
        {csvHeaderMap.map((column, index) => (
          <PreviewRow key={`h-${index}`} label={`header{{${index + 1}}}`} value={column ? String(csvFirstRow[column] ?? "") : "â€”"} />
        ))}
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-ink-900/55">{label}</span>
      <span className="truncate font-semibold text-ink-900">{value}</span>
    </div>
  );
}
