import { CsvField } from "@modules/automation-flows/components/CsvField";
import { Select } from "@components/ui/Select";
import { NODE_META, nodePreview } from "@modules/automation-flows/nodeCatalog";
import type { BuilderNode, FlowTrigger, TriggerType } from "@modules/automation-flows/types";

interface FlowSettingsPanelProps {
  trigger: FlowTrigger;
  nodes: BuilderNode[];
  fallbackNodeId: string | null;
  handoverNodeId: string | null;
  onTriggerChange: (trigger: FlowTrigger) => void;
  onFallbackChange: (nodeId: string | null) => void;
  onHandoverChange: (nodeId: string | null) => void;
}

const TRIGGER_HELP: Record<Exclude<TriggerType, null>, string> = {
  keyword: "Keyword trigger starts flow when user sends matching text.",
  template_button: "Template button trigger starts flow when user clicks a configured button payload.",
  ctwa: "CTWA trigger starts flow from a configured click-to-WhatsApp payload.",
  manual: "Manual trigger means flow can only be started manually from contact or conversation pages.",
};

export function FlowSettingsPanel({
  trigger,
  nodes,
  fallbackNodeId,
  handoverNodeId,
  onTriggerChange,
  onFallbackChange,
  onHandoverChange,
}: Readonly<FlowSettingsPanelProps>) {
  function nodeLabel(node: BuilderNode) {
    const title = NODE_META[node.data.nodeType].label;
    const preview = nodePreview(node.data.nodeType, node.data.config);
    return `${title} - ${preview.slice(0, 42)}`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-black text-slate-900">Flow Settings</h2>
        <p className="mt-1 text-xs font-medium text-slate-400">Configure entry and fallback behavior.</p>
      </div>
      <Select
        label="Trigger type"
        value={trigger.type || ""}
        onChange={(event) => onTriggerChange({ ...trigger, type: (event.target.value || null) as TriggerType })}
      >
        <option value="">Select trigger...</option>
        <option value="keyword">Keyword</option>
        <option value="template_button">Template button</option>
        <option value="ctwa">Click-to-WhatsApp</option>
        <option value="manual">Manual</option>
      </Select>
      {trigger.type ? (
        <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
          {TRIGGER_HELP[trigger.type]}
        </p>
      ) : null}
      {trigger.type === "keyword" ? (
        <>
          <Select label="Match mode" value={trigger.matchMode} onChange={(event) => onTriggerChange({ ...trigger, matchMode: event.target.value as FlowTrigger["matchMode"] })}>
            <option value="exact">Exact</option>
            <option value="contains">Contains</option>
            <option value="regex">Regular expression</option>
          </Select>
          <CsvField label="Keywords" value={trigger.keywords} onChange={(keywords) => onTriggerChange({ ...trigger, keywords })} placeholder="hello, pricing, support" />
        </>
      ) : null}
      {trigger.type === "template_button" ? (
        <CsvField label="Template button payloads" value={trigger.templateButtonPayloads} onChange={(templateButtonPayloads) => onTriggerChange({ ...trigger, templateButtonPayloads })} placeholder="GET_STARTED, TRACK_ORDER" />
      ) : null}
      {trigger.type === "ctwa" ? (
        <CsvField label="CTWA payloads" value={trigger.ctwaPayloads} onChange={(ctwaPayloads) => onTriggerChange({ ...trigger, ctwaPayloads })} placeholder="campaign_payload" />
      ) : null}
      <Select label="Fallback node" value={fallbackNodeId || ""} onChange={(event) => onFallbackChange(event.target.value || null)}>
        <option value="">No fallback node</option>
        {nodes.filter((node) => node.data.nodeType !== "start").map((node) => (
          <option key={node.id} value={node.id}>{nodeLabel(node)}</option>
        ))}
      </Select>
      <Select label="Handover node" value={handoverNodeId || ""} onChange={(event) => onHandoverChange(event.target.value || null)}>
        <option value="">No handover node</option>
        {nodes.filter((node) => node.data.nodeType === "request_intervention").map((node) => (
          <option key={node.id} value={node.id}>{nodeLabel(node)}</option>
        ))}
      </Select>
    </div>
  );
}
