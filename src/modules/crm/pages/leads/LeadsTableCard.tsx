import { Link } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { MessageSquare, Tag } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { fmtDate, statusBadge, type Conversation } from "./leads.utils";

type Props = {
  leads: Conversation[];
  loading: boolean;
  filterKey: "active" | "assigned" | "unassigned";
  setFilterKey: (v: "active" | "assigned" | "unassigned") => void;
  multiSelected: Record<string, boolean>;
  setMultiSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  someSelected: boolean;
  selectedCount: number;
  allSelected: boolean;
  onAssign: (phone: string) => void;
  onBulkAssign: () => void;
  onClearSelection: () => void;
};

export function LeadsTableCard(props: Props) {
  const { leads, loading, filterKey, setFilterKey, multiSelected, setMultiSelected, someSelected, selectedCount, allSelected, onAssign, onBulkAssign, onClearSelection } = props;

  return (
    <Card className="overflow-hidden rounded-[5px] border-slate-200 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm font-black text-slate-900">Leads</div>
          <div className="hidden text-[11px] font-semibold text-slate-500 md:block">{loading ? "Loading..." : `${leads.length} records`}</div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex w-full rounded-[5px] bg-slate-100 p-1 md:w-auto">
            {[{ key: "active", label: "Active" }, { key: "assigned", label: "Assigned" }, { key: "unassigned", label: "Unassigned" }].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterKey(f.key as any)}
                className={cn("flex-1 rounded-[5px] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all md:flex-none", filterKey === f.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 md:hidden">{loading ? "Loading..." : `${leads.length} records`}</div>
        </div>
      </div>

      {someSelected ? (
        <div className="flex items-center justify-between border-y border-brand-100 bg-brand-50 px-4 py-3">
          <div className="text-sm font-bold text-brand-700">{selectedCount} leads selected</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8" onClick={onBulkAssign} disabled={loading}>Assign Selected</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={onClearSelection}>Cancel</Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-[12px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              <th className="w-12 px-4 py-3 text-[10px] font-black uppercase tracking-widest">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => {
                    const next: Record<string, boolean> = { ...(multiSelected || {}) };
                    if (e.target.checked) leads.forEach((c) => (next[c.phone] = true));
                    else leads.forEach((c) => delete next[c.phone]);
                    setMultiSelected(next);
                  }}
                  className="rounded-[3px] border-ink-900/20"
                />
              </th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Lead</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Tags</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Status</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Unread</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Last message</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Preview</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((c) => (
              <tr key={c.phone} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={!!multiSelected[c.phone]} onChange={() => setMultiSelected((p) => ({ ...(p || {}), [c.phone]: !p?.[c.phone] }))} className="rounded-[3px] border-ink-900/20" />
                </td>
                <td className="px-4 py-3">
                  <div className="font-black text-slate-900">{c.contact?.name || c.phone}</div>
                  <div className="text-[11px] font-semibold text-slate-500">{c.contact?.company ? c.contact.company : c.phone}</div>
                </td>
                <td>
                  {Array.isArray(c.contact?.tags) && c.contact.tags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.contact.tags.slice(0, 3).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-[5px] border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-700"><Tag size={12} /> {t}</span>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center rounded-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-widest", statusBadge(c.leadStatus))}>{String(c.leadStatus || "UNASSIGNED")}</span>
                </td>
                <td className="px-4 py-3"><div className="mt-2 font-black text-slate-900">{Number(c.employeeUnreadCount || 0)}</div></td>
                <td className="px-4 py-3 font-semibold text-slate-700">{fmtDate(c.lastMessageAt)}</td>
                <td className="max-w-[420px] truncate px-4 py-3 font-semibold text-slate-700">{c.lastMessagePreview || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link to={`/app/conversations/${encodeURIComponent(c.phone)}`} className="inline-flex items-center gap-2 font-black text-brand-700 hover:underline">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-[5px] bg-brand-50 text-brand-700"><MessageSquare size={14} /></span>
                      Open
                    </Link>
                    <Button variant="ghost" className="h-8 px-3" onClick={() => onAssign(c.phone)}>Assign</Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && leads.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center font-semibold text-slate-500">No leads found yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
