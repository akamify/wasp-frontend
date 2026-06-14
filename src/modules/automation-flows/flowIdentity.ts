import type { AutomationFlow } from "@modules/automation-flows/types";

type FlowIdentity = Pick<AutomationFlow, "_id" | "id">;

export function getFlowId(flow: FlowIdentity): string {
  return String(flow._id || flow.id || "").trim();
}

export function normalizeFlowIdentity(flow: AutomationFlow): AutomationFlow {
  const flowId = getFlowId(flow);
  return {
    ...flow,
    _id: flowId,
    id: flowId,
  };
}
