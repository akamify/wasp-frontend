import { Handle, Position } from "reactflow";
import { Workflow } from "lucide-react";
import type { ScreenNodeData } from "@modules/flow-builder/types";

export function ScreenNode({ data, selected }: { data: ScreenNodeData; selected?: boolean }) {
  return (
    <div className={`min-w-[220px] rounded-[6px] border bg-white shadow-sm ${selected ? "border-brand-500 ring-2 ring-brand-200" : "border-slate-200"}`}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <Workflow size={14} className="text-brand-600" />
        <div className="text-sm font-black text-slate-900">{data.title}</div>
      </div>
      <div className="space-y-1 px-3 py-2">
        {(data.components || []).length === 0 ? (
          <div className="text-xs text-slate-400">No components</div>
        ) : (
          (data.components || []).slice(0, 5).map((c) => (
            <div key={c.id} className="rounded-[4px] bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
              {c.type}
            </div>
          ))
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
