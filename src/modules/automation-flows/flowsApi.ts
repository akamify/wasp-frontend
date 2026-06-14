import { API } from "@api/api";
import type {
  AutomationFlow,
  FlowDraftPayload,
  FlowListParams,
  FlowValidationResult,
} from "@modules/automation-flows/types";
import { normalizeFlowIdentity } from "@modules/automation-flows/flowIdentity";

interface FlowResponse {
  success: boolean;
  flow: AutomationFlow;
}

interface FlowListResponse {
  success: boolean;
  flows: AutomationFlow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function normalizeFlowResponse(response: FlowResponse): FlowResponse {
  return {
    ...response,
    flow: normalizeFlowIdentity(response.flow),
  };
}

export const flowsApi = {
  list: async (params: FlowListParams) => {
    const cleanParams = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params.page ? { page: params.page } : {}),
      ...(params.limit ? { limit: params.limit } : {}),
    };
    const response = await API.automationFlows.list(cleanParams) as FlowListResponse;
    return {
      ...response,
      flows: Array.isArray(response.flows)
        ? response.flows.map(normalizeFlowIdentity)
        : [],
    };
  },
  get: async (flowId: string) =>
    normalizeFlowResponse(await API.automationFlows.get(flowId) as FlowResponse),
  create: async (payload: { name: string; description?: string }) =>
    normalizeFlowResponse(await API.automationFlows.create(payload) as FlowResponse),
  updateMetadata: async (flowId: string, payload: { name?: string; description?: string }) =>
    normalizeFlowResponse(
      await API.automationFlows.updateMetadata(flowId, payload) as FlowResponse
    ),
  saveDraft: async (flowId: string, payload: FlowDraftPayload) =>
    normalizeFlowResponse(
      await API.automationFlows.saveDraft(flowId, payload) as FlowResponse
    ),
  validate: (flowId: string) =>
    API.automationFlows.validate(flowId) as Promise<FlowValidationResult>,
  testApiRequest: (payload: {
    flowId?: string;
    nodeId?: string;
    config: unknown;
    sampleContext?: Record<string, unknown>;
    sampleContact?: Record<string, unknown>;
    sampleAttributes?: Record<string, unknown>;
  }) => API.automationFlows.testApiRequest(payload) as Promise<{
    ok: boolean;
    status?: number;
    durationMs?: number;
    responsePreview?: unknown;
    mappedContext?: Record<string, unknown>;
    errorCode?: string;
    message?: string;
  }>,
  testMediaNode: (payload: {
    flowId?: string;
    nodeId?: string;
    config: unknown;
    sampleContext?: Record<string, unknown>;
    sampleContact?: Record<string, unknown>;
    sampleAttributes?: Record<string, unknown>;
  }) => API.automationFlows.testMediaNode(payload) as Promise<{
    ok: boolean;
    mediaType?: string;
    sourceType?: string;
    resolvedUrl?: string;
    fileInfo?: {
      mimeType?: string | null;
      sizeBytes?: number | null;
      filename?: string | null;
    };
    code?: string;
    message?: string;
  }>,
  publish: (flowId: string) =>
    API.automationFlows.publish(flowId) as Promise<{
      success: boolean;
      version: { _id: string; versionNumber: number };
      validation: FlowValidationResult;
    }>,
  pause: async (flowId: string) =>
    normalizeFlowResponse(await API.automationFlows.pause(flowId) as FlowResponse),
  resume: async (flowId: string) =>
    normalizeFlowResponse(await API.automationFlows.resume(flowId) as FlowResponse),
  archive: async (flowId: string) =>
    normalizeFlowResponse(await API.automationFlows.archive(flowId) as FlowResponse),
  remove: (flowId: string) =>
    API.automationFlows.remove(flowId) as Promise<{ success: boolean }>,
};
