import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";
import type { TemplateItem } from "@modules/templates/types/templates.types";
import { buildSuggestedFixes } from "@modules/templates/utils/rejectionHelpers";

export function TemplateRejectionModal({
  open,
  template,
  onClose,
  onFix,
  onResubmit,
  busy,
}: {
  open: boolean;
  template: TemplateItem | null;
  onClose: () => void;
  onFix: (template: TemplateItem) => void;
  onResubmit: (template: TemplateItem) => void;
  busy?: boolean;
}) {
  if (!template) return null;
  const suggestions = buildSuggestedFixes(template);

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title="Rejected Template Details">
      <div className="space-y-5">
        <div>
          <div className="text-sm font-semibold text-slate-900">{template.name}</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-rose-600 font-black">Rejected</div>
        </div>

        <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-rose-800/80">Rejected Reason</div>
          <div className="mt-2 text-sm text-rose-900">
            {String(template.rejectedReason || "").trim() || "Meta did not return a rejection reason for this template yet."}
          </div>
        </div>

        <div className="rounded-[5px] border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-800/80">Suggested Fixes</div>
          <ul className="mt-2 grid gap-2 text-sm text-amber-950">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>- {suggestion}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button variant="ghost" onClick={() => onFix(template)} disabled={busy}>
            Fix Template
          </Button>
          <Button onClick={() => onResubmit(template)} disabled={busy}>
            {busy ? "Submitting..." : "Resubmit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
