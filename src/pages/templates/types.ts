export type TemplateStatus = "approved" | "pending" | "rejected" | "paused" | "disabled";
export type TemplateCategory = "utility" | "marketing" | "authentication";
export type CtaType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "VOICE_CALL" | "FLOW" | "COPY_CODE";
export type HeaderType = "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
export type AuthSupportedApp = {
  id: string;
  packageName: string;
  signatureHash: string;
};

export type CtaButton = {
  id: string;
  type: CtaType;
  text: string;
  url: string;
  urlExample?: string;
  urlMode?: "static" | "dynamic";
  phoneNumber: string;
  ttlMinutes: string;
  flowId: string;
  flowIcon: "DEFAULT" | "DOCUMENT" | "PROMOTION" | "REVIEW";
  flowType: string;
  offerCode: string;
};

export type TemplateItem = {
  _id: string;
  name: string;
  language: string;
  category: TemplateCategory;
  status: TemplateStatus;
  source?: "local" | "meta";
  rejectedReason?: string;
  components?: any[];
};
