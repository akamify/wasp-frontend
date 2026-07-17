import type { Edge, Node } from "reactflow";

export type FlowStatus = "draft" | "active" | "paused" | "archived";
export type TriggerType = "keyword" | "template_button" | "ctwa" | "manual" | null;
export type MatchMode = "exact" | "contains" | "regex";
export type FlowNodeType =
  | "start"
  | "text"
  | "text_buttons"
  | "ask_question"
  | "list"
  | "media"
  | "template"
  | "condition"
  | "delay"
  | "wait_for_reply"
  | "variable"
  | "fallback"
  | "set_tag"
  | "set_attribute"
  | "api_request"
  | "request_intervention"
  | "end";

export type KeyValueMap = Record<string, string>;

export interface FlowTrigger {
  type: TriggerType;
  keywords: string[];
  matchMode: MatchMode;
  templateButtonPayloads: string[];
  ctwaPayloads: string[];
}

export type SessionExpiryAction = "none" | "text" | "template";

export type TemplateVariableSourceType =
  | "static"
  | "contact_field"
  | "contact_attribute"
  | "api_context"
  | "workspace_field";

export interface TemplateVariableMapping {
  index: number;
  sourceType: TemplateVariableSourceType;
  sourceKey: string;
  value?: string;
  fallback: string;
  buttonIndex?: number;
}

export interface TemplateComponentMapping {
  type: "header" | "body" | "button";
  label?: string;
  buttonIndex?: number;
  variables: TemplateVariableMapping[];
}

export interface FlowTemplateConfig {
  templateName: string;
  languageCode: string;
  components: TemplateComponentMapping[];
}

export interface FlowRuntimeSettings {
  sessionTimeoutMinutes: number;
  allowKeywordRestartWhenWaiting: boolean;
  maxInvalidReplies?: number;
  invalidReplyMessage?: string;
  staticVariables?: Record<string, string>;
  onSessionExpired: {
    action: SessionExpiryAction;
    textMessage: string;
    templateName: string;
    languageCode: string;
    variables: string[];
    templateConfig?: FlowTemplateConfig;
  };
}

export interface FlowNodeConfig {
  [key: string]: unknown;
}

export interface BackendFlowNode {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  config: FlowNodeConfig;
}

export interface BackendFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
}

export interface FlowDraft {
  nodes: BackendFlowNode[];
  edges: BackendFlowEdge[];
  fallbackNodeId: string | null;
  handoverNodeId: string | null;
}

export interface AutomationFlow {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  status: FlowStatus;
  trigger: FlowTrigger;
  runtimeSettings?: FlowRuntimeSettings;
  draft: FlowDraft;
  activeVersionId?: string | null;
  draftHash?: string | null;
  lastValidatedDraftHash?: string | null;
  lastValidationStatus?: "stale" | "passed" | "failed";
  lastValidatedAt?: string | null;
  lastValidationErrors?: ValidationIssue[];
  lastValidationWarnings?: ValidationIssue[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  nodeId?: string;
  field?: string;
}

export interface FlowValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface FlowNodeData {
  nodeType: FlowNodeType;
  config: FlowNodeConfig;
}

export type BuilderNode = Node<FlowNodeData>;
export type BuilderEdge = Edge;

export interface FlowDraftPayload {
  trigger: FlowTrigger;
  nodes: BackendFlowNode[];
  edges: BackendFlowEdge[];
  fallbackNodeId: string | null;
  handoverNodeId: string | null;
  runtimeSettings: FlowRuntimeSettings;
}

export interface FlowListParams {
  status?: FlowStatus | "";
  search?: string;
  page?: number;
  limit?: number;
}
