export type CampaignSource = "broadcast" | "csv" | "api";

export type Campaign = {
  id: string;
  name: string;
  template: string;
  audienceLabel: string;
  deliveredLabel: string;
  statusLabel: string;
  statusTone: "success" | "warning" | "info";
  updatedLabel: string;
};
