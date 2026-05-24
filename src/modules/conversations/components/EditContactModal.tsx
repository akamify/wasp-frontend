import { X } from "lucide-react";

type Props = {
  busy: boolean;
  form: any;
  open: boolean;
  onClose: () => void;
  onFormChange: (updater: (previous: any) => any) => void;
  onSave: () => void;
};

export function EditContactModal({ busy, form, open, onClose, onFormChange, onSave }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mx-auto my-12 w-full max-w-xl overflow-hidden rounded-[5px] bg-white shadow-2xl ring-1 ring-black/10">
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
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Attributes</div>
            <textarea
              className="mt-2 w-full min-h-[90px] rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold"
              value={form.attributes || ""}
              placeholder={"city: Delhi\nplan: premium\nsource: website"}
              onChange={(e) => onFormChange((previous) => ({ ...previous, attributes: e.target.value }))}
            />
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Use key:value per line</div>
          </div>
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
    </div>
  );
}

function EditInput({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder?: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</div>
      <input className="mt-2 w-full rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
