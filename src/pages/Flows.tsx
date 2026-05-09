import { useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { FlowsSkeleton } from "../components/ui/Skeletons";
import { useToast } from "../context/ToastContext";
import { RefreshCcw, Workflow, ExternalLink, Info, Plus } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { cn } from "../utils/cn";

type Flow = {
  id: string;
  name?: string;
  status?: string;
  categories?: string[];
  updated_time?: string;
};

const UTILITY_FLOW_TYPES = [
  { value: "get_feedback", label: "Get feedback", desc: "Capture user feedback and satisfaction ratings." },
  { value: "customer_support", label: "Customer support", desc: "Provide support, troubleshooting, or FAQ assistance." },
  { value: "custom_form", label: "Custom form", desc: "Build a tailored form for specific utility needs." },
];

const MARKETING_FLOW_TYPES = [
  { value: "send_survey", label: "Send a survey", desc: "Ask questions and collect user preferences for marketing." },
  { value: "register_event", label: "Register for an event", desc: "Collect information for event signups and registrations." },
  { value: "complete_signup", label: "Complete sign up", desc: "Quickly capture contact information for new users." },
  { value: "custom_form", label: "Custom form", desc: "Build a tailored form for specific marketing goals." },
];

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
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const [flowCategory, setFlowCategory] = useState<"utility" | "marketing">("utility");
  const [flowType, setFlowType] = useState("get_feedback");
  const [name, setName] = useState("");

  const flowTypes = useMemo(
    () => (flowCategory === "utility" ? UTILITY_FLOW_TYPES : MARKETING_FLOW_TYPES),
    [flowCategory]
  );

  const load = async () => {
    if (!flows.length) setLoading(true);
    setSyncing(true);
    try {
      const res = await API.meta.listFlows({ limit: 200 });
      setFlows(Array.isArray(res?.data) ? res.data : []);
      if (!loading) toast("Flows synced successfully.", "success");
    } catch (e: any) {
      setFlows([]);
      toast(e?.response?.data?.details?.providerError || e?.response?.data?.message || e?.message || "Failed to load flows", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const options = flowTypes;
    if (!options.some((opt) => opt.value === flowType)) {
      setFlowType(options[0]?.value || "custom_form");
    }
  }, [flowCategory, flowTypes, flowType]);

  const create = async () => {
    setBusy(true);
    try {
      const cleanName = name.trim();
      if (!cleanName) throw new Error("Flow name is required");

      await API.meta.createFlow({
        name: cleanName,
        categories: ["OTHER"],
      });

      toast("Flow created in Meta. Design it in the Builder then refresh.", "success");
      setName("");
      await load();
    } catch (e: any) {
      toast(e?.response?.data?.details?.providerError || e?.response?.data?.message || e?.message || "Failed to create flow", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading && flows.length === 0) return (
    <div className="p-4 md:p-8">
      <FlowsSkeleton />
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Flows</h1>
          <p className="mt-2 text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Interactive Meta Form Builder</p>
        </div>
        <div className="flex items-center gap-3">
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
            <RefreshCcw size={16} className={cn(syncing && "animate-spin")} />
            {syncing ? "Syncing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
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
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/5">
                  {flows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-ink-800/40 font-semibold italic">
                        No flows found in your Meta account
                      </td>
                    </tr>
                  ) : (
                    flows.map((flow) => (
                      <tr key={flow.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-ink-900 leading-tight">
                            {flow.name || "Untitled Flow"}
                          </div>
                          <div className="text-[10px] font-bold text-ink-800/40 uppercase tracking-widest mt-0.5">
                            ID: {flow.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge tone={toneFromStatus(flow.status)} className="rounded-[3px] py-1 px-2 uppercase font-black tracking-tighter">
                            {flow.status || "UNKNOWN"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-[11px] font-bold text-ink-800/60">
                          {flow.updated_time ? new Date(flow.updated_time).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-[5px]"
                            onClick={() => window.open("https://business.facebook.com/wa/manage/flows/", "_blank", "noopener,noreferrer")}
                          >
                            <ExternalLink size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 md:p-8 border-ink-900/5 shadow-xl shadow-ink-900/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-[5px] bg-brand-50 flex items-center justify-center text-brand-600">
                <Workflow size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-ink-900">New Flow</h2>
                <p className="text-xs font-bold text-ink-800/40 uppercase tracking-wider">Deploy to Meta</p>
              </div>
            </div>

            <div className="space-y-6">
              <Input
                label="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Customer Survey"
                hint="Used internally for identification"
                required
              />

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-ink-900/40">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFlowCategory("utility")}
                    className={cn(
                      "rounded-[5px] border p-3 text-left transition-all",
                      flowCategory === "utility" 
                        ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500" 
                        : "border-ink-900/5 hover:border-ink-900/20"
                    )}
                  >
                    <div className="text-sm font-black text-ink-900">Utility</div>
                    <div className="text-[10px] font-bold text-ink-800/40 mt-0.5 text-balance">Support, Feedback</div>
                  </button>
                  <button
                    onClick={() => setFlowCategory("marketing")}
                    className={cn(
                      "rounded-[5px] border p-3 text-left transition-all",
                      flowCategory === "marketing" 
                        ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500" 
                        : "border-ink-900/5 hover:border-ink-900/20"
                    )}
                  >
                    <div className="text-sm font-black text-ink-900">Marketing</div>
                    <div className="text-[10px] font-bold text-ink-800/40 mt-0.5 text-balance">Signup, Survey</div>
                  </button>
                </div>
              </div>

              <Select
                label="Objective"
                value={flowType}
                onChange={(e) => setFlowType(e.target.value)}
                required
              >
                {flowTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>

              <div className="rounded-[5px] bg-slate-50 p-4 border border-ink-900/5 flex gap-3">
                <Info size={16} className="text-ink-900/40 mt-0.5 shrink-0" />
                <div className="text-[11px] font-bold text-ink-900 leading-snug">
                  {flowTypes.find(t => t.value === flowType)?.desc}
                </div>
              </div>

              <Button 
                onClick={create} 
                disabled={busy || !name.trim()} 
                className="w-full h-12 text-base font-black gap-2 shadow-lg shadow-brand-500/20"
              >
                {busy ? "Creating..." : (
                  <>
                    <Plus size={18} />
                    Deploy Meta Flow
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-ink-900/5 bg-slate-50 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-ink-800/60 mb-3">Builder Note</h3>
            <p className="text-[11px] font-medium text-ink-800/60 leading-relaxed">
              Flows are hosted by Meta. After creation, use the <strong>Meta Builder</strong> to design the UI. Once published, you can attach them to interactive messages.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
