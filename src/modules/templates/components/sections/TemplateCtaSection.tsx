import { ListPlus, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { COPY_CODE_BUTTON_TEXT } from "@modules/templates/utils/helpers";
import type { CtaButton } from "@modules/templates/types/templates.types";
import { TemplateCtaButtonDetails } from "@modules/templates/components/sections/TemplateCtaButtonDetails";

type Props = {
  ctaButtons: CtaButton[];
  ctaLimit: number;
  canAddCta: boolean;
  ctaError: string | null;
  setCtaError: (value: string | null) => void;
  ctaOptions: ReadonlyArray<{ value: string; label: string }>;
  buttonTypeCounts: Map<string, number>;
  buttonTypeLimit: Record<string, number>;
  wouldExceedLimit: (nextType: string, removingId?: string) => boolean;
  setCtaButtons: React.Dispatch<React.SetStateAction<CtaButton[]>>;
  newCtaButton: () => CtaButton;
  flows: Array<{ id: string; name?: string; status?: string }>;
  flowsLoading: boolean;
  flowsError: string | null;
  refreshFlows: () => Promise<void>;
  voiceCallDayOptions: Array<{ label: string; minutes: number }>;
};

export function TemplateCtaSection(props: Props) {
  return (
    <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-ink-900"><ListPlus size={16} className="text-ink-800/60" /> Buttons (Optional) ({props.ctaButtons.length}/{props.ctaLimit})</div>
        <Button type="button" size="sm" variant="ghost" className="flex items-center gap-1.5 rounded-[5px] shadow-none bg-white border border-ink-900/10" onClick={() => { if (!props.canAddCta) return; props.setCtaError(null); props.setCtaButtons((prev) => [...prev, props.newCtaButton()]); }} disabled={!props.canAddCta}><Plus size={14} /> Add</Button>
      </div>
      {props.ctaError ? <div className="mb-4"><Alert tone="error">{props.ctaError}</Alert></div> : null}
      <div className="grid gap-4">
        {props.ctaButtons.map((button, index) => (
          <div key={button.id} className="rounded-[5px] border border-ink-900/10 bg-white p-4 shadow-none">
            <div className="mb-3 flex items-center justify-between border-b border-ink-900/10 pb-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800/50">Button {index + 1}</span><Button type="button" size="sm" variant="ghost" className="rounded-[5px] text-red-500 shadow-none hover:bg-red-50 hover:text-red-600" onClick={() => props.setCtaButtons((prev) => prev.filter((item) => item.id !== button.id))}><Trash2 size={14} /></Button></div>
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <Select label="Type" value={button.type} className="rounded-[5px] shadow-none" onChange={(e) => { const nextType = e.target.value as any; props.setCtaError(null); if (props.wouldExceedLimit(nextType, button.id)) { props.setCtaError(nextType === "URL" ? "Visit Website button max 2 allowed." : nextType === "QUICK_REPLY" ? "Quick Reply buttons max 10 allowed." : `Only 1 ${nextType} button allowed.`); return; } props.setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, type: nextType, text: nextType === "COPY_CODE" ? COPY_CODE_BUTTON_TEXT : "", url: "", urlExample: "", urlMode: "static", phoneNumber: "", flowId: "", ttlMinutes: "43200", flowIcon: "DOCUMENT", flowType: "", offerCode: "" } : item)); }}>
                {props.ctaOptions.map((option) => {
                  const current = button.type;
                  const count = props.buttonTypeCounts.get(option.value) || 0;
                  const limit = props.buttonTypeLimit[option.value] ?? 1;
                  const disabled = option.value !== current && count >= limit;
                  return <option key={option.value} value={option.value} disabled={disabled}>{option.label}{disabled ? " (limit reached)" : ""}</option>;
                })}
              </Select>
              <Input label="Button Text" value={button.type === "COPY_CODE" ? COPY_CODE_BUTTON_TEXT : button.text} className="rounded-[5px] shadow-none" onChange={(e) => { if (button.type === "COPY_CODE") return; props.setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, text: e.target.value } : item)); }} disabled={button.type === "COPY_CODE"} hint={button.type === "COPY_CODE" ? 'Meta requires fixed text: "Copy offer code".' : undefined} required />
            </div>
            <TemplateCtaButtonDetails button={button} flows={props.flows} flowsLoading={props.flowsLoading} flowsError={props.flowsError} voiceCallDayOptions={props.voiceCallDayOptions} setCtaButtons={props.setCtaButtons} refreshFlows={props.refreshFlows} />
          </div>
        ))}
      </div>
    </div>
  );
}
