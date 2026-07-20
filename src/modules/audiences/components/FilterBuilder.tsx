import { Fragment, useMemo } from "react";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@shared/ui/Input";
import { Select } from "@shared/ui/Select";
import { X, Plus, GitBranch, Filter } from "lucide-react";
import { createEmptyCondition, DEFAULT_AUDIENCE_GROUP, isValueHidden, OPERATOR_LABELS, OPERATORS_BY_TYPE } from "@modules/audiences/constants";
import type { AudienceCondition, AudienceFieldDefinition, AudienceFieldType, AudienceGroup } from "@modules/audiences/types";

type FilterBuilderProps = {
  value: AudienceGroup;
  fieldCatalog: AudienceFieldDefinition[];
  matchCount?: number;
  loading?: boolean;
  onChange: (value: AudienceGroup) => void;
};

function groupFieldsByCategory(fields: AudienceFieldDefinition[]) {
  return fields.reduce<Record<string, AudienceFieldDefinition[]>>((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {});
}

function coerceFieldValue(fieldType: AudienceFieldType, value: string) {
  if (fieldType === "number") return value;
  if (fieldType === "multi_select") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return value;
}

function getFieldLabel(fieldCatalog: AudienceFieldDefinition[], field: string) {
  return fieldCatalog.find((item) => item.field === field)?.label || field || "Select field";
}

function getFieldType(fieldCatalog: AudienceFieldDefinition[], field: string, fallback?: AudienceFieldType | null) {
  return fieldCatalog.find((item) => item.field === field)?.type || fallback || "text";
}

function ConditionEditor({
  condition,
  fieldCatalog,
  onChange,
  onRemove,
}: {
  condition: AudienceCondition;
  fieldCatalog: AudienceFieldDefinition[];
  onChange: (next: AudienceCondition) => void;
  onRemove: () => void;
}) {
  const groupedFields = useMemo(() => groupFieldsByCategory(fieldCatalog), [fieldCatalog]);
  const fieldType = getFieldType(fieldCatalog, condition.field, condition.fieldType);
  const operators = OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.text;
  const hideValue = isValueHidden(condition);
  return (
    <div className="grid gap-3 rounded-[5px] border border-ink-900/10 bg-white p-3 md:grid-cols-[minmax(0,1.5fr)_180px_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <Select
        label="Field"
        value={condition.field}
        onChange={(event) => {
          const nextField = fieldCatalog.find((item) => item.field === event.target.value);
          onChange(createEmptyCondition(nextField));
        }}
      >
        <option value="">Select field</option>
        {Object.entries(groupedFields).map(([category, items]) => (
          <optgroup key={category} label={category}>
            {items.map((item) => (
              <option key={item.field} value={item.field}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>

      <Select
        label="Operator"
        value={condition.operator}
        onChange={(event) => onChange({ ...condition, operator: event.target.value })}
      >
        {operators.map((operator) => (
          <option key={operator} value={operator}>
            {OPERATOR_LABELS[operator] || operator}
          </option>
        ))}
      </Select>

      <Input
        label="Value"
        value={Array.isArray(condition.value) ? condition.value.join(", ") : String(condition.value ?? "")}
        onChange={(event) => onChange({ ...condition, value: coerceFieldValue(fieldType, event.target.value) })}
        placeholder={fieldType === "multi_select" ? "Comma separated values" : "Enter value"}
        disabled={hideValue}
      />

      <Input
        label="Second value"
        value={String(condition.secondaryValue ?? "")}
        onChange={(event) => onChange({ ...condition, secondaryValue: event.target.value })}
        placeholder="Only used for between"
        disabled={condition.operator !== "between"}
      />

      <div className="flex items-end">
        <Button type="button" variant="ghost" className="h-11 w-11 p-0 text-rose-600" onClick={onRemove}>
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}

function GroupEditor({
  group,
  fieldCatalog,
  depth = 0,
  onChange,
  onRemove,
}: {
  group: AudienceGroup;
  fieldCatalog: AudienceFieldDefinition[];
  depth?: number;
  onChange: (value: AudienceGroup) => void;
  onRemove?: () => void;
}) {
  return (
    <div className={`space-y-3 rounded-[5px] border border-ink-900/10 bg-slate-50 p-4 ${depth > 0 ? "ml-4" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-2 text-ink-900 ring-1 ring-ink-900/10">
            <GitBranch size={14} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-ink-800/45">Filter Group</div>
            <div className="mt-1 text-sm font-black text-ink-900">
              {group.conditions.length} conditions with {group.operator.toUpperCase()} logic
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={group.operator} onChange={(event) => onChange({ ...group, operator: event.target.value as "and" | "or" })} className="min-w-[120px]">
            <option value="and">AND</option>
            <option value="or">OR</option>
          </Select>
          {onRemove ? (
            <Button type="button" variant="ghost" className="text-rose-600" onClick={onRemove}>
              Remove Group
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {group.conditions.map((item, index) => (
          <Fragment key={`${item.kind}-${index}`}>
            {item.kind === "condition" ? (
              <ConditionEditor
                condition={item}
                fieldCatalog={fieldCatalog}
                onChange={(nextCondition) =>
                  onChange({
                    ...group,
                    conditions: group.conditions.map((entry, entryIndex) => (entryIndex === index ? nextCondition : entry)),
                  })
                }
                onRemove={() =>
                  onChange({
                    ...group,
                    conditions: group.conditions.filter((_, entryIndex) => entryIndex !== index),
                  })
                }
              />
            ) : (
              <GroupEditor
                group={item}
                depth={depth + 1}
                fieldCatalog={fieldCatalog}
                onChange={(nextGroup) =>
                  onChange({
                    ...group,
                    conditions: group.conditions.map((entry, entryIndex) => (entryIndex === index ? nextGroup : entry)),
                  })
                }
                onRemove={() =>
                  onChange({
                    ...group,
                    conditions: group.conditions.filter((_, entryIndex) => entryIndex !== index),
                  })
                }
              />
            )}
          </Fragment>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          className="gap-2 border border-ink-900/10 bg-white"
          onClick={() => onChange({ ...group, conditions: [...group.conditions, createEmptyCondition(fieldCatalog[0])] })}
        >
          <Plus size={14} /> Add Filter
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="gap-2 border border-ink-900/10 bg-white"
          onClick={() =>
            onChange({
              ...group,
              conditions: [...group.conditions, { ...DEFAULT_AUDIENCE_GROUP }],
            })
          }
        >
          <GitBranch size={14} /> Add Group
        </Button>
      </div>
    </div>
  );
}

export function FilterBuilder({ value, fieldCatalog, matchCount = 0, loading = false, onChange }: FilterBuilderProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-ink-800/45">Filter Builder</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight text-ink-900">
            <Filter size={22} /> Advanced audience logic
          </div>
          <div className="mt-2 text-sm text-ink-800/65">
            Build nested rules with AND / OR logic across contact data, campaign activity, CRM, ecommerce, and automation signals.
          </div>
        </div>
        <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 px-4 py-3">
          <div className="text-xs font-black uppercase tracking-widest text-ink-800/45">Matching Contacts</div>
          <div className="mt-1 text-xl font-black text-ink-900">{loading ? "Updating..." : matchCount.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-5">
        <GroupEditor group={value} fieldCatalog={fieldCatalog} onChange={onChange} />
      </div>
    </Card>
  );
}
