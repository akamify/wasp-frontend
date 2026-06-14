import { Badge } from "@components/ui/Badge";
import type { FlowStatus } from "@modules/automation-flows/types";

const TONES: Record<FlowStatus, "neutral" | "good" | "warn" | "bad"> = {
  draft: "neutral",
  active: "good",
  paused: "warn",
  archived: "bad",
};

export function FlowStatusBadge({ status }: Readonly<{ status: FlowStatus }>) {
  return <Badge tone={TONES[status]}>{status}</Badge>;
}
