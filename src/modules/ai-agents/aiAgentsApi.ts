import { API } from "@api/api";
import type { AiAgent, AiAgentListResponse, AiAgentPayload, AiAgentStatus, AiKnowledgePayload, AiKnowledgeSource, AiTestMessageResponse } from "@modules/ai-agents/types";

interface AiAgentResponse {
  success: boolean;
  agent: AiAgent;
}

export const aiAgentsApi = {
  list: (params: { status?: AiAgentStatus | ""; search?: string; page?: number; limit?: number }) =>
    API.aiAgents.list(params) as Promise<AiAgentListResponse>,
  create: (payload: AiAgentPayload) =>
    API.aiAgents.create(payload) as Promise<AiAgentResponse>,
  update: (agentId: string, payload: AiAgentPayload) =>
    API.aiAgents.update(agentId, payload) as Promise<AiAgentResponse>,
  remove: (agentId: string) =>
    API.aiAgents.remove(agentId) as Promise<{ success: boolean }>,
  testMessage: (agentId: string, payload: { message: string; contactId?: string }) =>
    API.aiAgents.testMessage(agentId, payload) as Promise<AiTestMessageResponse>,
  conversations: (agentId: string) =>
    API.aiAgents.conversations(agentId) as Promise<{ success: boolean; conversations: unknown[] }>,
  clearTestMemory: (agentId: string, payload: { contactId?: string } = {}) =>
    API.aiAgents.clearTestMemory(agentId, payload) as Promise<{ success: boolean }>,
  knowledge: {
    list: (agentId: string) =>
      API.aiAgents.knowledgeList(agentId) as Promise<{ success: boolean; sources: AiKnowledgeSource[] }>,
    create: (agentId: string, payload: AiKnowledgePayload) =>
      API.aiAgents.knowledgeCreate(agentId, payload) as Promise<{ success: boolean; source: AiKnowledgeSource }>,
    upload: (agentId: string, file: File, onProgress?: (pct: number) => void) =>
      API.aiAgents.knowledgeUpload(agentId, file, onProgress) as Promise<{ success: boolean; source: AiKnowledgeSource }>,
    update: (agentId: string, sourceId: string, payload: AiKnowledgePayload) =>
      API.aiAgents.knowledgeUpdate(agentId, sourceId, payload) as Promise<{ success: boolean; source: AiKnowledgeSource }>,
    remove: (agentId: string, sourceId: string) =>
      API.aiAgents.knowledgeRemove(agentId, sourceId) as Promise<{ success: boolean }>,
    reindex: (agentId: string, sourceId: string) =>
      API.aiAgents.knowledgeReindex(agentId, sourceId) as Promise<{ success: boolean; source: AiKnowledgeSource }>,
  },
};
