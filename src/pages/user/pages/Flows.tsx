import { useEffect, useState } from "react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { FlowsSkeleton } from "@components/ui/Skeletons";
import { useToast } from "@shared/providers/ToastContext";
import {
  RefreshCcw,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Badge } from "@components/ui/Badge";
import { useNavigate } from "react-router-dom";


type Flow = {
  id: string;
  name?: string;
  status?: string;
  categories?: string[];
  updated_time?: string;
};

function toneFromStatus(status?: string): "neutral" | "good" | "warn" | "bad" | "brand" {
  const value = String(status || "").toLowerCase();
  if (value.includes("publish") || value.includes("active") || value.includes("approved")) return "good";
  if (value.includes("draft") || value.includes("pending")) return "warn";
  if (value.includes("reject") || value.includes("disable") || value.includes("fail")) return "bad";
  return "neutral";
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getErrorMessage = (e: any, fallback: string) =>
    e?.userMessage ||
    e?.response?.data?.details?.providerError ||
    e?.response?.data?.message ||
    e?.message ||
    fallback;

  const load = async () => {
    if (!flows.length) setLoading(true);
    setSyncing(true);
    try {
      const res = await API.meta.listFlows({ limit: 200 });
      setFlows(Array.isArray(res?.data) ? res.data : []);
      if (!loading) toast("Flows synced successfully.", "success");
    } catch (e: any) {
      setFlows([]);
      toast(getErrorMessage(e, "Failed to load flows"), "error");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading && flows.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <FlowsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Flows</h1>
          <p className="mt-2 text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Flow List & Management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/app/flows/create")} className="h-10 gap-2 px-4 shadow-sm">
            <Plus size={16} />
            Create Flow
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.open("https://business.facebook.com/wa/manage/flows/", "_blank", "noopener,noreferrer")}
            className="h-10 border border-ink-900/10 bg-white gap-2 shadow-sm px-4 hidden md:flex"
          >
            <ExternalLink size={16} />
            Meta Builder
          </Button>
          <Button
            variant="ghost"
            onClick={load}
            disabled={loading || syncing}
            className="h-10 border border-ink-900/10 bg-white gap-2 shadow-sm px-4"
          >
            <RefreshCcw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <Card className="p-0 border-ink-900/5 shadow-xl shadow-ink-900/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-ink-900/5 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-ink-800/60">Existing flows</h2>
          <Badge tone="neutral" className="rounded-[3px] text-[10px]">{flows.length} detected</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-ink-800/40 border-b border-ink-900/5">
              <tr>
                <th className="px-6 py-4">Flow Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {flows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-ink-800/40 font-semibold italic">
                    No flows found in your Meta account
                  </td>
                </tr>
              ) : (
                flows.map((flow) => (
                  <tr key={flow.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink-900 leading-tight">{flow.name || "Untitled Flow"}</div>
                      <div className="text-[10px] font-bold text-ink-800/40 uppercase tracking-widest mt-0.5">ID: {flow.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={toneFromStatus(flow.status)} className="rounded-[3px] py-1 px-2 uppercase font-black tracking-tighter">
                        {flow.status || "UNKNOWN"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-ink-800/60">
                      {flow.updated_time ? new Date(flow.updated_time).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
