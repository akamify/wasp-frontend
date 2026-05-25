import { FileText, Link, Phone, Sparkles, Star, Workflow } from "lucide-react";
import type React from "react";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { extractVariableIndexes, isValidHttpsSampleUrl } from "@modules/templates/utils/helpers";
import type { CtaButton } from "@modules/templates/types/templates.types";

type Props = {
  button: CtaButton;
  flows: Array<{ id: string; name?: string; status?: string }>;
  flowsLoading: boolean;
  flowsError: string | null;
  voiceCallDayOptions: Array<{ label: string; minutes: number }>;
  setCtaButtons: React.Dispatch<React.SetStateAction<CtaButton[]>>;
  refreshFlows: () => Promise<void>;
};

export function TemplateCtaButtonDetails({ button, flows, flowsLoading, flowsError, voiceCallDayOptions, setCtaButtons, refreshFlows }: Props) {
  if (button.type === "URL") return <UrlFields button={button} setCtaButtons={setCtaButtons} />;
  if (button.type === "PHONE_NUMBER") return <div className="flex items-center gap-3"><Phone size={16} className="text-ink-800/40 shrink-0 mt-6" /><div className="flex-1"><Input label="Phone Number" type="number" value={button.phoneNumber} className="rounded-[5px] shadow-none" onChange={(e) => setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, phoneNumber: e.target.value } : item))} placeholder="9000000000" required /></div></div>;
  if (button.type === "VOICE_CALL") return <div className="flex items-center gap-3"><Phone size={16} className="text-ink-800/40 shrink-0 mt-6" /><div className="flex-1"><Select label="Validity" value={button.ttlMinutes} className="rounded-[5px] shadow-none" onChange={(e) => setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, ttlMinutes: e.target.value } : item))}>{voiceCallDayOptions.map((opt) => <option key={opt.minutes} value={String(opt.minutes)}>{opt.label}</option>)}</Select></div></div>;
  if (button.type === "FLOW") return (
    <div className="flex items-start gap-3">
      <Workflow size={16} className="text-ink-800/40 shrink-0 mt-7" />
      <div className="flex-1">
        <div className="grid gap-3">
          <div className="text-xs font-semibold text-ink-800/80">Button icon</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[{ value: "DOCUMENT", label: "Document", Icon: FileText }, { value: "PROMOTION", label: "Promotion", Icon: Sparkles }, { value: "REVIEW", label: "Review", Icon: Star }].map(({ value, label, Icon }) => {
              const active = String(button.flowIcon || "DOCUMENT").toUpperCase() === value;
              return <button key={value} type="button" className={"flex cursor-pointer items-center gap-2 rounded-[5px] border px-3 py-2 text-sm font-semibold transition " + (active ? "border-brand-400/50 bg-brand-50 text-ink-900" : "border-ink-900/10 bg-white text-ink-900/70 hover:bg-slate-50")} onClick={() => setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, flowIcon: value as any } : item))}><Icon size={16} className={active ? "text-brand-600" : "text-ink-900/40"} /><span className="truncate">{label}</span></button>;
            })}
          </div>
        </div>
        <label className="block mt-4"><div className="mb-1 text-xs font-semibold text-ink-800/80">Workflow</div><div className="max-h-56 overflow-y-auto rounded-[5px] bg-white ring-1 ring-ink-900/12 focus-within:ring-2 focus-within:ring-brand-300"><select className="w-full bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none" value={button.flowId} size={Math.min(8, Math.max(4, (flows?.length || 0) + 1))} onChange={(e) => setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, flowId: e.target.value } : item))}><option value="">{flowsLoading ? "Loading workflows..." : "Select workflow"}</option>{flows.map((flow) => <option key={flow.id} value={flow.id}>{flow.name ? `${flow.name}` : flow.id}</option>)}</select></div>{flowsError ? <div className="mt-2"><Alert tone="error">{flowsError}</Alert></div> : null}</label>
        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-ink-900/45"><span>Selected icon</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-[0.18em] text-ink-900/60">{String(button.flowIcon || "DOCUMENT").toUpperCase()}</span></div>
        <div className="mt-2 flex items-center gap-2"><Button type="button" size="sm" variant="ghost" className="rounded-[5px] border border-ink-900/10 bg-white shadow-none" onClick={() => void refreshFlows()} disabled={flowsLoading}>Refresh</Button><Button type="button" size="sm" variant="ghost" className="rounded-[5px] border border-ink-900/10 bg-white shadow-none" onClick={() => window.open("/app/flows", "_blank")}>Manage</Button></div>
      </div>
    </div>
  );
  if (button.type === "COPY_CODE") return <div className="flex items-center gap-3"><Link size={16} className="text-ink-800/40 shrink-0 mt-6" /><div className="flex-1"><Input label="Offer code (used when sending)" value={button.offerCode} className="rounded-[5px] shadow-none" onChange={(e) => setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, offerCode: e.target.value } : item))} placeholder="SAVE10" hint="Template creation only sets the button; the code is provided at send time." /></div></div>;
  return null;
}

