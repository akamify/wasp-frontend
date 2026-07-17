import { Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { ActionNodeSettings } from "@modules/automation-flows/components/ActionNodeSettings";
import { ListNodeSettings } from "@modules/automation-flows/components/ListNodeSettings";
import { MessageNodeSettings } from "@modules/automation-flows/components/MessageNodeSettings";
import { NODE_META } from "@modules/automation-flows/nodeCatalog";
import type { BuilderNode, FlowNodeConfig } from "@modules/automation-flows/types";

interface NodeSettingsPanelProps {
  node: BuilderNode;
  nodes: BuilderNode[];
  flowId?: string;
  onConfigChange: (config: FlowNodeConfig) => void;
  onHandleRename: (oldHandle: string, newHandle: string) => void;
  onDelete: () => void;
}

const MESSAGE_TYPES = new Set([
  "text",
  "text_buttons",
  "ask_question",
  "media",
  "template",
  "end",
]);

function apiContextKeys(nodes: BuilderNode[]) {
  const keys = new Set<string>();
  for (const item of nodes) {
    if (item.data.nodeType !== "api_request") continue;
    const mapping = item.data.config.responseMapping;
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) continue;
    Object.keys(mapping).forEach((key) => {
      if (key.trim()) keys.add(key.trim());
    });
  }
  return Array.from(keys).sort();
}

export function NodeSettingsPanel({
  node,
  nodes,
  flowId,
  onConfigChange,
  onHandleRename,
  onDelete,
}: Readonly<NodeSettingsPanelProps>) {
  const type = node.data.nodeType;
  const meta = NODE_META[type];
  const Icon = meta.icon;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-brand-50 text-brand-700">
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-slate-900">{meta.label}</h2>
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{node.id}</p>
        </div>
        {type !== "start" ? (
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-rose-600 hover:bg-rose-50" aria-label="Delete node">
            <Trash2 size={16} />
          </Button>
        ) : null}
      </div>

      {type === "start" ? (
        <div className="rounded-[5px] border border-brand-100 bg-brand-50 p-4 text-xs font-medium leading-5 text-brand-800">
          This is the required entry point. Connect it to the first step in your flow.
        </div>
      ) : null}
      {MESSAGE_TYPES.has(type) ? (
        <MessageNodeSettings
          type={type}
          config={node.data.config}
          availableContextKeys={apiContextKeys(nodes)}
          flowId={flowId}
          nodeId={node.id}
          onChange={onConfigChange}
          onHandleRename={onHandleRename}
        />
      ) : null}
      {type === "list" ? (
        <ListNodeSettings config={node.data.config} onChange={onConfigChange} onHandleRename={onHandleRename} />
      ) : null}
      {["condition", "delay", "wait_for_reply", "variable", "fallback", "set_tag", "set_attribute", "api_request", "request_intervention"].includes(type) ? (
        <ActionNodeSettings
          type={type}
          config={node.data.config}
          flowId={flowId}
          nodeId={node.id}
          onChange={onConfigChange}
        />
      ) : null}
    </div>
  );
}
