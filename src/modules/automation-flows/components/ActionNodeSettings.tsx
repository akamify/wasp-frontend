import { useState } from "react";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { Button } from "@components/ui/Button";
import { CsvField } from "@modules/automation-flows/components/CsvField";
import { KeyValueEditor } from "@modules/automation-flows/components/KeyValueEditor";
import {
  configMap,
  configNumber,
  configString,
  configStrings,
} from "@modules/automation-flows/configUtils";
import type { FlowNodeConfig, FlowNodeType } from "@modules/automation-flows/types";
import { flowsApi } from "@modules/automation-flows/flowsApi";

interface ActionNodeSettingsProps {
  type: FlowNodeType;
  config: FlowNodeConfig;
  flowId?: string;
  nodeId?: string;
  onChange: (config: FlowNodeConfig) => void;
}

type MappingType = "string" | "number" | "boolean" | "url" | "json";
const FORBIDDEN_HEADERS = new Set(["host", "content-length", "connection", "transfer-encoding"]);
const SENSITIVE_CONTEXT_KEY_PATTERN = /(token|secret|password|apikey|api_key|authorization)/i;

interface MappingRow {
  contextKey: string;
  path: string;
  type: MappingType;
  fallback: string;
}

function mappingRows(value: FlowNodeConfig["responseMapping"]): MappingRow[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).map(([contextKey, mapping]) => {
    if (typeof mapping === "string") {
      return { contextKey, path: mapping, type: "string", fallback: "" };
    }
    const item = mapping as { path?: unknown; type?: unknown; fallback?: unknown };
    return {
      contextKey,
      path: String(item.path || ""),
      type: ["string", "number", "boolean", "url", "json"].includes(String(item.type))
        ? (String(item.type) as MappingType)
        : "string",
      fallback: item.fallback === undefined || item.fallback === null ? "" : String(item.fallback),
    };
  });
}

function rowsToMapping(rows: MappingRow[]) {
  return Object.fromEntries(
    rows
      .filter((row) => row.contextKey.trim())
      .map((row) => [
        row.contextKey.trim(),
        {
          path: row.path.trim(),
          type: row.type,
          fallback: row.type === "number" ? Number(row.fallback || 0) : row.fallback,
        },
      ])
  );
}

function invalidJsonBody(method: string, body: string) {
  if (!["POST", "PUT", "PATCH"].includes(method)) return false;
  if (!body.trim()) return false;
  try {
    JSON.parse(body);
    return false;
  } catch {
    return true;
  }
}

function apiConfigWarnings(config: FlowNodeConfig, method: string) {
  const warnings: string[] = [];
  const headers = configMap(config, "headers");
  Object.keys(headers).forEach((header) => {
    if (FORBIDDEN_HEADERS.has(header.trim().toLowerCase())) {
      warnings.push(`Header '${header}' is not allowed.`);
    }
  });
  mappingRows(config.responseMapping).forEach((row) => {
    if (SENSITIVE_CONTEXT_KEY_PATTERN.test(row.contextKey)) {
      warnings.push(`Response mapping key '${row.contextKey}' is sensitive and cannot be stored in flow context.`);
    }
  });
  if (invalidJsonBody(method, configString(config, "body"))) {
    warnings.push("JSON body is invalid.");
  }
  return warnings;
}

function parseJsonObject(value: string, label: string) {
  try {
    const parsed = JSON.parse(value || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: `${label} must be a JSON object.` };
    }
    return { value: parsed as Record<string, unknown> };
  } catch {
    return { error: `${label} JSON is invalid.` };
  }
}

