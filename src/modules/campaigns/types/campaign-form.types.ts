import type { Dispatch, SetStateAction } from "react";

export type CampaignType = "broadcast" | "csv" | "api";
export type CampaignScheduleFrequency = "once" | "daily" | "weekly";
export type CampaignScheduleType = "immediate" | CampaignScheduleFrequency;
export type CampaignAudienceMode = "manual" | "tags" | "attributes";

export type CampaignAttributeDefinition = {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "date" | "url";
  visible: boolean;
  active: boolean;
};

export type CampaignAttributeFilter = {
  key: string;
  operator: "equals" | "not_equals" | "exists" | "not_exists" | "contains";
  value?: string | number | boolean;
};

export type CampaignVariableMapping = {
  position: number;
  sourceType: "static" | "contact_field" | "contact_attribute";
  sourceKey?: string;
  value?: string;
  fallback?: string;
};

export type CampaignContact = {
  _id: string;
  name?: string;
  phone: string;
  company?: string;
  tags?: string[];
};

export type CsvParsed = { headers: string[]; rows: Record<string, string>[] };

export type CampaignEstimate = {
  totalRecipients: number;
  billableRecipients: number;
  freeRecipients: number;
  estimatedCredits: number;
  walletBalance: number;
  currency: string;
  insufficientBalance: boolean;
};

export type CampaignWalletBalance = { amount: number; currency: string };

export type CampaignTierInfo = {
  tierLabel: string;
  limitPer24h: number | null;
  remainingQuota: number | null;
} | null;

export type CampaignButtonValueTarget = {
  index: number;
  label: string;
};

export type CampaignRecipient = {
  to: string;
  variables: string[];
  headerVariables: string[];
  otpCode?: string;
  buttonValues: string[];
  buttonTtlMinutes: number[];
  flowTokens: string[];
  flowActionData: unknown[];
};

export type CampaignCreatePayload = {
  name?: string;
  type?: CampaignType;
  templateId: string;
  schedule?: {
    type: CampaignScheduleFrequency;
    timezone: string;
    runAt?: string;
    timeOfDay?: string;
    weekdays?: number[];
  };
  audience?: {
    mode: CampaignAudienceMode;
    tags?: string[];
    tagMatch?: "all" | "any";
    attributeFilters?: CampaignAttributeFilter[];
    runtime?: Omit<CampaignRecipient, "to">;
  };
  recipients?: CampaignRecipient[];
  templateVariableMappings?: CampaignVariableMapping[];
};

export type CampaignDemoPayload = {
  templateId: string;
  to: string;
  variables: string[];
  headerVariables: string[];
  otpCode?: string;
  buttonValues: string[];
  buttonTtlMinutes: number[];
  flowTokens: string[];
  flowActionData?: unknown[];
};

export type StringArraySetter = Dispatch<SetStateAction<string[]>>;
export type StringRecordSetter = Dispatch<SetStateAction<Record<string, true>>>;
export type NumberRecordSetter = Dispatch<SetStateAction<Record<number, string>>>;
