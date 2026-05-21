import { useEffect, useMemo, useState } from "react";
import type { FlowField, FlowScreen, FlowTemplate } from "@modules/flow-builder/templateEngine";
import { EllipsisVertical, X } from "lucide-react";

type FormValue = string | string[] | boolean;
type FormState = Record<string, FormValue>;

function isFieldComplete(field: FlowField, value: FormValue | undefined) {
  if (!field.required) return true;
  if (field.type === "checkbox") return Array.isArray(value) ? value.length > 0 : !!value;
  if (field.type === "radio" || field.type === "select") return typeof value === "string" && value.trim().length > 0;
  if (field.type === "text" || field.type === "email" || field.type === "password" || field.type === "textarea") {
    return typeof value === "string" && value.trim().length > 0;
  }
  return true;
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FlowField;
  value: FormValue | undefined;
  onChange: (next: FormValue) => void;
}) {
  if (field.type === "text" || field.type === "email" || field.type === "password") {
    return (
      <input
        type={field.type}
        placeholder={field.placeholder || field.label}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-400/50 bg-transparent px-4 py-3 text-[12px] text-slate-600"
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <div className="text-[12px] font-semibold text-slate-900">{field.label}</div>
        <textarea
          placeholder={field.placeholder || "Type..."}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-28 w-full resize-none rounded-xl border border-slate-400/50 bg-transparent px-4 py-3 text-[12px] text-slate-600"
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-400/50 bg-transparent px-4 py-3 text-[12px] text-slate-700"
      >
        <option value="">{field.label}</option>
        {(field.options || []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "radio") {
    return (
      <div className="space-y-3">
        <div className="text-[12px] font-semibold text-slate-900">{field.label}</div>
        {(field.options || []).map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center justify-between text-[12px] text-slate-800">
            <span>{opt.label}</span>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${value === opt.value ? "border-blue-600" : "border-slate-500/80"}`}>
              {value === opt.value ? <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> : null}
            </span>
            <input className="sr-only" type="radio" checked={value === opt.value} onChange={() => onChange(opt.value)} />
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "checkbox") {
    const selected = Array.isArray(value) ? value : [];
    const items = field.options && field.options.length > 0 ? field.options : [{ label: field.label, value: field.id }];
    return (
      <div className="space-y-3">
        <div className="text-[12px] font-semibold text-slate-900">{field.label}</div>
        {items.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center justify-between text-[12px] text-slate-800">
            <span>{opt.label}</span>
            <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${selected.includes(opt.value) ? "border-blue-600" : "border-slate-500/80"}`}>
              {selected.includes(opt.value) ? <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> : null}
            </span>
            <input
              className="sr-only"
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => onChange(selected.includes(opt.value) ? selected.filter((x) => x !== opt.value) : [...selected, opt.value])}
            />
          </label>
        ))}
      </div>
    );
  }

  return null;
}

export function TemplateFlowPreview({
  template,
  screen,
  screenIndex,
  onContinue,
}: {
  template: FlowTemplate;
  screen: FlowScreen;
  screenIndex: number;
  onContinue: (payload: FormState) => void;
}) {
  const [formState, setFormState] = useState<FormState>({});

  useEffect(() => {
    setFormState({});
  }, [template.id, screen.id]);

  const canContinue = useMemo(
    () => screen.fields.every((field) => isFieldComplete(field, formState[field.id])),
    [formState, screen.fields]
  );

  return (
    <div className="h-full rounded-[8px] border border-slate-300 bg-slate-100 p-3 shadow-xl">
      <div className="flex h-full flex-col rounded-[20px] bg-[#f7f7f7]">
        <div className="flex items-center justify-between border-b border-slate-300 px-5 py-4 text-slate-900">
          <span className="text-xl leading-none"><X /></span>
          <span className="text-[14px] font-bold">{screen.title}</span>
          <span className="text-xl leading-none"><EllipsisVertical /></span>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {screen.subtitle ? <h3 className="text-[15px] font-black leading-tight text-slate-900">{screen.subtitle}</h3> : null}
          {screen.fields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={formState[field.id]}
              onChange={(next) => setFormState((prev) => ({ ...prev, [field.id]: next }))}
            />
          ))}
        </div>
        <div className="space-y-3 border-t border-slate-300 p-4">
          <button
            type="button"
            onClick={() => onContinue(formState)}
            className="w-full rounded-full bg-emerald-500 py-3 text-[16px] font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!canContinue}
          >
            {screen.footerButton.text}
          </button>
          <div className="text-center text-[12px] text-slate-500">
            Screen {screenIndex + 1} of {template.screens.length}
          </div>
        </div>
      </div>
    </div>
  );
}
