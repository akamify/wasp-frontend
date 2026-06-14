import { NODE_CATALOG } from "@modules/automation-flows/nodeCatalog";
import type { FlowNodeType } from "@modules/automation-flows/types";

interface NodePaletteProps {
  onAdd: (type: FlowNodeType) => void;
}

export function NodePalette({ onAdd }: Readonly<NodePaletteProps>) {
  function startDrag(event: React.DragEvent<HTMLButtonElement>, type: FlowNodeType) {
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="relative z-20 hidden w-[240px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 custom-scrollbar md:block xl:w-[260px]">
      <div className="mb-4">
        <h2 className="text-sm font-black text-slate-900">Content Blocks</h2>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
          Drag a block onto the canvas. Click is available as a quick fallback.
        </p>
      </div>
      {(["content", "action"] as const).map((group) => (
        <div key={group} className="mb-5">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {group === "content" ? "Messages" : "Actions"}
          </div>
          <div className="space-y-2">
            {NODE_CATALOG.filter((item) => item.group === group).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  draggable
                  onDragStart={(event) => startDrag(event, item.type)}
                  onClick={() => onAdd(item.type)}
                  className="group flex w-full cursor-grab items-center gap-3 rounded-[8px] border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-md active:cursor-grabbing active:scale-[0.98]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-slate-100 text-slate-600 transition group-hover:bg-brand-100 group-hover:text-brand-700">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-800">{item.label}</div>
                    <div className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{item.description}</div>
                  </div>
                  <div className="ml-auto grid grid-cols-2 gap-0.5 opacity-30 transition group-hover:opacity-70" aria-hidden="true">
                    {[1, 2, 3, 4, 5, 6].map((dot) => <span key={dot} className="h-1 w-1 rounded-full bg-slate-500" />)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
