import { useEffect, useState } from "react";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { crmEmployeeLeadsService } from "@modules/crm/services/crmEmployeeLeads.service";

type LeadItem = {
  id: string;
  phone: string;
  status: string;
  assignedAt?: string | null;
  firstInboundAt?: string | null;
  lastInboundAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function EmployeeLeadsPage() {
  const [range, setRange] = useState<"all" | "today" | "7d">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LeadItem[]>([]);
  const [selected, setSelected] = useState<LeadItem | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const res = await crmEmployeeLeadsService.list({ range, page: 1, limit: 25 });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-black text-slate-900">Leads</div>
            <div className="mt-1 text-xs font-bold text-slate-500">Your assigned leads list.</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-[5px] border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700"
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
            </select>
            <Button variant="ghost" disabled={loading || busy} onClick={reload}>
              Refresh
            </Button>
          </div>
        </div>

        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Card className="border-slate-200 shadow-sm rounded-[5px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-[12px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Phone</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Assigned</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Last inbound</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer" onClick={() => setSelected(l)}>
                    <td className="px-4 py-3 font-black text-slate-900">{l.phone}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{l.status}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(l.assignedAt)}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(l.lastInboundAt)}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(l.createdAt)}</td>
                  </tr>
                ))}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-semibold">
                      No leads found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        {selected ? (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <div className="w-full max-w-lg rounded-[5px] border border-slate-100 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lead</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{selected.phone}</div>
                </div>
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
              <div className="p-4 grid gap-2 text-[13px]">
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Status</span><span className="font-black text-slate-900">{selected.status}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Assigned</span><span className="font-semibold text-slate-700">{fmtDate(selected.assignedAt)}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">First inbound</span><span className="font-semibold text-slate-700">{fmtDate(selected.firstInboundAt)}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Last inbound</span><span className="font-semibold text-slate-700">{fmtDate(selected.lastInboundAt)}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Created</span><span className="font-semibold text-slate-700">{fmtDate(selected.createdAt)}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Updated</span><span className="font-semibold text-slate-700">{fmtDate(selected.updatedAt)}</span></div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
