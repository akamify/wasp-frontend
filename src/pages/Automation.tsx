import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { AutomationSkeleton } from "../components/ui/Skeletons";
import { RefreshCw, Workflow, CheckCircle2, Terminal, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "../utils/cn";
import { useToast } from "../context/ToastContext";

type TemplateComponent = {
  type: string;
  text?: string;
  buttons?: Array<{
    type: string;
    text?: string;
    url?: string;
  }>;
};

type Template = {
  _id: string;
  name: string;
  status: string;
  language: string;
  category: "marketing" | "utility" | "authentication";
  components?: TemplateComponent[];
};

function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function maxPlaceholderIndex(text?: string) {
  const source = String(text || "");
  const matches = source.matchAll(/\{\{(\d+)\}\}/g);
  let max = 0;

  for (const match of matches) {
    const index = Number(match[1]);
    if (Number.isFinite(index) && index > max) {
      max = index;
    }
  }

  return max;
}

function hasDynamicUrl(url?: string) {
  return /\{\{\d+\}\}/.test(String(url || ""));
}

function inspectTemplate(template?: Template) {
  const summary = {
    bodyVariableCount: 0,
    otpButtons: 0,
    dynamicUrlButtons: 0,
  };

  for (const component of template?.components || []) {
    if (String(component.type || "").toUpperCase() === "BODY") {
      summary.bodyVariableCount = Math.max(
        summary.bodyVariableCount,
        maxPlaceholderIndex(component.text)
      );
    }

    if (String(component.type || "").toUpperCase() === "BUTTONS") {
      (component.buttons || []).forEach((button) => {
        const type = String(button.type || "").toUpperCase();
        if (type === "OTP") {
          summary.otpButtons += 1;
        }
        if (type === "URL" && hasDynamicUrl(button.url)) {
          summary.dynamicUrlButtons += 1;
        }
      });
    }
  }

  return summary;
}

export default function AutomationPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [eventName, setEventName] = useState("user_registered");
  const [phone, setPhone] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [variables, setVariables] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [buttonValues, setButtonValues] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const isInitialLoad = useRef(true);
  const { toast } = useToast();

  const loadTemplates = useCallback(async () => {
    const isFirst = isInitialLoad.current;
    if (isFirst) setLoading(true);
    setSyncing(true);
    try {
      const data = await API.templates.list();
      setTemplates(data.templates || []);
      if (!isFirst) toast("Templates refreshed", "success");
    } catch (e) {
      console.error("Failed to load templates", e);
    } finally {
      setLoading(false);
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const approved = useMemo(
    () => templates.filter((template) => template.status === "approved"),
    [templates]
  );

  const selectedTemplate = useMemo(
    () => approved.find((template) => template._id === templateId),
    [approved, templateId]
  );

  const selectedTemplateSummary = useMemo(
    () => inspectTemplate(selectedTemplate),
    [selectedTemplate]
  );

  async function onTrigger(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);

    try {
      const res = await API.automation.triggerEvent({
        eventName,
        phone,
        templateId,
        variables: parseCommaList(variables),
        otpCode: otpCode.trim(),
        buttonValues: parseCommaList(buttonValues),
      });

      setOk(
        `Triggered. Event ID: ${res.event?._id} | Message: ${
          res.message?.whatsappMessageId || res.message?._id
        }`
      );
    } catch (e: any) {
      setError(e?.response?.data?.message || "Trigger failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
    <div className="p-4 md:p-8">
      <AutomationSkeleton />
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Automation</h1>
          <p className="mt-2 text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Trigger platform events via API or Manual Test</p>
        </div>
        <Button 
          variant="ghost" 
          onClick={loadTemplates} 
          disabled={loading || syncing}
          className="h-10 border border-ink-900/10 bg-white gap-2 shadow-sm"
        >
          <RefreshCw size={16} className={cn(syncing && "animate-spin")} />
          {syncing ? "Syncing..." : "Refresh Templates"}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Card className="p-6 md:p-8 border-ink-900/5 shadow-xl shadow-ink-900/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-[5px] bg-brand-50 flex items-center justify-center text-brand-600">
              <Workflow size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-ink-900">Trigger Event</h2>
              <p className="text-xs font-bold text-ink-800/40 uppercase tracking-wider">Simulate an external API call</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={onTrigger}>
            {error ? <Alert tone="error">{error}</Alert> : null}
            {ok ? (
              <div className="rounded-[5px] bg-brand-50 border border-brand-100 p-4 flex items-start gap-3">
                <CheckCircle2 className="text-brand-600 mt-0.5" size={18} />
                <div className="text-sm font-semibold text-brand-900">{ok}</div>
              </div>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Event Identifier"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. order_completed"
                hint="Used to identify the event in your backend"
                required
              />
              <Input
                label="Recipient Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="919999999999"
                hint="E.164 format without +"
                required
              />
            </div>

            <Select
              label="WhatsApp Template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              required
              className="bg-slate-50/50"
            >
              <option value="">Choose an approved template...</option>
              {approved.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name} ({template.language.toUpperCase()})
                </option>
              ))}
            </Select>

            {selectedTemplate && (
              <div className="rounded-[5px] border border-ink-900/5 bg-slate-50/50 p-5 space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Template Requirements</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-ink-900">Variables</div>
                    <Badge tone={selectedTemplateSummary.bodyVariableCount > 0 ? "warn" : "neutral"} className="rounded-[3px]">
                      {selectedTemplateSummary.bodyVariableCount} required
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-ink-900">OTP Code</div>
                    <Badge tone={selectedTemplateSummary.otpButtons > 0 ? "good" : "neutral"} className="rounded-[3px]">
                      {selectedTemplateSummary.otpButtons > 0 ? "Enabled" : "Not needed"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-ink-900">Dynamic URL</div>
                    <Badge tone={selectedTemplateSummary.dynamicUrlButtons > 0 ? "brand" : "neutral"} className="rounded-[3px]">
                      {selectedTemplateSummary.dynamicUrlButtons > 0 ? "Active" : "Static"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 space-y-4">
                  {selectedTemplateSummary.bodyVariableCount > 0 && (
                    <Input
                      label="Template Variables"
                      value={variables}
                      onChange={(e) => setVariables(e.target.value)}
                      placeholder="John, USD 250, #9988"
                      hint="Comma separated values for {{1}}, {{2}}, etc."
                    />
                  )}

                  {selectedTemplateSummary.otpButtons > 0 && (
                    <Input
                      label="OTP Code Override"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6 digit code"
                      required
                    />
                  )}

                  {selectedTemplateSummary.dynamicUrlButtons > 0 && (
                    <Input
                      label="Button URL Suffix"
                      value={buttonValues}
                      onChange={(e) => setButtonValues(e.target.value)}
                      placeholder="inv-2024-001"
                      hint="Value to append to the dynamic URL button"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button type="submit" disabled={busy} className="w-full md:w-auto h-12 px-12 gap-2 text-base font-black">
                {busy ? "Triggering..." : "Run Test Event"}
                <ChevronRight size={20} />
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 border-ink-900/5 bg-ink-900 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-[5px] bg-white/10 flex items-center justify-center">
                <Terminal size={20} className="text-brand-400" />
              </div>
              <h3 className="font-black tracking-tight">API Reference</h3>
            </div>
            <p className="text-xs font-medium text-white/60 leading-relaxed">
              Integrate this event into your application by calling our trigger endpoint.
            </p>
            <div className="mt-4 rounded-[5px] bg-black/40 p-4 font-mono text-[11px] text-brand-300 overflow-x-auto border border-white/5">
              <div className="text-white/40 mb-1"># POST /trigger-event</div>
              <div>curl -X POST "{API.baseUrl}/trigger-event" \</div>
              <div>  -H "X-API-Key: YOUR_KEY" \</div>
              <div>{`  -d '{ "eventName": "${eventName || "..."}", "phone": "..." }'`}</div>
            </div>
          </Card>

          <Card className="p-6 border-ink-900/5 shadow-xl shadow-ink-900/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-[5px] bg-slate-50 flex items-center justify-center text-ink-900">
                <AlertCircle size={20} />
              </div>
              <h3 className="font-black tracking-tight text-ink-900">Usage Note</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-xs font-semibold text-ink-800/60">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                Templates must be in 'approved' status to be triggered.
              </li>
              <li className="flex items-start gap-2 text-xs font-semibold text-ink-800/60">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                Variables are matched by order in the comma-separated list.
              </li>
              <li className="flex items-start gap-2 text-xs font-semibold text-ink-800/60">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                Meta charges apply for every triggered template message.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
