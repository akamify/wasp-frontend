import {
  Archive,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Trash2,
  Workflow,
} from "lucide-react";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { FlowStatusBadge } from "@modules/automation-flows/components/FlowStatusBadge";
import { getFlowId } from "@modules/automation-flows/flowIdentity";
import type { AutomationFlow } from "@modules/automation-flows/types";

export type FlowAction = "pause" | "resume" | "archive" | "delete";

function triggerSummary(flow: AutomationFlow) {
  const trigger = flow.trigger;
  if (!trigger?.type) return "Trigger not configured";
  if (trigger.type === "manual") return "Manual start";
  if (trigger.type === "keyword") {
    const first = trigger.keywords?.[0];
    const extra = Math.max(0, (trigger.keywords?.length || 0) - 1);
    return first ? `Keyword: ${first}${extra ? ` +${extra}` : ""}` : "Keyword trigger";
  }
  if (trigger.type === "template_button") return "Template button payload";
  return "Click-to-WhatsApp payload";
}

interface FlowListCardProps {
  flow: AutomationFlow;
  onEdit: (flowId: string) => void;
  onAction: (flow: AutomationFlow, action: FlowAction) => void;
}

export function FlowListCard({
  flow,
  onEdit,
  onAction,
}: Readonly<FlowListCardProps>) {
  const flowId = getFlowId(flow);

  return (
    <Card className="group overflow-hidden p-0 hover:-translate-y-0.5">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] bg-brand-50 text-brand-700">
          <Workflow size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-black text-slate-900">{flow.name}</h2>
            <FlowStatusBadge status={flow.status} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-500">
            {flow.description || "No description"}
          </p>
        </div>
        <MoreHorizontal size={18} className="text-slate-300" />
      </div>
      <div className="grid grid-cols-2 border-y border-slate-100 bg-slate-50/70">
        <div className="border-r border-slate-100 px-5 py-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Trigger
          </div>
          <div className="mt-1 truncate text-xs font-bold text-slate-700">
            {triggerSummary(flow)}
          </div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Last updated
          </div>
          <div className="mt-1 text-xs font-bold text-slate-700">
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(flow.updatedAt))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 p-4">
        <Button
          size="sm"
          variant="outline"
          disabled={!flowId}
          onClick={() => flowId && onEdit(flowId)}
        >
          <Pencil size={14} />
          Edit
        </Button>
        {flow.status === "active" ? (
          <Button size="sm" variant="ghost" onClick={() => onAction(flow, "pause")}>
            <Pause size={14} />
            Pause
          </Button>
        ) : null}
        {flow.status === "paused" ? (
          <Button size="sm" variant="ghost" onClick={() => onAction(flow, "resume")}>
            <Play size={14} />
            Resume
          </Button>
        ) : null}
        {flow.status !== "archived" ? (
          <Button size="sm" variant="ghost" onClick={() => onAction(flow, "archive")}>
            <Archive size={14} />
            Archive
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          onClick={() => onAction(flow, "delete")}
        >
          <Trash2 size={14} />
          Delete
        </Button>
      </div>
    </Card>
  );
}
