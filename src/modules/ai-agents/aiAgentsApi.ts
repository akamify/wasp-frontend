import { API } from "@api/api";
import type {
  AiAddonStatusResponse,
  AiAdminFinancialDashboardResponse,
  AiAgent,
  AiAgentListResponse,
  AiAgentPayload,
  AiAgentStatus,
  AiBillingStatementListResponse,
  AiBillingSummaryResponse,
  AiBillingTimelineResponse,
  AiBudgetStatusResponse,
  AiCreditTransactionListResponse,
  AiDashboardResponse,
  AiKnowledgePayload,
  AiKnowledgeSource,
  AiTestMessageResponse,
  AiUsageAnalyticsResponse,
  AiUsageExplorerResponse,
  AiWorkspaceReportResponse,
} from "@modules/ai-agents/types";

interface AiAgentResponse {
  success: boolean;
  agent: AiAgent;
}

export interface AiDashboardParams {
  dateFrom?: string;
  dateTo?: string;
  agentId?: string;
  channel?: "all" | "test" | "whatsapp" | "api";
}

export const aiAgentsApi = {
  addonStatus: () =>
    API.aiAgents.addonStatus() as Promise<AiAddonStatusResponse>,
  purchaseAddon: () =>
    API.aiAgents.purchaseAddon() as Promise<AiAddonStatusResponse>,
  dashboard: (params?: AiDashboardParams) =>
    API.aiAgents.dashboard(params) as Promise<AiDashboardResponse>,
  addonTransactions: (params?: { limit?: number; cursor?: string }) =>
    API.aiAgents.addonTransactions(params) as Promise<AiCreditTransactionListResponse>,
  billingSummary: (params?: Record<string, unknown>) =>
    API.aiAgents.billingSummary(params) as Promise<AiBillingSummaryResponse>,
  billingStatements: (params?: Record<string, unknown>) =>
    API.aiAgents.billingStatements(params) as Promise<AiBillingStatementListResponse>,
  billingStatementDownload: (periodKey: string) =>
    API.aiAgents.billingStatementDownload(periodKey) as Promise<Blob>,
  billingTimeline: (params?: Record<string, unknown>) =>
    API.aiAgents.billingTimeline(params) as Promise<AiBillingTimelineResponse>,
  billingAnalytics: (params?: Record<string, unknown>) =>
    API.aiAgents.billingAnalytics(params) as Promise<AiUsageAnalyticsResponse>,
  billingUsageExplorer: (params?: Record<string, unknown>) =>
    API.aiAgents.billingUsageExplorer(params) as Promise<AiUsageExplorerResponse>,
  billingBudget: () =>
    API.aiAgents.billingBudget() as Promise<AiBudgetStatusResponse>,
  updateBillingBudget: (payload: Record<string, unknown>) =>
    API.aiAgents.billingBudgetUpdate(payload) as Promise<AiBudgetStatusResponse>,
  billingReport: (params: Record<string, unknown>) =>
    API.aiAgents.billingReports(params) as Promise<AiWorkspaceReportResponse>,
  billingReportDownload: (params: Record<string, unknown>) =>
    API.aiAgents.billingReportDownload(params) as Promise<Blob>,
  purchaseTopup: (payload: { packId: string }) =>
    API.aiAgents.purchaseTopup(payload) as Promise<AiAddonStatusResponse>,
  adjustCredits: (payload: { type: "refund" | "adjustment"; credits: number; reason?: string; reference?: string }) =>
    API.aiAgents.adjustCredits(payload) as Promise<AiAddonStatusResponse>,
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
      API.aiAgents.knowledgeList(agentId) as Promise<{
        success: boolean;
        sources: AiKnowledgeSource[];
        quota: {
          workspaceUsedBytes: number;
          workspaceUsedMb: number;
          workspaceQuotaBytes: number;
          workspaceQuotaMb: number;
          workspaceRemainingBytes: number;
          workspaceRemainingMb: number;
        };
        policy: {
          maxUploadBytes: number;
          supportedMimeTypes: string[];
          maxWebsiteBytes: number;
          maxExtractedChars: number;
          crawlPagesAllowed: number;
          crawlDepthAllowed: number;
          maxUrlSourcesPerAgent: number;
          maxTitleDuplicatesPerAgent: number;
          chunking: {
            minChunkSize: number;
            maxChunkSize: number;
            maxChunksPerSource: number;
            defaultChunkSize: number;
            defaultMaxChunks: number;
          };
          ranking: {
            minSearchBoost: number;
            maxSearchBoost: number;
            defaultSearchBoost: number;
          };
        };
        duplicates: {
          duplicateTitles: Record<string, number>;
        };
      }>,
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
  adminFinancialDashboard: (params?: Record<string, unknown>) =>
    API.superAdmin.aiAddonFinancialDashboard(params) as Promise<AiAdminFinancialDashboardResponse>,
};