function ResponseMappingEditor({
  value,
  onChange,
}: {
  value: FlowNodeConfig["responseMapping"];
  onChange: (value: Record<string, { path: string; type: MappingType; fallback: string | number }>) => void;
}) {
  const rows = mappingRows(value);
  function update(index: number, patch: Partial<MappingRow>) {
    const next = [...rows];
    next[index] = { ...next[index], ...patch };
    onChange(rowsToMapping(next));
  }
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-ink-800/80">Response mapping</div>
      {rows.map((row, index) => (
        <div key={`${row.contextKey}-${index}`} className="space-y-2 rounded-[5px] border border-slate-200 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Input value={row.contextKey} onChange={(event) => update(index, { contextKey: event.target.value })} placeholder="productName" />
            <Input value={row.path} onChange={(event) => update(index, { path: event.target.value })} placeholder="product.name" />
          </div>
          <div className="grid grid-cols-[120px_1fr_auto] gap-2">
            <Select value={row.type} onChange={(event) => update(index, { type: event.target.value as MappingType })}>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="url">URL</option>
              <option value="json">JSON</option>
            </Select>
            <Input value={row.fallback} onChange={(event) => update(index, { fallback: event.target.value })} placeholder="Fallback" />
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(rowsToMapping(rows.filter((_, rowIndex) => rowIndex !== index)))}>Remove</Button>
          </div>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => onChange(rowsToMapping([...rows, { contextKey: `value${rows.length + 1}`, path: "", type: "string", fallback: "" }]))}>Add mapping</Button>
      <p className="text-[11px] font-medium leading-5 text-slate-400">
        Map API response fields into context, then use those fields in Template Message variable mapping.
      </p>
    </div>
  );
}

