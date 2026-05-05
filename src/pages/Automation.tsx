import React, { useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

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
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    API.templates
      .list()
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {});
  }, []);

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

  return (
    <div className="grid gap-6">
      <div className="rounded-[5px] bg-white/60 p-6 ring-1 ring-ink-900/10 backdrop-blur">
        <div className="text-xs font-semibold text-ink-800/60">Automation</div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Trigger event</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          Calls <span className="font-semibold">POST /trigger-event</span>. In production you can
          call it from your app using <span className="font-semibold">X-API-Key</span>.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-lg font-black tracking-tight">Send on event</div>

        <form className="mt-5 grid gap-3" onSubmit={onTrigger}>
          {error ? <Alert>{error}</Alert> : null}
          {ok ? (
            <div className="rounded-[5px] bg-brand-50 px-4 py-3 text-sm text-ink-900 ring-1 ring-brand-200">
              {ok}
            </div>
          ) : null}

          <Input
            label="Event name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />
          <Input
            label="Phone (E.164)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="919999999999"
            required
          />
          <Select
            label="Approved template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            required
          >
            <option value="">Select...</option>
            {approved.map((template) => (
              <option key={template._id} value={template._id}>
                {template.name} ({template.language})
              </option>
            ))}
          </Select>

          {selectedTemplateSummary.bodyVariableCount > 0 ? (
            <Input
              label={`Variables (${selectedTemplateSummary.bodyVariableCount} required)`}
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder="John, 123456"
            />
          ) : null}

          {selectedTemplateSummary.otpButtons > 0 ? (
            <Input
              label="OTP Code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              required
            />
          ) : null}

          {selectedTemplateSummary.dynamicUrlButtons > 0 ? (
            <Input
              label="Dynamic URL values (comma-separated)"
              value={buttonValues}
              onChange={(e) => setButtonValues(e.target.value)}
              placeholder="order-123"
            />
          ) : null}

          <Button type="submit" disabled={busy}>
            {busy ? "Triggering..." : "Trigger"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
