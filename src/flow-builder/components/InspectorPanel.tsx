import { Trash2 } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { Input } from "../../components/ui/Input";
import { useFlowBuilderStore } from "../store";

export function InspectorPanel() {
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const updateNodeTitle = useFlowBuilderStore((s) => s.updateNodeTitle);
  const updateComponent = useFlowBuilderStore((s) => s.updateComponent);
  const removeComponent = useFlowBuilderStore((s) => s.removeComponent);
  const { setNodeRef, isOver } = useDroppable({ id: "inspector-dropzone" });

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) {
    return <div className="rounded-[6px] border border-slate-200 bg-white p-4 text-sm text-slate-500">Select a screen node.</div>;
  }

  return (
    <div className="space-y-3 rounded-[6px] border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Inspector</h3>
      <Input label="Screen title" value={node.data.title} onChange={(e) => updateNodeTitle(node.id, e.target.value)} />
      <div ref={setNodeRef} className={`rounded-[5px] border p-2 ${isOver ? "border-brand-500 bg-brand-50/40" : "border-slate-200 bg-slate-50/40"}`}>
        <div className="mb-2 text-[11px] font-bold text-slate-500">Drop components here</div>
        <div className="space-y-2">
          {(node.data.components || []).map((c) => (
            <div key={c.id} className="rounded-[5px] border border-slate-200 bg-white p-2">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-xs font-black text-slate-800">{c.type}</div>
                <button type="button" onClick={() => removeComponent(node.id, c.id)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 size={14} />
                </button>
              </div>
              <Input label="Label" value={c.label} onChange={(e) => updateComponent(node.id, c.id, { label: e.target.value })} />
              {c.type === "TextInput" ? (
                <Input label="Placeholder" value={c.placeholder || ""} onChange={(e) => updateComponent(node.id, c.id, { placeholder: e.target.value })} />
              ) : null}
              {c.type === "Footer" ? (
                <Input label="Next Screen ID" value={c.nextScreenId || ""} onChange={(e) => updateComponent(node.id, c.id, { nextScreenId: e.target.value })} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