export function ActionNodeSettings({
  type,
  config,
  flowId,
  nodeId,
  onChange,
}: Readonly<ActionNodeSettingsProps>) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<unknown>(null);
  const [sampleContext, setSampleContext] = useState(
    '{\n  "orderId": "ORD-1001",\n  "productSlug": "cube-jaggery",\n  "static": {\n    "companyName": "Amila Gold",\n    "supportPhone": "+910000000000"\n  }\n}'
  );
  const [sampleContact, setSampleContact] = useState(
    '{\n  "name": "Customer",\n  "phone": "919999999999",\n  "email": "customer@example.com"\n}'
  );
  const [sampleAttributes, setSampleAttributes] = useState(
    '{\n  "orderId": "ORD-1001",\n  "city": "Jaipur"\n}'
  );
  if (type === "condition") {
    return (
      <>
        <Select label="Value source" value={configString(config, "sourceType", "contact_attribute")} onChange={(event) => onChange({ ...config, sourceType: event.target.value })}>
          <option value="contact_attribute">Contact attribute</option>
          <option value="contact_field">Contact field</option>
          <option value="context">Flow context</option>
          <option value="inbound">Inbound message</option>
          <option value="static">Static variable</option>
        </Select>
        <Input label="Source key" value={configString(config, "sourceKey")} onChange={(event) => onChange({ ...config, sourceKey: event.target.value })} placeholder="city, lastAnswer, text" />
        <Select label="Operator" value={configString(config, "operator", "equals")} onChange={(event) => onChange({ ...config, operator: event.target.value })}>
          <option value="equals">Equals</option>
          <option value="not_equals">Does not equal</option>
          <option value="contains">Contains</option>
          <option value="not_contains">Does not contain</option>
          <option value="starts_with">Starts with</option>
          <option value="ends_with">Ends with</option>
          <option value="exists">Exists</option>
          <option value="not_exists">Does not exist</option>
          <option value="gt">Greater than</option>
          <option value="gte">Greater than or equal</option>
          <option value="lt">Less than</option>
          <option value="lte">Less than or equal</option>
        </Select>
        {!["exists", "not_exists"].includes(configString(config, "operator", "equals")) ? (
          <Input label="Compare value" value={configString(config, "compareValue")} onChange={(event) => onChange({ ...config, compareValue: event.target.value })} placeholder="Jaipur" />
        ) : null}
        <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
          Connect the True and False handles to control the next step.
        </p>
      </>
    );
  }
  if (type === "delay") {
    return (
      <>
        <div className="grid grid-cols-[1fr_130px] gap-2">
          <Input label="Delay amount" type="number" min={1} max={1440} value={configNumber(config, "amount", 1)} onChange={(event) => onChange({ ...config, amount: Number(event.target.value) })} />
          <Select label="Unit" value={configString(config, "unit", "minutes")} onChange={(event) => onChange({ ...config, unit: event.target.value })}>
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </Select>
        </div>
        <p className="rounded-[5px] bg-amber-50 p-3 text-[11px] font-medium leading-5 text-amber-800">
          Delays resume through the flow-session worker. Keep long delays inside WhatsApp's 24-hour customer window unless the next message is a template.
        </p>
      </>
    );
  }
  if (type === "wait_for_reply") {
    return (
      <>
        <Textarea label="Prompt message (optional)" value={configString(config, "prompt")} onChange={(event) => onChange({ ...config, prompt: event.target.value })} hint="Leave empty if a previous node already asked the question." />
        <Select label="Expected reply type" value={configString(config, "inputType", "text")} onChange={(event) => onChange({ ...config, inputType: event.target.value })}>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </Select>
        <Input label="Save to contact attribute" value={configString(config, "saveToAttribute")} onChange={(event) => onChange({ ...config, saveToAttribute: event.target.value })} placeholder="budget, city, email" />
        <Input label="Timeout minutes" type="number" min={1} max={600} value={configNumber(config, "timeoutMinutes", 30)} onChange={(event) => onChange({ ...config, timeoutMinutes: Number(event.target.value) })} />
        <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
          Reply handle continues after a valid reply. Timeout handle runs if the customer does not reply in time.
        </p>
      </>
    );
  }
  if (type === "variable") {
    return (
      <>
        <Select label="Action" value={configString(config, "action", "set")} onChange={(event) => onChange({ ...config, action: event.target.value })}>
          <option value="set">Set variable</option>
          <option value="clear">Clear variable</option>
        </Select>
        <Input label="Variable name" value={configString(config, "name")} onChange={(event) => onChange({ ...config, name: event.target.value })} placeholder="leadScore" />
        {configString(config, "action", "set") !== "clear" ? (
          <>
            <Select label="Value type" value={configString(config, "valueType", "string")} onChange={(event) => onChange({ ...config, valueType: event.target.value })}>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </Select>
            <Input label="Value" value={configString(config, "value")} onChange={(event) => onChange({ ...config, value: event.target.value })} placeholder="{{context.lastAnswer}}" />
          </>
        ) : null}
        <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
          Variables are saved in flow context only. Use Set Attribute for permanent contact data.
        </p>
      </>
    );
  }
  if (type === "fallback") {
    return (
      <>
        <Textarea label="Fallback message" value={configString(config, "message")} onChange={(event) => onChange({ ...config, message: event.target.value })} />
        <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
          Select this node as Flow Settings → Fallback node. After sending this message, connect it back to the question/list/buttons node or to handover/end.
        </p>
      </>
    );
  }
  if (type === "set_tag") {
    return (
      <>
        <Select label="Action" value={configString(config, "action", "add")} onChange={(event) => onChange({ ...config, action: event.target.value })}>
          <option value="add">Add tags</option>
          <option value="remove">Remove tags</option>
        </Select>
        <CsvField label="Tags" value={configStrings(config, "tags")} onChange={(tags) => onChange({ ...config, tags })} placeholder="lead, qualified, support" />
      </>
    );
  }
  if (type === "set_attribute") {
    return (
      <KeyValueEditor
        label="Contact attributes"
        value={configMap(config, "attributes")}
        onChange={(attributes) => onChange({ ...config, attributes })}
        keyPlaceholder="source"
        valuePlaceholder="chatbot"
      />
    );
  }
  if (type === "request_intervention") {
    return (
      <>
        <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
          Handover messages are static. Use Template Message node before handover if you need approved template variables.
        </p>
        <Textarea label="Handover message" value={configString(config, "message")} onChange={(event) => onChange({ ...config, message: event.target.value })} />
        <Input label="Assign team ID" value={configString(config, "assignToTeamId")} onChange={(event) => onChange({ ...config, assignToTeamId: event.target.value })} hint="Optional. Team selector is not available in the current frontend API." />
      </>
    );
  }
  const method = configString(config, "method", "GET");
  const showBody = ["POST", "PUT", "PATCH"].includes(method);
  const warnings = apiConfigWarnings(config, method);
  async function testApi() {
    if (warnings.length) {
      setTestResult({ ok: false, message: warnings.join(" ") });
      return;
    }
    const contextResult = parseJsonObject(sampleContext, "Sample context");
    const contactResult = parseJsonObject(sampleContact, "Sample contact");
    const attributesResult = parseJsonObject(sampleAttributes, "Sample attributes");
    const sampleError = contextResult.error || contactResult.error || attributesResult.error;
    if (sampleError) {
      setTestResult({ ok: false, message: sampleError });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await flowsApi.testApiRequest({
        flowId,
        nodeId,
        config,
        sampleContext: contextResult.value,
        sampleContact: contactResult.value,
        sampleAttributes: attributesResult.value,
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({ ok: false, message: error instanceof Error ? error.message : "API test failed" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <Select label="Request method" value={method} onChange={(event) => onChange({ ...config, method: event.target.value })}>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </Select>
      <Input label="Request URL" value={configString(config, "url")} onChange={(event) => onChange({ ...config, url: event.target.value })} placeholder="https://api.example.com/orders/{{context.orderId}}" />
      <KeyValueEditor label="Query params" value={configMap(config, "queryParams")} onChange={(queryParams) => onChange({ ...config, queryParams })} keyPlaceholder="phone" valuePlaceholder="{{contact.phone}}" />
      <KeyValueEditor label="Headers" value={configMap(config, "headers")} onChange={(headers) => onChange({ ...config, headers })} keyPlaceholder="Authorization" valuePlaceholder="Bearer {{static.apiToken}}" />
      <p className="text-[11px] font-medium leading-5 text-slate-400">Sensitive headers like Authorization, x-api-key, api-key, and cookies are masked in logs.</p>
      {showBody ? (
        <Textarea label="JSON body" value={configString(config, "body")} onChange={(event) => onChange({ ...config, body: event.target.value })} hint="JSON or text. Request variables are supported for API calls only." />
      ) : null}
      <Input label="Timeout ms" type="number" min={1000} max={30000} value={configNumber(config, "timeoutMs", 10000)} onChange={(event) => onChange({ ...config, timeoutMs: Number(event.target.value) })} />
      <ResponseMappingEditor value={config.responseMapping} onChange={(responseMapping) => onChange({ ...config, responseMapping })} />
      <details className="rounded-[5px] border border-slate-200 p-3">
        <summary className="cursor-pointer text-xs font-bold text-slate-700">Editable test sample data</summary>
        <div className="mt-3 space-y-3">
          <Textarea label="Sample context JSON" value={sampleContext} onChange={(event) => setSampleContext(event.target.value)} />
          <Textarea label="Sample contact JSON" value={sampleContact} onChange={(event) => setSampleContact(event.target.value)} />
          <Textarea label="Sample attributes JSON" value={sampleAttributes} onChange={(event) => setSampleAttributes(event.target.value)} />
        </div>
      </details>
      {warnings.length ? (
        <div className="rounded-[5px] border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-800">
          {warnings.map((warning) => <div key={warning}>{warning}</div>)}
        </div>
      ) : null}
      <Button type="button" variant="outline" onClick={() => void testApi()} disabled={testing}>
        {testing ? "Testing..." : "Test API"}
      </Button>
      {testResult ? (
        <pre className="max-h-72 overflow-auto rounded-[5px] bg-slate-950 p-3 text-[11px] leading-5 text-slate-50">
          {JSON.stringify(testResult, null, 2)}
        </pre>
      ) : null}
    </>
  );
}
