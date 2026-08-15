import { BrainCircuit } from "lucide-react";
import { Card } from "@components/ui/Card";

export type AiCustomerMemoryProfile = {
  businessType?: string | null;
  businessGoal?: string | null;
  interestedServices?: string[];
  budgetHint?: string | null;
  timelineHint?: string | null;
  objections?: string[];
  preferredLanguageStyle?: string | null;
  lastAssistantQuestion?: string | null;
};

type Props = {
  memory?: AiCustomerMemoryProfile | null;
  title?: string;
  compact?: boolean;
  emptyLabel?: string;
};

const FIELD_LABELS: Array<{ key: keyof AiCustomerMemoryProfile; label: string }> = [
  { key: "businessType", label: "Business type" },
  { key: "businessGoal", label: "Goal" },
  { key: "budgetHint", label: "Budget" },
  { key: "timelineHint", label: "Timeline" },
  { key: "preferredLanguageStyle", label: "Language style" },
  { key: "lastAssistantQuestion", label: "Last question" },
];

export function AiMemoryCard({
  memory,
  title = "AI Memory",
  compact = false,
  emptyLabel = "AI has not remembered anything yet.",
}: Props) {
  const normalized = normalizeMemory(memory);
  const hasMemory =
    FIELD_LABELS.some(({ key }) => Boolean(String(normalized?.[key] || "").trim())) ||
    normalized.interestedServices.length > 0 ||
    normalized.objections.length > 0;

  return (
    <Card className={compact ? "p-4" : "p-5"}>
      <div className="flex items-center gap-2">
        <BrainCircuit size={18} className="text-brand-700" />
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
      </div>

      {!hasMemory ? (
        <p className="mt-3 rounded-[10px] bg-slate-50 px-3 py-3 text-sm font-medium leading-6 text-slate-500">
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {FIELD_LABELS.map(({ key, label }) => {
            const value = String(normalized[key] || "").trim();
            if (!value) return null;
            return <MemoryRow key={key} label={label} value={value} multiline={key === "lastAssistantQuestion"} />;
          })}

          {normalized.interestedServices.length ? (
            <ChipGroup label="Interested services" values={normalized.interestedServices} tone="brand" />
          ) : null}

          {normalized.objections.length ? (
            <ChipGroup label="Objections" values={normalized.objections} tone="amber" />
          ) : null}
        </div>
      )}
    </Card>
  );
}

function MemoryRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="rounded-[10px] bg-slate-50 px-3 py-2.5">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`mt-1 text-sm font-semibold text-slate-800 ${multiline ? "whitespace-pre-wrap leading-6" : ""}`}>{value}</div>
    </div>
  );
}

function ChipGroup({ label, values, tone }: { label: string; values: string[]; tone: "brand" | "amber" }) {
  const chipClassName =
    tone === "amber"
      ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200"
      : "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200";

  return (
    <div className="rounded-[10px] bg-slate-50 px-3 py-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className={`rounded-full px-3 py-1 text-xs font-black ${chipClassName}`}>
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function normalizeMemory(memory?: AiCustomerMemoryProfile | null) {
  return {
    businessType: normalizeText(memory?.businessType),
    businessGoal: normalizeText(memory?.businessGoal),
    interestedServices: normalizeList(memory?.interestedServices),
    budgetHint: normalizeText(memory?.budgetHint),
    timelineHint: normalizeText(memory?.timelineHint),
    objections: normalizeList(memory?.objections),
    preferredLanguageStyle: normalizeText(memory?.preferredLanguageStyle),
    lastAssistantQuestion: normalizeText(memory?.lastAssistantQuestion),
  };
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeList(values: unknown) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}
