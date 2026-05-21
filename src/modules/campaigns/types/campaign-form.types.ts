import type { Dispatch, SetStateAction } from "react";

export type CampaignType = "broadcast" | "csv" | "api";

export type CampaignContact = {
  _id: string;
  name?: string;
  phone: string;
  company?: string;
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
  scheduledAt?: string;
  recipients?: CampaignRecipient[];
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
