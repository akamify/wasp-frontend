import { useMemo } from "react";
import { useFlowBuilderStore } from "@modules/flow-builder/store";

export function WhatsAppPreview() {
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const node = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || nodes[0], [nodes, selectedNodeId]);

  if (!node) return null;

  return (
    <div className="rounded-[6px] border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Live WhatsApp Preview</h3>
      <div className="mx-auto max-w-[340px] rounded-[20px] border border-slate-300 bg-slate-100 p-2">
        <div className="rounded-[14px] bg-white p-3">
          <div className="mb-2 border-b border-slate-100 pb-2 text-sm font-black text-slate-900">{node.data.title}</div>
          <div className="space-y-2">
            {(node.data.components || []).map((c) => (
              <div key={c.id}>
                {c.type === "Text" ? <p className="text-xs text-slate-700">{c.label}</p> : null}
                {c.type === "TextInput" ? <input readOnly placeholder={c.placeholder || c.label} className="w-full rounded-[6px] border border-slate-200 px-2 py-1 text-xs" /> : null}
                {c.type === "Dropdown" ? <div className="rounded-[6px] border border-slate-200 px-2 py-1 text-xs text-slate-500">{c.label} ▾</div> : null}
                {c.type === "Checkbox" ? <label className="text-xs text-slate-700"><input type="checkbox" className="mr-2" />{c.label}</label> : null}
                {c.type === "Radio" ? <label className="text-xs text-slate-700"><input type="radio" className="mr-2" />{c.label}</label> : null}
                {c.type === "Footer" ? <button className="w-full rounded-[6px] bg-emerald-500 px-2 py-1.5 text-xs font-bold text-white">{c.label}</button> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
