import type { AudienceCondition, AudienceFieldDefinition, AudienceFieldType, AudienceGroup } from "@modules/audiences/types";

export const DEFAULT_AUDIENCE_GROUP: AudienceGroup = {
  kind: "group",
  operator: "and",
  conditions: [],
};

export const OPERATOR_LABELS: Record<string, string> = {
  equals: "Equals",
  not_equals: "Not Equals",
  contains: "Contains",
  not_contains: "Doesn't Contain",
  starts_with: "Starts With",
  ends_with: "Ends With",
  empty: "Empty",
  not_empty: "Not Empty",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  between: "Between",
  today: "Today",
  yesterday: "Yesterday",
  last_7_days: "Last 7 Days",
  last_30_days: "Last 30 Days",
  last_90_days: "Last 90 Days",
  before: "Before",
  after: "After",
  yes: "Yes",
  no: "No",
  contains_any: "Contains Any",
  contains_all: "Contains All",
  contains_none: "Contains None",
};

export const OPERATORS_BY_TYPE: Record<AudienceFieldType, string[]> = {
  text: ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with", "empty", "not_empty"],
  number: ["equals", "not_equals", "gt", "gte", "lt", "lte", "between"],
  date: ["today", "yesterday", "last_7_days", "last_30_days", "last_90_days", "between", "before", "after", "empty", "not_empty"],
  boolean: ["yes", "no"],
  multi_select: ["contains_any", "contains_all", "contains_none", "empty", "not_empty"],
};

export function createEmptyCondition(field?: AudienceFieldDefinition): AudienceCondition {
  const fieldType = field?.type || "text";
  return {
    kind: "condition",
    field: field?.field || "",
    fieldType,
    operator: OPERATORS_BY_TYPE[fieldType][0],
    value: fieldType === "multi_select" ? [] : "",
    secondaryValue: "",
  };
}

export function isValueHidden(condition: AudienceCondition) {
  return ["empty", "not_empty", "today", "yesterday", "last_7_days", "last_30_days", "last_90_days", "yes", "no"].includes(String(condition.operator || ""));
}
