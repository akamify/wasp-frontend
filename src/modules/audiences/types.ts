export type AudienceFieldType = "text" | "number" | "date" | "boolean" | "multi_select";

export type AudienceCondition = {
  kind: "condition";
  field: string;
  fieldType?: AudienceFieldType | null;
  operator: string;
  value?: unknown;
  secondaryValue?: unknown;
};

export type AudienceGroup = {
  kind: "group";
  operator: "and" | "or";
  conditions: Array<AudienceCondition | AudienceGroup>;
};

export type AudienceFieldDefinition = {
  field: string;
  label: string;
  category: string;
  type: AudienceFieldType;
  path: string;
  attributeKey?: string;
};

export type SavedFilter = {
  _id: string;
  name: string;
  description?: string;
  filterTree: AudienceGroup;
  createdAt?: string;
  updatedAt?: string;
};

export type Audience = {
  _id: string;
  name: string;
  description?: string;
  type: "dynamic" | "static";
  filterTree?: AudienceGroup | null;
  contactIds?: string[];
  contactCount?: number;
  lastRefreshedAt?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AudiencePreviewResponse = {
  contacts: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filterTree: AudienceGroup;
};
