import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  busy: boolean;
  definitions: any[];
  form: any;
  open: boolean;
  onClose: () => void;
  onFormChange: (updater: (previous: any) => any) => void;
  onSave: () => void;
};

export function EditContactModal({ busy, definitions, form, open, onClose, onFormChange, onSave }: Props) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mx-auto my-auto w-full max-w-xl overflow-hidden rounded-[5px] bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="text-sm font-black text-slate-900">Edit contact</div>
          <button className="rounded-[5px] p-2 text-slate-500 hover:bg-slate-50" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <EditInput label="Name" value={form.name} onChange={(value) => onFormChange((previous) => ({ ...previous, name: value }))} />
            <EditInput label="Email" value={form.email} onChange={(value) => onFormChange((previous) => ({ ...previous, email: value }))} />
          </div>
          <EditInput label="Language" value={form.language} placeholder="e.g. en, hi" onChange={(value) => onFormChange((previous) => ({ ...previous, language: value }))} />
          <EditInput label="Tags (comma separated)" value={form.tags} placeholder="vip, lead, returning" onChange={(value) => onFormChange((previous) => ({ ...previous, tags: value }))} />
          <div className="space-y-3 rounded-[5px] border border-slate-100 p-4">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Attributes</div>
            {definitions.map((definition) => <ManagedAttributeInput key={definition.key} definition={definition} value={form.attributes?.[definition.key]} onChange={(value) => onFormChange((previous) => ({ ...previous, attributes: { ...(previous.attributes || {}), [definition.key]: value } }))} />)}
            {!definitions.length ? <div className="text-sm font-semibold text-slate-500">No active attributes are available.</div> : null}
          </div>
          {Object.keys(form.legacyAttributes || {}).length ? <details className="rounded-[5px] border border-amber-200 bg-amber-50 p-4"><summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-amber-800">Legacy attributes</summary><div className="mt-3 space-y-2">{Object.entries(form.legacyAttributes).map(([key, value]) => <div key={key} className="flex justify-between gap-3 text-xs"><span className="font-black">{key}</span><span>{String(value)}</span></div>)}</div></details> : null}
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Notes</div>
            <textarea className="mt-2 w-full min-h-[110px] rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold" value={form.notes} onChange={(e) => onFormChange((previous) => ({ ...previous, notes: e.target.value }))} />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button className="rounded-[5px] border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50" onClick={onClose}>Cancel</button>
            <button disabled={busy} className="rounded-[5px] bg-brand-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" onClick={onSave}>
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ManagedAttributeInput({ definition, value, onChange }: { definition: any; value: unknown; onChange: (value: unknown) => void }) {
  if (definition.type === "boolean") {
    return <label className="block text-xs font-black uppercase tracking-widest text-slate-400">{definition.label}{definition.required ? " *" : ""}<select className="mt-2 w-full rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold" value={value === true ? "true" : value === false ? "false" : ""} disabled={!definition.editable} onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "true")}><option value="">Not set</option><option value="true">Yes</option><option value="false">No</option></select></label>;
  }
  return <EditInput label={`${definition.label}${definition.required ? " *" : ""}`} value={String(value ?? "")} type={definition.type === "text" ? "text" : definition.type} disabled={!definition.editable} placeholder={definition.defaultValue !== undefined ? `Default: ${String(definition.defaultValue)}` : undefined} onChange={(next) => onChange(next || null)} />;
}

function EditInput({ label, onChange, placeholder, value, disabled, type = "text" }: { label: string; onChange: (value: string) => void; placeholder?: string; value: string; disabled?: boolean; type?: string }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</div>
      <input type={type} disabled={disabled} className="mt-2 w-full rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold disabled:bg-slate-50" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
