import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { NODE_CATALOG } from "@modules/automation-flows/nodeCatalog";
import type { FlowNodeType } from "@modules/automation-flows/types";
import { cn } from "@shared/utils/cn";

interface NodePaletteProps {
  collapsed: boolean;
  mobileOpen: boolean;
  width: number;
  activeTab: "messages" | "actions";
  onAdd: (type: FlowNodeType) => void;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
  onActiveTabChange: (tab: "messages" | "actions") => void;
}

export function NodePalette({
  collapsed,
  mobileOpen,
  width,
  activeTab,
  onAdd,
  onCloseMobile,
  onToggleCollapsed,
  onActiveTabChange,
}: Readonly<NodePaletteProps>) {
  function startDrag(event: React.DragEvent<HTMLButtonElement>, type: FlowNodeType) {
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside
      className={cn(
        "absolute inset-y-0 left-0 z-40 flex w-[280px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-xl transition-[width,transform] duration-200 ease-out lg:relative lg:z-20 lg:w-[var(--palette-width)] lg:translate-x-0 lg:shadow-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none lg:pointer-events-auto"
      )}
      style={{
        "--palette-width": `${collapsed ? 72 : width}px`,
      } as React.CSSProperties}
    >
      <div className={cn("flex items-start border-b border-slate-100 p-4", collapsed && "lg:justify-center lg:px-2")}>
        <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
          <h2 className="text-sm font-black text-slate-900">Content Blocks</h2>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
            Drag a block onto the canvas. Click is available as a quick fallback.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:flex"
          aria-label={collapsed ? "Expand content blocks" : "Collapse content blocks"}
          title={collapsed ? "Expand content blocks" : "Collapse content blocks"}
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
          aria-label="Close content blocks"
          title="Close content blocks"
        >
          <X size={17} />
        </button>
      </div>
      {!collapsed ? (
        <div className="hidden grid-cols-2 gap-1 border-b border-slate-100 p-2 lg:grid">
          {(["messages", "actions"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onActiveTabChange(tab)}
              className={cn(
                "rounded-[6px] px-3 py-2 text-xs font-black capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                activeTab === tab
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      ) : null}
      <div className={cn("flex-1 overflow-y-auto p-4 custom-scrollbar", collapsed && "lg:px-2")}>
        {(["content", "action"] as const).map((group) => (
          <div
            key={group}
            className={cn(
              "mb-5",
              !collapsed &&
                ((activeTab === "messages" && group === "action") ||
                  (activeTab === "actions" && group === "content")) &&
                "lg:hidden"
            )}
          >
            <div
              className={cn(
                "mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400",
                collapsed && "lg:hidden"
              )}
            >
              <span className="lg:hidden">{group === "content" ? "Messages" : "Actions"}</span>
              <span className="hidden lg:inline">
                {group === "content" ? "Messages" : "Actions"}
              </span>
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
                    className={cn(
                      "group flex w-full cursor-grab items-center gap-3 rounded-[8px] border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:cursor-grabbing active:scale-[0.98]",
                      collapsed && "lg:justify-center lg:p-2"
                    )}
                    aria-label={`Add ${item.label}`}
                    title={collapsed ? item.label : `Add ${item.label}`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-slate-100 text-slate-600 transition group-hover:bg-brand-100 group-hover:text-brand-700">
                      <Icon size={16} />
                    </div>
                    <div className={cn("min-w-0", collapsed && "lg:hidden")}>
                      <div className="text-xs font-black text-slate-800">{item.label}</div>
                      <div className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{item.description}</div>
                    </div>
                    <div className={cn("ml-auto grid grid-cols-2 gap-0.5 opacity-30 transition group-hover:opacity-70", collapsed && "lg:hidden")} aria-hidden="true">
                      {[1, 2, 3, 4, 5, 6].map((dot) => <span key={dot} className="h-1 w-1 rounded-full bg-slate-500" />)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
