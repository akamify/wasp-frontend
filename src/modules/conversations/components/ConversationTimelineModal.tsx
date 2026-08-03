import { Modal } from "@components/ui/Modal";

type ConversationEventItem = {
  id: string;
  type: string;
  actor?: { kind?: string; nameSnapshot?: string; resolvedName?: string | null } | null;
  payload?: any;
  createdAt?: string;
};

export function ConversationTimelineModal({
  events,
  open,
  onClose,
  phone,
}: {
  events: ConversationEventItem[];
  open: boolean;
  onClose: () => void;
  phone: string;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} title={`Conversation timeline: ${phone || "chat"}`} className="max-w-[820px]">
      <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-1">
        {(events || []).length ? (
          events.map((event) => {
            const actorLabel =
              event.actor?.resolvedName ||
              event.actor?.nameSnapshot ||
              event.actor?.kind ||
              "system";
            return (
              <div key={event.id} className="rounded-[10px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-black text-slate-900">
                  {eventTitle(event)}
                </div>
                {eventSubtitle(event) ? (
                  <div className="mt-1 text-sm font-semibold text-slate-600">
                    {eventSubtitle(event)}
                  </div>
                ) : null}
                <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {actorLabel} {" • "} {event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            No timeline activity found.
          </div>
        )}
      </div>
    </Modal>
  );
}

function eventTitle(event: { type: string; payload?: any }) {
  switch (String(event.type || "")) {
    case "ai_handover_requested":
      return "AI requested handover";
    case "ai_handover_taken_over":
      return "Human takeover started";
    case "ai_returned":
      return "Conversation returned to AI";
    case "assigned":
      return "Assigned to employee";
    case "reassigned":
      return "Reassigned";
    case "unassigned":
      return "Unassigned";
    default:
      return String(event.type || "Activity")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (value) => value.toUpperCase());
  }
}

function eventSubtitle(event: { type: string; payload?: any }) {
  const payload = event.payload || {};
  if (event.type === "ai_handover_requested") return payload.reason ? `Reason: ${payload.reason}` : "";
  if (event.type === "ai_handover_taken_over") {
    return payload.assignedEmployeeName
      ? `Employee assigned: ${payload.assignedEmployeeName}`
      : payload.reason
        ? `Reason: ${payload.reason}`
        : "";
  }
  if (event.type === "ai_returned") return payload.reason ? `Note: ${payload.reason}` : "";
  if (event.type === "assigned" || event.type === "reassigned") {
    const employeeLabel = payload.toEmployeeName || payload.assignedEmployeeName || payload.toEmployeeId || "";
    if (employeeLabel && payload.reason) return `Assigned to ${employeeLabel} • ${payload.reason}`;
    if (employeeLabel) return `Assigned to ${employeeLabel}`;
    return payload.reason ? `Reason: ${payload.reason}` : "";
  }
  return "";
}
