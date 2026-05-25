import { Plus, Send, Upload, Trash2 } from "lucide-react";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { CampaignsListSkeleton } from "@components/ui/Skeletons";

type Campaign = {
  _id: string;
  name: string;
  status: string;
  type?: "broadcast" | "csv" | "api";
  totals?: { total?: number; queued?: number; sent?: number; failed?: number };
  createdAt?: string;
};

type Props = {
  loading: boolean;
  campaigns: Campaign[];
  actioningId: string;
  onOpenCampaign: (id: string) => void;
  onDeleteCampaign: (event: React.MouseEvent, id: string, status: string) => void;
};

function statusTone(status: string) {
  const s = String(status || "").toLowerCase();
  if (["completed", "delivered", "success", "active"].some((x) => s.includes(x))) return "good";
  if (["failed", "error"].some((x) => s.includes(x))) return "bad";
  if (["queued", "running", "sending", "pending"].some((x) => s.includes(x))) return "warn";
  return "neutral";
}

function campaignTypeLabel(value?: Campaign["type"]) {
  if (value === "api") return "API";
  if (value === "csv") return "CSV";
  return "Broadcast";
}

function campaignStatusMessage(c: Campaign) {
  const status = String(c.status || "").toLowerCase();
  if (status === "queued") return "Campaign is queued and will start shortly.";
  if (status === "running") return "Campaign is live and sending now.";
  if (status === "completed") return (c.totals?.failed || 0) > 0 ? "Completed with some failures." : "Completed successfully.";
  if (status === "canceled" || status === "cancelled") return "Campaign was canceled.";
  return "";
}

export function SendCampaignsTable({
  loading,
  campaigns,
  actioningId,
  onOpenCampaign,
  onDeleteCampaign,
}: Props) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-ink-900/5 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-ink-800/40">
          <th className="px-6 py-4">Campaign Name</th>
          <th className="px-6 py-4 text-center">Audience</th>
          <th className="px-6 py-4 text-center">Type</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4">Created</th>
          <th className="px-6 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-900/5">
        {loading ? (
          <CampaignsListSkeleton rows={8} />
        ) : campaigns.length > 0 ? (
          campaigns.map((c) => (
            <tr key={c._id} className="group cursor-pointer hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4" onClick={() => onOpenCampaign(c._id)}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-[5px] bg-brand-50 flex items-center justify-center text-brand-600 font-black text-xs">
                    {c.type === "csv" ? <Upload size={18} /> : <Send size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-ink-900 truncate group-hover:text-brand-600 transition-colors">{c.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center font-bold text-ink-900">{c.totals?.total || 0}</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-ink-900">{campaignTypeLabel(c.type)}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <Badge tone={statusTone(c.status)} className="w-fit px-2 py-0.5 text-[10px] uppercase font-black">{c.status}</Badge>
                  {campaignStatusMessage(c) && (
                    <div className="max-w-[200px] truncate text-[10px] font-semibold text-ink-800/50" title={campaignStatusMessage(c)}>
                      {campaignStatusMessage(c)}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-semibold text-ink-800/60">
                {new Date(c.createdAt || "").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => onDeleteCampaign(e, c._id, c.status)}
                    disabled={actioningId === c._id}
                    className="h-10 w-10 p-0 border border-ink-900/5 bg-white text-ink-900 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} className="px-6 py-20 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-ink-800/20 mb-4">
                <Plus size={32} />
              </div>
              <div className="text-sm font-bold text-ink-900">No campaigns found</div>
              <div className="text-xs font-semibold text-ink-800/50 mt-1">Ready to start broadcasting? Create your first campaign.</div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
