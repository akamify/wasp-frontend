import { Button } from "@components/ui/Button";
import type { TemplateItem, TemplateVersionItem } from "@pages/user/templates/types";

type TemplateHistoryModalProps = {
  open: boolean;
  template: TemplateItem | null;
  versions: TemplateVersionItem[];
  loading?: boolean;
  restoringVersionId?: string | null;
  onClose: () => void;
  onRestore: (version: TemplateVersionItem) => void;
};

function summarizeChange(value: unknown) {
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (value && typeof value === "object") return "Updated";
  if (value === undefined || value === null || value === "") return "Empty";
  return String(value).slice(0, 80);
}

export function TemplateHistoryModal({
  open,
  template,
  versions,
  loading,
  restoringVersionId,
  onClose,
  onRestore,
}: TemplateHistoryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[5px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Version history</div>
            <h3 className="mt-1 text-xl font-black text-slate-900">{template?.name || "Template"}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {loading ? <div className="text-sm font-semibold text-slate-500">Loading history...</div> : null}
          {!loading && !versions.length ? <div className="text-sm font-semibold text-slate-500">No versions available yet.</div> : null}
          <div className="space-y-4">
            {versions.map((version) => (
              <div key={version._id} className="rounded-[5px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-900">Version {version.versionNumber}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {version.action} • {new Date(version.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      By {version.updatedBy?.name || version.updatedBy?.email || "Unknown user"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border border-slate-200 bg-white"
                    disabled={restoringVersionId === version._id}
                    onClick={() => onRestore(version)}
                  >
                    {restoringVersionId === version._id ? "Restoring..." : "Restore"}
                  </Button>
                </div>
                <div className="mt-4 grid gap-2">
                  {(version.changes || []).length ? (version.changes || []).map((change, index) => (
                    <div key={`${version._id}-${change.field}-${index}`} className="rounded-[5px] bg-white px-3 py-2 text-xs text-slate-600">
                      <span className="font-black text-slate-800">{change.field}</span>: {summarizeChange(change.before)} → {summarizeChange(change.after)}
                    </div>
                  )) : (
                    <div className="rounded-[5px] bg-white px-3 py-2 text-xs text-slate-500">No field-level diff stored for this version.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