function UrlFields({ button, setCtaButtons }: { button: CtaButton; setCtaButtons: React.Dispatch<React.SetStateAction<CtaButton[]>> }) {
  const urlMode = button.urlMode ?? (extractVariableIndexes(button.url).length > 0 ? "dynamic" : "static");
  const placeholderCount = extractVariableIndexes(button.url).length;
  const urlValid = button.url.trim() ? isValidHttpsSampleUrl(button.url) : true;
  const sampleValid = button.urlExample ? isValidHttpsSampleUrl(button.urlExample) : true;
  const deriveDynamicUrlPattern = (sample: string) => {
    const raw = String(sample || "").trim();
    if (!raw || !isValidHttpsSampleUrl(raw)) return "";
    const hashIndex = raw.indexOf("#");
    const hashPart = hashIndex >= 0 ? raw.slice(hashIndex) : "";
    const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
    const queryIndex = withoutHash.indexOf("?");
    const queryPart = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
    const baseAndPath = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
    const firstSlash = baseAndPath.indexOf("/", 8);
    const base = firstSlash >= 0 ? baseAndPath.slice(0, firstSlash) : baseAndPath;
    const path = firstSlash >= 0 ? baseAndPath.slice(firstSlash) : "";
    const parts = path.split("/").filter(Boolean);
    const nextPath = parts.length === 0 ? "/{{1}}" : `/${[...parts.slice(0, -1), "{{1}}"].join("/")}`;
    return `${base}${nextPath}${queryPart}${hashPart}`;
  };
  return <div className="flex items-center gap-3"><Link size={16} className="text-ink-800/40 shrink-0 mt-6" /><div className="flex-1"><div className="mb-3 flex items-center justify-between gap-3"><div className="text-xs font-semibold text-ink-800/80">URL mode</div><div className="flex rounded-[5px] bg-slate-100 p-1"><button type="button" className={["px-3 py-1.5 text-xs font-semibold rounded-[5px]", urlMode === "static" ? "bg-white shadow-sm text-ink-900" : "text-ink-800/70 hover:text-ink-900"].join(" ")} onClick={() => setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, urlMode: "static", url: (() => { const sample = String(item.urlExample || "").trim(); if (sample && isValidHttpsSampleUrl(sample)) return sample; return String(item.url || "").replace(/%7B%7B1%7D%7D/gi, "{{1}}"); })(), urlExample: "" } : item))}>Static</button><button type="button" className={["px-3 py-1.5 text-xs font-semibold rounded-[5px]", urlMode === "dynamic" ? "bg-white shadow-sm text-ink-900" : "text-ink-800/70 hover:text-ink-900"].join(" ")} onClick={() => setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, urlMode: "dynamic", url: "", urlExample: "" } : item))}>Dynamic</button></div></div>{urlMode === "static" ? <><Input label="URL" value={button.url} className="rounded-[5px] shadow-none" onChange={(e) => setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, url: e.target.value } : item))} placeholder="https://example.co.in/offer" hint="Static URL must not contain variables. Use a full https:// URL." required />{!urlValid ? <div className="mt-1 text-xs text-rose-700">Enter a valid https:// URL with a real domain extension.</div> : null}{placeholderCount > 0 ? <div className="mt-1 text-xs text-rose-700">Static URL cannot contain template variables. Switch to Dynamic or remove placeholders.</div> : null}</> : <div className="mt-1"><Input label="Sample URL (required)" value={button.urlExample || ""} className="rounded-[5px] shadow-none" onChange={(e) => { const nextSample = e.target.value; const derived = deriveDynamicUrlPattern(nextSample); setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, urlExample: nextSample, url: derived || item.url } : item)); }} placeholder="https://example.co.in/offer/OD-18421" hint="URL must be a full https:// URL with a valid domain extension (.co, .in, .co.in, etc)." required />{!button.urlExample?.trim() ? <div className="mt-1 text-xs text-rose-700">Dynamic URL requires at least one variable like {"{{1}}"} in the URL.</div> : !sampleValid ? <div className="mt-1 text-xs text-rose-700">Enter a valid https:// sample URL for Meta review.</div> : !button.url.trim() ? <div className="mt-1 text-xs text-rose-700">Unable to generate dynamic URL pattern. Please re-check the sample URL format.</div> : null}</div>}</div></div>;
}
