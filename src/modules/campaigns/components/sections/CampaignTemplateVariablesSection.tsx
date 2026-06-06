import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import type { CampaignAttributeDefinition, CampaignButtonValueTarget, CampaignVariableMapping } from "@modules/campaigns/types/campaign-form.types";
import { parseCommaList, inspectTemplate } from "@shared/utils/templateRuntime";

type CampaignTemplateVariablesSectionProps = {
  summary: ReturnType<typeof inspectTemplate>;
  headerVars: string[];
  bodyVars: string[];
  otpCode: string;
  buttonsNeedingValue: CampaignButtonValueTarget[];
  buttonValueByIndex: Record<number, string>;
  buttonTtlMinutes: number[];
  flowTokens: string[];
  flowActionDataJson: string;
  headerMediaUploading: boolean;
  onHeaderVarsChange: (values: string[]) => void;
  onBodyVarsChange: (values: string[]) => void;
  onOtpCodeChange: (value: string) => void;
  onButtonValueByIndexChange: (values: Record<number, string>) => void;
  onButtonTtlMinutesChange: (values: number[]) => void;
  onFlowTokensChange: (values: string[]) => void;
  onFlowActionDataJsonChange: (value: string) => void;
  onHeaderMediaUpload: (file: File) => Promise<void>;
  attributeDefinitions: CampaignAttributeDefinition[];
  bodyVariableMappings: CampaignVariableMapping[];
  onBodyVariableMappingsChange: (values: CampaignVariableMapping[]) => void;
};

export function CampaignTemplateVariablesSection({
  summary,
  headerVars,
  bodyVars,
  otpCode,
  buttonsNeedingValue,
  buttonValueByIndex,
  buttonTtlMinutes,
  flowTokens,
  flowActionDataJson,
  headerMediaUploading,
  onHeaderVarsChange,
  onBodyVarsChange,
  onOtpCodeChange,
  onButtonValueByIndexChange,
  onButtonTtlMinutesChange,
  onFlowTokensChange,
  onFlowActionDataJsonChange,
  onHeaderMediaUpload,
  attributeDefinitions,
  bodyVariableMappings,
  onBodyVariableMappingsChange,
}: CampaignTemplateVariablesSectionProps) {
  return (
    <Card className="p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">Parameters</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">Template variables</div>
      {summary.headerVariableCount > 0 ? (
        <HeaderVariables
          summary={summary}
          headerVars={headerVars}
          headerMediaUploading={headerMediaUploading}
          onHeaderVarsChange={onHeaderVarsChange}
          onHeaderMediaUpload={onHeaderMediaUpload}
        />
      ) : null}
      {summary.bodyVariableCount > 0 ? <BodyVariables bodyVars={bodyVars} onBodyVarsChange={onBodyVarsChange} attributeDefinitions={attributeDefinitions} bodyVariableMappings={bodyVariableMappings} onBodyVariableMappingsChange={onBodyVariableMappingsChange} /> : null}
      {summary.otpButtons > 0 ? (
        <div className="mt-5">
          <Input label="OTP code" value={otpCode} onChange={(event) => onOtpCodeChange(event.target.value)} placeholder="123456" required />
        </div>
      ) : null}
      {summary.dynamicUrlButtons.length > 0 || summary.copyCodeButtons.length > 0 ? (
        <ButtonVariables
          summary={summary}
          buttonsNeedingValue={buttonsNeedingValue}
          buttonValueByIndex={buttonValueByIndex}
          onButtonValueByIndexChange={onButtonValueByIndexChange}
        />
      ) : null}
      {summary.voiceCallButtons.length > 0 ? (
        <div className="mt-5">
          <Input
            label="Call validity (ttl_minutes)"
            value={buttonTtlMinutes.join(", ")}
            onChange={(event) => onButtonTtlMinutesChange(parseCommaList(event.target.value).map((item) => Number(item)).filter((item) => !Number.isNaN(item)))}
            placeholder="43200"
            required
          />
        </div>
      ) : null}
      {summary.flowButtons.length > 0 ? (
        <div className="mt-5 grid gap-3">
          <Input label="Flow tokens" value={flowTokens.join(", ")} onChange={(event) => onFlowTokensChange(parseCommaList(event.target.value))} />
          <Textarea label="Flow action data (JSON)" value={flowActionDataJson} onChange={(event) => onFlowActionDataJsonChange(event.target.value)} className="min-h-24 font-mono text-xs" />
        </div>
      ) : null}
    </Card>
  );
}

function HeaderVariables({
  summary,
  headerVars,
  headerMediaUploading,
  onHeaderVarsChange,
  onHeaderMediaUpload,
}: Pick<CampaignTemplateVariablesSectionProps, "summary" | "headerVars" | "headerMediaUploading" | "onHeaderVarsChange" | "onHeaderMediaUpload">) {
  return (
    <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-800/55">Header variables</div>
      <div className="mt-1 text-xs text-ink-800/65">
        {summary.headerFormat === "TEXT" ? `These values fill Header ${"{{1}}"} (max 1 variable).` : "This value is used for the header media handle/link."}
      </div>
      {summary.headerFormat !== "TEXT" ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[5px] border border-ink-900/10 bg-slate-50 px-3 py-2">
          <div className="text-xs font-semibold text-ink-800/70">Upload local media to get a Media ID (recommended)</div>
          <input
            type="file"
            accept="image/*,video/*,application/pdf"
            className="hidden"
            id="campaigns-header-media-upload"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) await onHeaderMediaUpload(file);
              event.target.value = "";
            }}
          />
          <Button type="button" size="sm" variant="ghost" className="rounded-[5px] bg-white border border-ink-900/10" disabled={headerMediaUploading} onClick={() => document.getElementById("campaigns-header-media-upload")?.click()}>
            {headerMediaUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      ) : null}
      <div className="mt-3 grid gap-3">
        {headerVars.map((value, index) => (
          <Input
            key={index}
            label={`Header {{${index + 1}}}`}
            value={value}
            onChange={(event) => onHeaderVarsChange(headerVars.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
            placeholder={summary.headerFormat === "TEXT" ? "e.g. Shivam" : "media handle or https:// link"}
            required={index < (summary.headerFormat === "TEXT" ? summary.headerVariableCount : 1)}
          />
        ))}
      </div>
    </div>
  );
}

