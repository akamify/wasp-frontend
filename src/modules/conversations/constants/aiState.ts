export const AI_STATES = Object.freeze({
  AI_ACTIVE: "AI_ACTIVE",
  HUMAN_ACTIVE: "HUMAN_ACTIVE",
  HANDOVER_PENDING: "HANDOVER_PENDING",
  PAUSED: "PAUSED",
  CLOSED: "CLOSED",
} as const);

export type AiState = (typeof AI_STATES)[keyof typeof AI_STATES];
