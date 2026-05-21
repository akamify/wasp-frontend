import { useDraggable } from "@dnd-kit/core";
import type { FlowComponentType } from "@modules/flow-builder/types";

const paletteItems: FlowComponentType[] = ["TextInput", "Dropdown", "Checkbox", "Radio", "Footer", "Text"];

function PaletteItem({ type }: { type: FlowComponentType }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `palette-${type}`, data: { componentType: type } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2 text-left text-xs font-bold text-slate-700 hover:border-brand-400"
      type="button"
    >
      + {type}
    </button>
  );
}

export function ComponentPalette() {
  return (
    <div className="space-y-2 rounded-[6px] border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Component Palette</h3>
      {paletteItems.map((type) => (
        <PaletteItem key={type} type={type} />
      ))}
    </div>
  );
}
