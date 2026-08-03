export type AiAgentStatus = "draft" | "active" | "paused" | "archived";
export type AiAgentPersona = "sales" | "support" | "booking" | "faq" | "custom";
export type AiAgentProvider = "gemini";
export type AiAgentKnowledgeType = "text" | "url" | "faq" | "file";
export type AiKnowledgeSourceType = "faq" | "text" | "url" | "pdf" | "docx" | "csv" | "txt";
export type AiKnowledgeSourceStatus = "draft" | "indexing" | "indexed" | "failed";
export type AiAgentToolType = "crm_lookup" | "contact_update" | "set_tag" | "set_attribute" | "api_request" | "handover";

export interface AiAgentKnowledgeSource {
  _id?: string;
  type: AiAgentKnowledgeType;
  title: string;
  content: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface AiKnowledgeSource {
  _id: string;
  id: string;
  agentId: string;
  type: AiKnowledgeSourceType;
  title: string;
  content: string;
  sourceUrl: string;
  status: AiKnowledgeSourceStatus;
  metadata: {
    totalChunks: number;
    lastIndexedAt?: string | null;
    error?: string;
    question?: string;
    answer?: string;
    originalName?: string;
    mimeType?: string;
    sizeBytes?: number;
    extractionMethod?: string;
    searchBoost?: number;
    chunkSize?: number;
    maxChunks?: number;
    crawlPages?: number;
    crawlDepth?: number;
    duplicateOfSourceId?: string | null;
    duplicateTitle?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AiKnowledgePayload {
  type: AiKnowledgeSourceType;
  title?: string;
  content?: string;
  sourceUrl?: string;
  question?: string;
  answer?: string;
  searchBoost?: number;
  chunkSize?: number;
  maxChunks?: number;
  crawlPages?: number;
  crawlDepth?: number;
}

export interface AiAgentTool {
  type: AiAgentToolType;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface AiAgentGuardrails {
  fallbackMessage: string;
  handoverOnLowConfidence: boolean;
  maxMessagesPerSession: number;
  confidenceThreshold?: number;
  allowedTopics: string[];
  blockedTopics: string[];
}

export interface AiAgentRuntimeControls {
  businessHours?: {
    enabled: boolean;
    timezone: string;
    days: string[];
    startTime: string;
    endTime: string;
    afterHoursAction: "reply_and_handover" | "handover_only" | "pause";
  };
  escalationRules?: {
    enabled: boolean;
    keywords: string[];
    slaMinutes: number;
    action: "handover" | "pause";
  };
  conversationSla?: {
    enabled: boolean;
    firstResponseMinutes: number;
  };
  fallbackTemplates?: {
    afterHours: string;
    escalation: string;
    noAnswer: string;
  };
  routing?: {
    keywords: string[];
    priority: number;
    channels: Array<"whatsapp" | "test" | "api">;
  };
}

export interface AiAgent {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  status: AiAgentStatus;
  persona: AiAgentPersona;
  modelProvider: AiAgentProvider;
  modelName: string;
  systemPrompt: string;
  language: string;
  temperature: number;
  knowledgeSources: AiAgentKnowledgeSource[];
  tools: AiAgentTool[];
  guardrails: AiAgentGuardrails;
  runtimeControls?: AiAgentRuntimeControls;
  version?: number;
  versionHistory?: Array<{
    _id?: string;
    version: number;
    changedBy?: string | null;
    changedAt?: string | null;
    reason?: string;
    snapshot?: Record<string, unknown>;
  }>;
  stats?: {
    conversations: number;
    messages: number;
    handovers: number;
    lastUsedAt?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export type AiAgentPayload = Partial<Omit<AiAgent, "_id" | "id" | "createdAt" | "updatedAt" | "stats">>;

export interface AiAgentListResponse {
  success: boolean;
  agents: AiAgent[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AiConversationMessage {
  _id?: string;
  role: "user" | "assistant" | "system" | "tool";
  text: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface AiConversation {
  _id: string;
  id: string;
  agentId: string;
  contactId?: string | null;
  channel: "test" | "whatsapp" | "api";
  status: "active" | "handover" | "closed";
  messages: AiConversationMessage[];
  lastMessageAt?: string | null;
}

export interface AiTestMessageResponse {
  success: boolean;
  reply: string;
  confidence: number;
  action: "reply" | "handover" | "blocked";
  guardrail: {
    passed: boolean;
    reason?: string | null;
  };
  provider: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    creditsUsed: number;
    latencyMs: number;
  };
  conversation?: AiConversation;
  tools?: Array<{ type: string; status: string }>;
  sources?: Array<{ sourceId?: string | null; title: string; url?: string; chunkId?: string }>;
}

export interface AiAddonCatalog {
  planKey: string;
  planName: string;
  currency: string;
  monthlyPrice: number;
  includedCredits: number;
  tokensPerCredit: number;
  includedTokens: number;
  durationDays: number;
  topupPacks: AiAddonTopupPack[];
  renewalPolicy?: {
    mode: string;
    expireUnusedCredits: boolean;
    expireUnusedIncludedCredits: boolean;
    preservePurchasedTopupCredits: boolean;
  };
}

export interface AiProviderModelOption {
  key: string;
  label: string;
  deprecated?: boolean;
}

export interface AiAddonTopupPack {
  packId: string;
  label: string;
  credits: number;
  price: number;
  sortOrder: number;
}

export interface AiCreditTransaction {
  id: string;
  workspaceId: string;
  subscriptionId?: string | null;
  userId?: string | null;
  executionKey?: string | null;
  type: "purchase" | "monthly_reset" | "topup_purchase" | "usage" | "refund" | "adjustment";
  entryType?:
    | "included_credit_allocation"
    | "included_credit_usage"
    | "topup_purchase"
    | "topup_usage"
    | "manual_adjustment"
    | "refund"
    | "credit_expiry"
    | "subscription_reset"
    | "migration_adjustment"
    | null;
  source?: string;
  reason?: string;
  reference?: string;
  conversationId?: string | null;
  agentId?: string | null;
  actor?: {
    actorType: string;
    actorId?: string | null;
    actorName?: string;
  };
  direction: "credit" | "debit";
  credits: number;
  tokens: number;
  amount: number;
  currency: string;
  description: string;
  balanceAfter: {
    remainingCredits: number;
    remainingTokens: number;
    remainingIncludedTokens: number;
    remainingTopupTokens: number;
    remainingIncludedCredits?: number;
    remainingTopupCredits?: number;
  };
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
}

export interface AiAddonSubscription {
  id: string;
  workspaceId: string;
  userId: string;
  planKey: string;
  planName: string;
  status: "active" | "cancelled" | "expired";
  currency: string;
  monthlyPrice: number;
  includedCredits: number;
  totalCredits: number;
  remainingCredits: number;
  remainingTokens: number;
  remainingIncludedTokens: number;
  remainingIncludedCredits?: number;
  remainingTopupTokens: number;
  remainingTopupCredits?: number;
  totalTopupCredits: number;
  tokensPerCredit: number;
  lastResetAt?: string | null;
  activatedAt?: string | null;
  renewalDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AiAddonStatusResponse {
  success: boolean;
  access: {
    enabled: boolean;
    reason?: string | null;
  };
  featureAccess: {
    allowed: boolean;
    reason?: string | null;
  };
  purchase: {
    allowed: boolean;
    reason?: string | null;
  };
  catalog: AiAddonCatalog;
  subscription: AiAddonSubscription | null;
  workspace: {
    id: string;
    aiAgentEnabled: boolean;
    aiSubscriptionId?: string | null;
    includedCredits: number;
    remainingIncludedCredits: number;
    totalCredits: number;
    remainingCredits: number;
    remainingTokens: number;
    remainingTopupCredits: number;
    renewalDate?: string | null;
    activatedAt?: string | null;
    renewalPolicy?: {
      mode: string;
      expireUnusedCredits: boolean;
      expireUnusedIncludedCredits: boolean;
      preservePurchasedTopupCredits: boolean;
    };
  };
  wallet: {
    balance: number;
    currency: string;
  };
  message?: string;
}

export interface AiCreditTransactionListResponse {
  success: boolean;
  transactions: AiCreditTransaction[];
  nextCursor?: string | null;
}

export interface AiBillingStatementItem {
  id: string;
  workspaceId: string;
  subscriptionId?: string | null;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  workspace: {
    name?: string;
    businessName?: string;
    slug?: string;
  };
  plan: {
    subscriptionPlan?: string;
    aiAddonPlan?: string;
    currency?: string;
    tokensPerCredit?: number;
  };
  balances: {
    openingCredits: number;
    openingTokens: number;
    includedCreditsAdded: number;
    includedTokensAdded: number;
    topupCreditsPurchased: number;
    topupTokensPurchased: number;
    creditsConsumed: number;
    tokensConsumed: number;
    creditsRefunded: number;
    tokensRefunded: number;
    creditsAdjusted: number;
    tokensAdjusted: number;
    includedCreditsExpired: number;
    includedTokensExpired: number;
    closingCredits: number;
    closingTokens: number;
  };
  activity: {
    totalAiRequests: number;
    totalRuntimeExecutions: number;
    totalConversationsHandled: number;
  };
  reconciledAt?: string | null;
}

export interface AiBillingStatementListResponse {
  success: boolean;
  items: AiBillingStatementItem[];
  page: number;
  limit: number;
}

export interface AiBudgetStatusResponse {
  success: boolean;
  config: {
    monthlyCreditBudget: number;
    monthlyCreditWarning: number;
    lowCreditWarning: number;
    nearExhaustionWarning: number;
    notificationsEnabled: boolean;
    updatedAt?: string | null;
  };
  status: {
    usedThisMonth: number;
    remainingCredits: number;
    alerts: Array<{ code: string; severity: string; message: string }>;
  };
}

export interface AiBillingSummaryResponse {
  success: boolean;
  range: {
    preset: string;
    dateFrom: string;
    dateTo: string;
  };
  currentPlan: {
    planKey: string;
    planName: string;
    monthlyPrice: number;
    renewalDate?: string | null;
  };
  balanceBreakdown: {
    includedRemainingCredits: number;
    topupRemainingCredits: number;
    totalRemainingCredits: number;
    creditsUsedThisMonth: number;
    creditsPurchasedThisMonth: number;
    creditsRefundedThisMonth: number;
    creditsAdjustedThisMonth: number;
    creditsExpiredThisMonth: number;
  };
  usage: {
    totalRequests: number;
    totalConversations: number;
    avgCreditsPerRequest: number;
    avgCreditsPerConversation: number;
    estimatedRemainingRuntime: number | null;
  };
  spendingTrend: Array<{
    date: string;
    creditsUsed: number;
    requests: number;
  }>;
  budget: AiBudgetStatusResponse;
  billing: AiAddonStatusResponse;
}

export interface AiUsageAnalyticsResponse {
  success: boolean;
  filters: {
    preset: string;
    dateFrom: string;
    dateTo: string;
    agentId: string;
    channel: string;
  };
  workspace: {
    creditsConsumed: number;
    requests: number;
    conversations: number;
    avgCreditsPerConversation: number;
    avgCreditsPerRequest: number;
  };
  agents: Array<{
    agentId: string;
    agentName: string;
    creditsConsumed: number;
    requests: number;
    conversations: number;
    avgConfidence: number;
    avgRuntimeCost: number;
  }>;
  models: Array<{
    model: string;
    creditsConsumed: number;
    tokenConsumption: number;
    requests: number;
  }>;
}

export interface AiBillingTimelineResponse {
  success: boolean;
  filters: {
    preset: string;
    dateFrom: string;
    dateTo: string;
  };
  items: Array<{
    id: string;
    transactionId: string;
    eventType: string;
    eventLabel: string;
    description: string;
    credits: number;
    amount: number;
    currency: string;
    direction: string;
    source: string;
    reason: string;
    createdAt?: string | null;
  }>;
}

export interface AiUsageExplorerResponse {
  success: boolean;
  filters: {
    preset: string;
    dateFrom: string;
    dateTo: string;
  };
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: Array<{
    id: string;
    executionId: string;
    agentId: string;
    agentName: string;
    conversationId: string;
    conversationStatus: string;
    contactId: string;
    contactName: string;
    contactPhone: string;
    runtimeStatus: string;
    action: string;
    model: string;
    provider: string;
    creditsUsed: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    latencyMs: number;
    confidence: number;
    createdAt?: string | null;
  }>;
}

export interface AiWorkspaceReportResponse {
  success: boolean;
  reportType: string;
  filters?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
}

export interface AiAdminFinancialDashboardResponse {
  success: boolean;
  filters: {
    preset: string;
    dateFrom: string;
    dateTo: string;
  };
  metrics: {
    aiRevenue: number;
    topupRevenue: number;
    activeSubscriptions: number;
    creditsSold: number;
    creditsConsumed: number;
    refundsIssued: number;
    manualAdjustments: number;
    runtimeErrors: number;
    failedCalls: number;
    handoverRate: number;
  };
  highestConsumingWorkspaces: Array<{
    workspaceId: string;
    workspaceName: string;
    creditsConsumed: number;
    requests: number;
  }>;
  highestConsumingAgents: Array<{
    agentId: string;
    agentName: string;
    workspaceId: string;
    creditsConsumed: number;
    requests: number;
  }>;
}

export interface AiDashboardResponse {
  success: boolean;
  filters: {
    dateFrom: string;
    dateTo: string;
    agentId: string;
    channel: "all" | "test" | "whatsapp" | "api";
  };
  overview: {
    agentCounts: {
      total: number;
      active: number;
      draft: number;
      paused: number;
      archived: number;
    };
    conversationCounts: {
      total: number;
      active: number;
      handover: number;
      closed: number;
    };
    knowledge: {
      totalSources: number;
      indexedSources: number;
      knowledgeHitRate: number;
      knowledgeHitCount: number;
    };
    usage: {
      todayReplies: number;
      todayCredits: number;
      monthReplies: number;
      monthCredits: number;
      monthTokens: number;
      totalRequests: number;
      repliesCount: number;
      handoverCount: number;
      blockedCount: number;
      failureCount: number;
      successCount: number;
      avgLatencyMs: number;
      resolutionRate: number;
      costEstimate: number;
      knowledgeHitRate: number;
    };
  };
  topAgents: Array<{
    id: string;
    name: string;
    status: string;
    persona: string;
    conversations: number;
    messages: number;
    handovers: number;
    lastUsedAt?: string | null;
    creditsUsed: number;
    totalTokens: number;
    replies: number;
    failures: number;
  }>;
  recentConversations: Array<{
    id: string;
    agentId: string;
    agentName: string;
    contactId?: string | null;
    contactName: string;
    contactPhone: string;
    channel: "test" | "whatsapp" | "api";
    status: "active" | "handover" | "closed";
    lastMessageAt?: string | null;
    messageCount: number;
    preview: string;
  }>;
  usageSeries: Array<{
    date: string;
    creditsUsed: number;
    totalTokens: number;
    requests: number;
    failures: number;
    replies: number;
    handovers: number;
  }>;
  usageBreakdown: {
    creditsUsedToday: number;
    creditsUsedMonth: number;
    creditsUsedRange: number;
    repliesToday: number;
    repliesMonth: number;
    repliesCount: number;
    handoverCount: number;
    blockedCount: number;
    failureCount: number;
    successCount: number;
    totalRequests: number;
    totalTokens: number;
    estimatedCost: number;
    avgLatencyMs: number;
    resolutionRate: number;
    knowledgeHitRate: number;
    blockedRate: number;
    successRate: number;
    replyChannels: {
      whatsapp: number;
      test: number;
      api: number;
    };
  };
  channelBreakdown: Array<{
    channel: string;
    requests: number;
    creditsUsed: number;
    replies: number;
    handovers: number;
  }>;
  billing: AiAddonStatusResponse;
  settings: {
    provider: string;
    modelDefault: string;
    availableModels: AiProviderModelOption[];
    tokensPerCredit: number;
    renewalDate?: string | null;
  };
}
