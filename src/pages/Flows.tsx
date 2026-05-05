import { useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { RefreshCcw, Workflow } from "lucide-react";

type Flow = {
  id: string;
  name?: string;
  status?: string;
  categories?: string[];
  updated_time?: string;
};

const UTILITY_FLOW_TYPES = [
  { value: "get_feedback", label: "Get feedback", desc: "Capture user feedback" },
  { value: "customer_support", label: "Customer support", desc: "Offer support and assistance" },
  { value: "custom_form", label: "Custom form", desc: "Build a tailored form" },
];

const MARKETING_FLOW_TYPES = [
  { value: "send_survey", label: "Send a survey", desc: "Ask questions and collect preferences" },
  { value: "register_event", label: "Register for an event", desc: "Collect info for registration" },
  { value: "complete_signup", label: "Complete sign up", desc: "Quickly capture contact information" },
  { value: "custom_form", label: "Custom form", desc: "Build a tailored form" },
];

function toneFromStatus(status?: string): "neutral" | "good" | "warn" | "bad" {
  const value = String(status || "").toLowerCase();
  if (value.includes("publish") || value.includes("active") || value.includes("approved")) return "good";
  if (value.includes("draft") || value.includes("pending")) return "warn";
  if (value.includes("reject") || value.includes("disable") || value.includes("fail")) return "bad";
  return "neutral";
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [flowCategory, setFlowCategory] = useState<"utility" | "marketing">("utility");
  const [flowType, setFlowType] = useState("get_feedback");
  const [name, setName] = useState("");

  const flowTypes = useMemo(
    () => (flowCategory === "utility" ? UTILITY_FLOW_TYPES : MARKETING_FLOW_TYPES),
    [flowCategory]
  );

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await API.meta.listFlows({ limit: 200 });
      setFlows(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      setFlows([]);
      setError(e?.response?.data?.details?.providerError || e?.response?.data?.message || e?.message || "Failed to load flows");
    } finally {
      setLoading(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowCategory]);

  const create = async () => {
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const cleanName = name.trim();
      if (!cleanName) throw new Error("Flow name is required");

      await API.meta.createFlow({
        name: cleanName,
        categories: ["OTHER"],
      });

      setOk("Flow created in Meta. Open Flow Builder to design it, then come back and refresh.");
      setName("");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.details?.providerError || e?.response?.data?.message || e?.message || "Failed to create flow");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[5px] border border-ink-900/10 bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.08)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/60">WhatsApp Flows</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">Flow Builder</h1>
            <p className="mt-2 text-sm text-ink-800/70">Create and manage Flows, then attach them to templates as “Complete Flow”.</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-[5px] border border-ink-900/10 bg-white shadow-none"
              onClick={() => window.open("https://business.facebook.com/wa/manage/flows/", "_blank", "noopener,noreferrer")}
            >
              Open Meta Builder
            </Button>
            <Button
              type="button"
              className="rounded-[5px] shadow-none"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCcw size={16} /> Refresh
            </Button>
          </div>
        </div>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {ok ? <Alert tone="success">{ok}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="p-6 shadow-none">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-ink-900">
            <Workflow size={16} className="text-ink-900/50" /> Create Flow
          </div>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Template category"
                value={flowCategory}
                onChange={(e) => setFlowCategory(e.target.value as any)}
                className="rounded-[5px] shadow-none"
              >
                <option value="utility">Utility</option>
                <option value="marketing">Marketing</option>
              </Select>
              <Select
                label="Flow type"
                value={flowType}
                onChange={(e) => setFlowType(e.target.value)}
                className="rounded-[5px] shadow-none"
              >
                {flowTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-4 text-sm text-ink-800/70">
              {flowTypes.find((t) => t.value === flowType)?.desc || "Choose a type to see description."}
            </div>

            <Input
              label="Flow name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. order_feedback_flow"
              className="rounded-[5px] shadow-none"
              required
            />

            <Button type="button" className="rounded-[5px] shadow-none" onClick={() => void create()} disabled={busy}>
              {busy ? "Creating..." : "Create Flow"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 shadow-none">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="text-sm font-black text-ink-900">Your Flows</div>
            <div className="text-xs text-ink-800/60">{loading ? "Loading..." : `${flows.length} total`}</div>
          </div>

          <div className="overflow-x-auto rounded-[5px] border border-ink-900/10">
            <table className="min-w-[680px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.18em] text-ink-900/55">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5 bg-white">
                {flows.map((flow) => (
                  <tr key={flow.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink-900">{flow.name || flow.id}</div>
                      <div className="mt-0.5 text-xs text-ink-800/60">{flow.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={toneFromStatus(flow.status || "")}>{flow.status || "N/A"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-800/70">{flow.updated_time || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-[5px] border border-ink-900/10 bg-white shadow-none"
                        onClick={() => window.open("https://business.facebook.com/wa/manage/flows/", "_blank", "noopener,noreferrer")}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && flows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-ink-800/60" colSpan={4}>
                      No flows found. Create one on the left.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

