import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  GitBranch,
  Plus,
  RefreshCw,
  Search,
  TerminalSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { useToast } from "@shared/providers/ToastContext";
import { FlowConfirmModal } from "@modules/automation-flows/components/FlowConfirmModal";
import { FlowCreateModal } from "@modules/automation-flows/components/FlowCreateModal";
import {
  FlowListCard,
  type FlowAction,
} from "@modules/automation-flows/components/FlowListCard";
import { flowsApi } from "@modules/automation-flows/flowsApi";
import { getFlowId } from "@modules/automation-flows/flowIdentity";
import type { AutomationFlow, FlowStatus } from "@modules/automation-flows/types";
import { useFlowsList } from "@modules/automation-flows/useFlows";

interface PendingAction {
  flow: AutomationFlow;
  action: FlowAction;
}

const ACTION_COPY: Record<FlowAction, { title: string; message: string; label: string }> = {
  pause: {
    title: "Pause automation",
    message: "New conversations will stop entering this flow until it is resumed.",
    label: "Pause flow",
  },
  resume: {
    title: "Resume automation",
    message: "The published version will become eligible for new matching conversations.",
    label: "Resume flow",
  },
  archive: {
    title: "Archive automation",
    message: "Archived flows cannot be edited or started. Published versions remain preserved.",
    label: "Archive flow",
  },
  delete: {
    title: "Delete automation",
    message: "This soft deletes the flow and preserves its historical versions and sessions.",
    label: "Delete flow",
  },
};

export default function AutomationFlowsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<FlowStatus | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(
    () => ({ search: debouncedSearch, status, page: 1, limit: 100 }),
    [debouncedSearch, status]
  );
  const { flows, loading, error, reload } = useFlowsList(params);

  async function createFlow(values: { name: string; description: string }) {
    setBusy(true);
    try {
      const response = await flowsApi.create(values);
      const createdFlowId = getFlowId(response.flow);
      if (!createdFlowId) throw new Error("Created flow did not include an id.");
      toast("Automation flow created.", "success");
      setCreateOpen(false);
      navigate(`/app/automation/${createdFlowId}`);
    } catch (requestError: unknown) {
      const errorLike = requestError as { userMessage?: string; message?: string };
      toast(errorLike.userMessage || errorLike.message || "Unable to create flow.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function runAction() {
    if (!pending) return;
    const pendingFlowId = getFlowId(pending.flow);
    if (!pendingFlowId) {
      toast("Unable to identify this flow.", "error");
      return;
    }
    setBusy(true);
    try {
      if (pending.action === "pause") await flowsApi.pause(pendingFlowId);
      if (pending.action === "resume") await flowsApi.resume(pendingFlowId);
      if (pending.action === "archive") await flowsApi.archive(pendingFlowId);
      if (pending.action === "delete") await flowsApi.remove(pendingFlowId);
      toast(`Flow ${pending.action}d successfully.`, "success");
      setPending(null);
      await reload();
    } catch (requestError: unknown) {
      const errorLike = requestError as { userMessage?: string; message?: string };
      toast(errorLike.userMessage || errorLike.message || "Unable to update flow.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-7 p-4 md:p-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Automation</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Create WhatsApp chatbot automation flows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/app/automation/events")}>
            <TerminalSquare size={16} />
            Event test
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={17} />
            Create Flow
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Your automation flows</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Manage drafts and published chatbot journeys.</p>
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {loading ? "Loading..." : `${flows.length} flow${flows.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[10px] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search flows..." icon={<Search size={16} />} aria-label="Search flows" />
          <Select value={status} onChange={(event) => setStatus(event.target.value as FlowStatus | "")} className="sm:w-44" aria-label="Filter flow status">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => void reload()} aria-label="Refresh flows">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>

        {error ? (
          <Alert tone="error" className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void reload()}>Retry</Button>
          </Alert>
        ) : null}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-56 animate-pulse rounded-[10px] bg-slate-200/70" />)}
          </div>
        ) : null}

        {!loading && !error && flows.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-[12px] border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700"><GitBranch size={26} /></div>
            <h3 className="mt-5 text-lg font-black text-slate-900">No automation flows yet</h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              Create your first WhatsApp chatbot flow.
            </p>
            <Button className="mt-5" onClick={() => setCreateOpen(true)}>
              Start building
              <ArrowRight size={16} />
            </Button>
          </div>
        ) : null}

        {!loading && flows.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {flows.map((flow) => (
              <FlowListCard key={getFlowId(flow)} flow={flow} onEdit={(flowId) => navigate(`/app/automation/${flowId}`)} onAction={(selectedFlow, action) => setPending({ flow: selectedFlow, action })} />
            ))}
          </div>
        ) : null}
      </section>

      <FlowCreateModal
        open={createOpen}
        busy={busy}
        onClose={() => setCreateOpen(false)}
        onCreate={createFlow}
      />
      <FlowConfirmModal
        open={Boolean(pending)}
        title={pending ? ACTION_COPY[pending.action].title : ""}
        message={pending ? ACTION_COPY[pending.action].message : ""}
        confirmLabel={pending ? ACTION_COPY[pending.action].label : ""}
        danger={pending?.action === "delete" || pending?.action === "archive"}
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={runAction}
      />
    </div>
  );
}
