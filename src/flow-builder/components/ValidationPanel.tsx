import { useMemo } from "react";
import { useFlowBuilderStore } from "../store";
import { validateFlow } from "../utils";

export function ValidationPanel() {
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const edges = useFlowBuilderStore((s) => s.edges);
  const issues = useMemo(() => validateFlow(nodes, edges), [nodes, edges]);

  return (
    <div className="rounded-[6px] border border-slate-200 bg-white p-3">
      <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Validation</h3>
      {issues.length === 0 ? (
        <div className="rounded-[5px] bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">No issues found.</div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div key={issue.id} className="rounded-[5px] bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
              {issue.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
