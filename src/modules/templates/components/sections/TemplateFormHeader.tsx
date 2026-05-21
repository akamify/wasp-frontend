import { LayoutTemplate, X } from "lucide-react";
import { Button } from "@components/ui/Button";

type Props = {
  mode: "create" | "edit";
  onClose: () => void;
};

export function TemplateFormHeader({ mode, onClose }: Props) {
  return (
    <div className="mb-10 flex items-center justify-between border-b border-slate-50 pb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center text-brand-600">
          <LayoutTemplate size={20} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-800/55">
            {mode === "edit" ? "Edit Template" : "Create Template"}
          </div>
          <div className="mt-1 text-2xl font-black text-ink-900">Template Builder</div>
        </div>
      </div>
      <Button variant="ghost" onClick={onClose} className="flex items-center gap-2 rounded-[5px] shadow-none">
        <X size={16} /> Close
      </Button>
    </div>
  );
}

