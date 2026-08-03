import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";

type Check = {
  key: string;
  label: string;
  passed: boolean;
  details: string;
};

type Props = {
  open: boolean;
  busy: boolean;
  templateName: string;
  checks: Check[];
  mode?: "meta" | "local";
  onClose: () => void;
  onConfirm: () => void;
};

export function TemplateSubmitConfirmModal({
  open,
  busy,
  templateName,
  checks,
  mode = "meta",
  onClose,
  onConfirm,
}: Props) {
  const allPassed = checks.every((check) => check.passed);
  const isMetaMode = mode === "meta";

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title={isMetaMode ? "Submit Template To Meta" : "Save Template"}>
      <div className="space-y-5">
        <div>
          <div className="text-sm font-semibold text-slate-900">{templateName || "Untitled template"}</div>
          <div className="mt-1 text-xs text-slate-500">
            {isMetaMode
              ? "Review the validation checks below before sending this template to Meta for approval."
              : "Review the validation checks below before saving this system template."}
          </div>
        </div>

        <div className="grid gap-3">
          {checks.map((check) => (
            <div
              key={check.key}
              className={`rounded-[5px] border px-4 py-3 ${
                check.passed ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className={`text-sm font-semibold ${check.passed ? "text-emerald-800" : "text-rose-800"}`}>
                {check.label}: {check.passed ? "Ready" : "Needs attention"}
              </div>
              <div className={`mt-1 text-xs ${check.passed ? "text-emerald-700" : "text-rose-700"}`}>
                {check.details}
              </div>
            </div>
          ))}
        </div>

        {!allPassed ? (
          <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
            {isMetaMode ? "Fix the failing checks before submitting to Meta." : "Fix the failing checks before saving this template."}
          </div>
        ) : (
          <div className="rounded-[5px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            {isMetaMode ? (
              <>
                Meta may return <span className="font-semibold">pending</span>, <span className="font-semibold">approved</span>,
                {" "}or <span className="font-semibold">rejected</span>. The template status will be updated from the API response.
              </>
            ) : (
              <>This system template will be saved locally for the library. It will not be submitted to Meta.</>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!allPassed || busy} className="min-w-[160px]">
            {busy ? (isMetaMode ? "Submitting..." : "Saving...") : (isMetaMode ? "Confirm Submit" : "Confirm Save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