function BodyVariables({ bodyVars, onBodyVarsChange, attributeDefinitions, bodyVariableMappings, onBodyVariableMappingsChange }: Pick<CampaignTemplateVariablesSectionProps, "bodyVars" | "onBodyVarsChange" | "attributeDefinitions" | "bodyVariableMappings" | "onBodyVariableMappingsChange">) {
  const contactFields = ["name", "phone", "email", "company", "language"];
  return (
    <div className="mt-5 rounded-[5px] border border-ink-900/10 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-800/55">Body variables</div>
      <div className="mt-1 text-xs text-ink-800/65">These values fill Body {"{{1}}"}, {"{{2}}"}, ... in your message.</div>
      <div className="mt-3 rounded-[5px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900/80">
        Map placeholders to static values, contact fields, or saved attributes. Recipients missing values without fallback will be skipped.
      </div>
      <div className="mt-3 grid gap-3">
        {bodyVars.map((value, index) => {
          const mapping = bodyVariableMappings[index] || { position: index + 1, sourceType: "static", value };
          const sourceSummary = mapping.sourceType === "static"
            ? `Static: ${String(mapping.value ?? value) || "Not set"}`
            : mapping.sourceKey ? `$${mapping.sourceKey}` : "Source not selected";
          return <div key={index} className="rounded-[10px] border border-slate-100 bg-slate-50/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3"><span className="font-mono text-sm font-black text-slate-900">{`{{${index + 1}}}`}</span><span className="truncate text-xs font-semibold text-slate-500">{sourceSummary}{mapping.fallback ? `, fallback: ${mapping.fallback}` : ""}</span></div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block"><span className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Source type</span><select className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm" value={mapping.sourceType} onChange={(event) => onBodyVariableMappingsChange(bodyVariableMappings.map((item, itemIndex) => itemIndex === index ? { ...item, sourceType: event.target.value as CampaignVariableMapping["sourceType"], sourceKey: "", value: "" } : item))}><option value="static">Static value</option><option value="contact_field">Contact field</option><option value="contact_attribute">Contact attribute</option></select></label>
              {mapping.sourceType === "static" ? <Input label="Static value" value={String(mapping.value ?? value)} onChange={(event) => { onBodyVarsChange(bodyVars.map((item, itemIndex) => itemIndex === index ? event.target.value : item)); onBodyVariableMappingsChange(bodyVariableMappings.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item)); }} /> : <label className="block"><span className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Source</span><select className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm" value={mapping.sourceKey || ""} onChange={(event) => onBodyVariableMappingsChange(bodyVariableMappings.map((item, itemIndex) => itemIndex === index ? { ...item, sourceKey: event.target.value } : item))}><option value="">Select source</option>{mapping.sourceType === "contact_field" ? contactFields.map((field) => <option key={field} value={field}>${field}</option>) : attributeDefinitions.map((definition) => <option key={definition.key} value={definition.key}>{definition.label} (${`$${definition.key}`})</option>)}</select></label>}
              <Input label="Fallback value" value={mapping.fallback || ""} placeholder="Used if selected value is missing" onChange={(event) => onBodyVariableMappingsChange(bodyVariableMappings.map((item, itemIndex) => itemIndex === index ? { ...item, fallback: event.target.value } : item))} />
            </div>
            <div className="mt-3 text-[11px] font-semibold text-slate-500">If a value is missing and no fallback is set, that recipient will be skipped.</div>
          </div>;
        })}
      </div>
    </div>
  );
}

function ButtonVariables({
  summary,
  buttonsNeedingValue,
  buttonValueByIndex,
  onButtonValueByIndexChange,
}: Pick<CampaignTemplateVariablesSectionProps, "summary" | "buttonsNeedingValue" | "buttonValueByIndex" | "onButtonValueByIndexChange">) {
  return (
    <div className="mt-5 rounded-[5px] border border-ink-900/10 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-800/55">Button variables</div>
      <div className="mt-1 text-xs text-ink-800/65">Dynamic URL me sirf variable part do (full URL nahi), jaise: {"{product-slug}"}.</div>
      <div className="mt-3 grid gap-3">
        {buttonsNeedingValue.map((button, index) => (
          <Input
            key={`${button.index}-${index}`}
            label={`${button.label} (Button ${button.index + 1})`}
            value={String(buttonValueByIndex[button.index] ?? "")}
            onChange={(event) => onButtonValueByIndexChange({ ...buttonValueByIndex, [button.index]: event.target.value })}
            placeholder={summary.dynamicUrlButtons.some((item) => item.index === button.index) ? "e.g. offer-2026 (not full URL)" : "Enter value"}
            required
          />
        ))}
      </div>
    </div>
  );
}
