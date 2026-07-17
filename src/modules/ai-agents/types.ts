export type AiAgentStatus = "draft" | "active" | "paused" | "archived";
export type AiAgentPersona = "sales" | "support" | "booking" | "faq" | "custom";
export type AiAgentProvider = "openai" | "gemini" | "manual";
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
  allowedTopics: string[];
  blockedTopics: string[];
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
