import { Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { ActionNodeSettings } from "@modules/automation-flows/components/ActionNodeSettings";
import { ListNodeSettings } from "@modules/automation-flows/components/ListNodeSettings";
import { MessageNodeSettings } from "@modules/automation-flows/components/MessageNodeSettings";
import { NODE_META } from "@modules/automation-flows/nodeCatalog";
import type { BuilderNode, FlowNodeConfig } from "@modules/automation-flows/types";

interface NodeSettingsPanelProps {
  node: BuilderNode;
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

const VARIABLE_TOKENS = [
  ["Contact", ["{{contact.name}}", "{{contact.phone}}", "{{contact.email}}"]],
  ["Attributes", ["{{attributes.city}}", "{{attributes.orderId}}", "{{attributes.lastProduct}}"]],
  ["Context", ["{{context.productName}}", "{{context.price}}", "{{context.productUrl}}", "{{context.orderStatus}}"]],
  ["Workspace", ["{{workspace.name}}"]],
  ["Flow", ["{{flow.name}}"]],
] as const;

function VariableHelper() {
  async function copyToken(token: string) {
    await navigator.clipboard?.writeText(token).catch(() => undefined);
  }

  return (
    <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-black text-slate-700">Insert variables</div>
      <p className="mt-1 text-[11px] leading-4 text-slate-500">
        Click a token to copy it, then paste it into message text, button titles, template variables, API URL/body, or media captions.
      </p>
      <div className="mt-3 space-y-3">
        {VARIABLE_TOKENS.map(([label, tokens]) => (
          <div key={label}>
            <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              {label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tokens.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => void copyToken(token)}
                  className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NodeSettingsPanel({
  node,
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
      {type !== "start" ? <VariableHelper /> : null}
      {MESSAGE_TYPES.has(type) ? (
        <MessageNodeSettings type={type} config={node.data.config} onChange={onConfigChange} onHandleRename={onHandleRename} />
      ) : null}
      {type === "list" ? (
        <ListNodeSettings config={node.data.config} onChange={onConfigChange} onHandleRename={onHandleRename} />
      ) : null}
      {["set_tag", "set_attribute", "api_request", "request_intervention"].includes(type) ? (
        <ActionNodeSettings type={type} config={node.data.config} onChange={onConfigChange} />
      ) : null}
    </div>
  );
}
