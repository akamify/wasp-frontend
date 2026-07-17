import { memo, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from "reactflow";
import { cn } from "@shared/utils/cn";
import { NODE_META, nodeHasWarning, nodePreview, outputHandles } from "@modules/automation-flows/nodeCatalog";
import type { FlowNodeData } from "@modules/automation-flows/types";

function AutomationNodeView({ id, data, selected }: NodeProps<FlowNodeData>) {
  const meta = NODE_META[data.nodeType];
  const Icon = meta.icon;
  const handles = outputHandles(data.nodeType, data.config);
  const warning = nodeHasWarning(data.nodeType, data.config);
  const updateNodeInternals = useUpdateNodeInternals();
  const accent =
    data.nodeType === "start"
      ? "from-emerald-400 to-brand-600"
      : data.nodeType === "end" || data.nodeType === "request_intervention" || data.nodeType === "fallback"
        ? "from-amber-400 to-orange-500"
        : data.nodeType === "condition"
          ? "from-cyan-400 to-teal-600"
          : data.nodeType === "delay" || data.nodeType === "wait_for_reply"
            ? "from-indigo-400 to-blue-600"
        : data.nodeType === "api_request"
          ? "from-sky-400 to-blue-600"
          : data.nodeType === "set_tag" || data.nodeType === "set_attribute" || data.nodeType === "variable"
            ? "from-violet-400 to-purple-600"
            : "from-brand-400 to-brand-700";

  useEffect(() => {
    updateNodeInternals(id);
  }, [handles.map((handle) => handle.id).join("|"), id, updateNodeInternals]);

  return (
    <div
      className={cn(
        "relative w-[238px] overflow-hidden rounded-[10px] border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.10)] transition",
        selected ? "border-brand-500 ring-4 ring-brand-100" : "border-slate-200"
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r", accent)} />
      {data.nodeType !== "start" ? (
        <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white !bg-slate-400" />
      ) : null}
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-slate-100 text-slate-700">
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-black uppercase tracking-[0.11em] text-slate-800">
            {meta.label}
          </div>
        </div>
        {warning ? <AlertTriangle size={15} className="text-amber-500" aria-label="Configuration incomplete" /> : null}
      </div>
      <div className="bg-gradient-to-b from-white to-slate-50/60 px-3.5 py-3">
        <p className="line-clamp-2 min-h-8 text-xs font-medium leading-4 text-slate-500">
          {nodePreview(data.nodeType, data.config)}
        </p>
        {handles.length > 1 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {handles.slice(0, 4).map((handle) => (
              <span key={handle.id} className="max-w-24 truncate rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                {handle.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {handles.map((handle, index) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={Position.Right}
          style={{ top: `${((index + 1) / (handles.length + 1)) * 100}%` }}
          className="!h-3.5 !w-3.5 !border-[3px] !border-white !bg-brand-600 !shadow"
          title={handle.label}
        />
      ))}
    </div>
  );
}

export const AutomationNode = memo(AutomationNodeView);
