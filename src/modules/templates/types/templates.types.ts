export type TemplateStatus = "draft" | "published" | "archived" | "approved" | "pending" | "rejected" | "paused" | "disabled";
export type TemplateCategory = "utility" | "marketing" | "authentication";
export type TemplateOwnerType = "system" | "workspace";
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
  flowIcon: "DOCUMENT" | "PROMOTION" | "REVIEW";
  flowType: string;
  offerCode: string;
};

export type TemplateItem = {
  _id: string;
  name: string;
  language: string;
  category: TemplateCategory;
  status: TemplateStatus;
  ownerType?: TemplateOwnerType;
  libraryCategory?: string | null;
  industry?: string | null;
  templatePackKey?: string | null;
  templatePackName?: string | null;
  templatePackOrder?: number;
  tags?: string[];
  featured?: boolean;
  thumbnail?: string | null;
  sourceTemplateId?: string | null;
  isOfficial?: boolean;
  isFavorite?: boolean;
  popularity?: number;
  description?: string;
  source?: "local" | "meta";
  rejectedReason?: string;
  components?: any[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type TemplateVersionItem = {
  _id: string;
  versionNumber: number;
  action: "created" | "updated" | "restored" | "submitted" | "synced" | "published" | "archived" | "duplicated";
  createdAt: string;
  updatedAt: string;
  updatedBy?: {
    userId?: string | null;
    email?: string | null;
    name?: string | null;
  };
  changes?: Array<{
    field: string;
    before?: unknown;
    after?: unknown;
  }>;
  snapshot?: {
    name?: string;
    language?: string;
    category?: TemplateCategory;
    status?: TemplateStatus;
    ownerType?: TemplateOwnerType;
    components?: any[];
  };
};
