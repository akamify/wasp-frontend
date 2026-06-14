import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { CsvField } from "@modules/automation-flows/components/CsvField";
import { KeyValueEditor } from "@modules/automation-flows/components/KeyValueEditor";
import {
  configMap,
  configNumber,
  configString,
  configStrings,
} from "@modules/automation-flows/configUtils";
import type { FlowNodeConfig, FlowNodeType } from "@modules/automation-flows/types";

interface ActionNodeSettingsProps {
  type: FlowNodeType;
  config: FlowNodeConfig;
  onChange: (config: FlowNodeConfig) => void;
}

export function ActionNodeSettings({
  type,
  config,
  onChange,
}: Readonly<ActionNodeSettingsProps>) {
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
        <Textarea label="Handover message" value={configString(config, "message")} onChange={(event) => onChange({ ...config, message: event.target.value })} />
        <Input label="Assign team ID" value={configString(config, "assignToTeamId")} onChange={(event) => onChange({ ...config, assignToTeamId: event.target.value })} hint="Optional. Team selector is not available in the current frontend API." />
      </>
    );
  }
  return (
    <>
      <Select label="Method" value={configString(config, "method", "GET")} onChange={(event) => onChange({ ...config, method: event.target.value })}>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </Select>
      <Input label="URL" value={configString(config, "url")} onChange={(event) => onChange({ ...config, url: event.target.value })} placeholder="https://api.example.com/orders/{{context.orderId}}" />
      <KeyValueEditor label="Headers" value={configMap(config, "headers")} onChange={(headers) => onChange({ ...config, headers })} keyPlaceholder="Content-Type" valuePlaceholder="application/json" />
      <Textarea label="Body" value={configString(config, "body")} onChange={(event) => onChange({ ...config, body: event.target.value })} hint="JSON or text. Flow variables are supported." />
      <Input label="Timeout ms" type="number" min={1000} max={30000} value={configNumber(config, "timeoutMs", 10000)} onChange={(event) => onChange({ ...config, timeoutMs: Number(event.target.value) })} />
      <KeyValueEditor label="Response mapping" value={configMap(config, "responseMapping")} onChange={(responseMapping) => onChange({ ...config, responseMapping })} keyPlaceholder="orderStatus" valuePlaceholder="status" />
      <p className="text-[11px] font-medium leading-5 text-slate-400">Map response fields into context. Example: orderStatus = status</p>
    </>
  );
}
