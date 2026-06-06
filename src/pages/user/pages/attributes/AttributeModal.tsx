import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Braces, X } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";

type AttributeForm = {
  label: string;
  key: string;
  defaultValue: string;
};

type Props = {
  editing: boolean;
  form: AttributeForm;
  open: boolean;
  saving: boolean;
  onChange: (form: AttributeForm) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const KEY_PATTERN = /^[a-z][a-z0-9_]{0,49}$/;

export function AttributeModal({ editing, form, open, saving, onChange, onClose, onSubmit }: Props) {
  const [keyTouched, setKeyTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKeyTouched(editing);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editing, open, onClose, saving]);

  if (!open) return null;

  const labelError = form.label.trim() ? "" : "Attribute name is required.";
  const keyError = KEY_PATTERN.test(form.key) ? "" : "Use lowercase letters, numbers, and underscores. Start with a letter.";
  const invalid = Boolean(labelError || keyError);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="my-auto flex max-h-[90vh] w-[calc(100%-8px)] max-w-xl flex-col overflow-hidden rounded-[22px] border border-white/60 bg-white shadow-2xl shadow-slate-950/25">
        <div className="relative border-b border-slate-100 bg-gradient-to-b from-brand-50/80 to-white px-6 pb-6 pt-7 text-center sm:px-8">
          <button type="button" onClick={onClose} disabled={saving} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-slate-900 disabled:opacity-50" aria-label="Close">
            <X size={20} />
          </button>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/25">
            <Braces size={27} />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{editing ? "Edit Attribute" : "Create Attribute"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
            Create a reusable contact field for segmentation and message personalization.
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="space-y-5">
            <div>
              <Input
                label="Attribute Name"
                value={form.label}
                placeholder="City"
                autoFocus
                onChange={(event) => {
                  const label = event.target.value;
                  onChange({
                    ...form,
                    label,
                    key: editing || keyTouched ? form.key : suggestKey(label),
                  });
                }}
              />
              {labelError ? <p className="ml-1 mt-1.5 text-xs font-semibold text-rose-600">{labelError}</p> : null}
            </div>
            <div>
              <Input
                label="Attribute Key"
                value={form.key}
                disabled={editing}
                placeholder="city"
                onChange={(event) => {
                  setKeyTouched(true);
                  onChange({ ...form, key: event.target.value.toLowerCase() });
                }}
              />
              <div className="ml-1 mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500">{editing ? "The key is locked after creation." : "Lowercase snake_case, up to 50 characters."}</span>
                <span className="font-mono text-xs font-bold text-brand-700">${form.key || "attribute_key"}</span>
              </div>
              {keyError ? <p className="ml-1 mt-1.5 text-xs font-semibold text-rose-600">{keyError}</p> : null}
            </div>
            <Input
              label="Optional Default Value"
              value={form.defaultValue}
              placeholder="No default value"
              hint="Leave empty when no default should be applied."
              onChange={(event) => onChange({ ...form, defaultValue: event.target.value })}
            />

            <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Preview</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <PreviewValue label="Name" value={form.label.trim() || "Attribute name"} />
                <PreviewValue label="Attribute variable" value={`$${form.key || "attribute_key"}`} mono />
                <PreviewValue label="Default" value={form.defaultValue.trim() || "Not set"} />
              </div>
            </div>

            <p className="rounded-[10px] bg-brand-50 px-4 py-3 text-xs font-semibold leading-5 text-brand-800">
              Example: City creates <span className="font-mono">$city</span>, which can be used in contact profiles and campaign personalization.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-8">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={onSubmit} disabled={invalid || saving} className="min-w-36">
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Attribute"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PreviewValue({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 truncate text-sm font-bold text-slate-900 ${mono ? "font-mono text-brand-700" : ""}`}>{value}</div>
    </div>
  );
}

function suggestKey(label: string) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50);
}
