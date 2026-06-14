import { AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";
import type { FlowValidationResult, ValidationIssue } from "@modules/automation-flows/types";

interface ValidationModalProps {
  open: boolean;
  result: FlowValidationResult | null;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

function IssueList({
  title,
  issues,
  warning,
  onSelectNode,
}: Readonly<{
  title: string;
  issues: ValidationIssue[];
  warning?: boolean;
  onSelectNode: (nodeId: string) => void;
}>) {
  if (issues.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
        {warning ? <TriangleAlert size={15} className="text-amber-500" /> : <AlertCircle size={15} className="text-rose-500" />}
        {title} ({issues.length})
      </div>
      <div className="space-y-2">
        {issues.map((issue, index) => (
          <button
            key={`${issue.code}-${issue.nodeId || "flow"}-${index}`}
            type="button"
            disabled={!issue.nodeId}
            onClick={() => issue.nodeId && onSelectNode(issue.nodeId)}
            className="w-full rounded-[5px] border border-slate-200 p-3 text-left transition enabled:hover:border-brand-300 enabled:hover:bg-brand-50/30 disabled:cursor-default"
          >
            <div className="text-xs font-bold text-slate-800">{issue.message}</div>
            <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-medium text-slate-400">
              <span>{issue.code}</span>
              {issue.nodeId ? <span>Node: {issue.nodeId}</span> : null}
              {issue.field ? <span>Field: {issue.field}</span> : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ValidationModal({
  open,
  result,
  onClose,
  onSelectNode,
}: Readonly<ValidationModalProps>) {
  return (
    <Modal open={open} onClose={onClose} title="Flow validation">
      {result?.valid ? (
        <div className="mb-5 flex items-start gap-3 rounded-[5px] border border-emerald-100 bg-emerald-50 p-4">
          <CheckCircle2 size={20} className="mt-0.5 text-emerald-600" />
          <div>
            <div className="text-sm font-black text-emerald-800">Draft is ready to publish</div>
            <div className="mt-1 text-xs font-medium text-emerald-700">Backend validation found no blocking errors.</div>
          </div>
        </div>
      ) : null}
      <div className="space-y-5">
        <IssueList title="Errors" issues={result?.errors || []} onSelectNode={onSelectNode} />
        <IssueList title="Warnings" issues={result?.warnings || []} warning onSelectNode={onSelectNode} />
        {!result ? <p className="text-sm text-slate-500">No validation result available.</p> : null}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
