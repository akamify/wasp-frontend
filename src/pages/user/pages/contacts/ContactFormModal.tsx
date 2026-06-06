import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CircleX, X } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Button } from "@components/ui/Button";
import type { AttributeDefinition } from "../Attributes";

export type ContactForm = {
  name: string;
  phone: string;
  email: string;
  company: string;
  tags: string;
  attributes: Record<string, string | number | boolean | null>;
  legacyAttributes: Record<string, string | number | boolean>;
  notes: string;
};

type Props = {
  open: boolean;
  selectedId: string | null;
  form: ContactForm;
  saving: boolean;
  definitions: AttributeDefinition[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (updater: (current: ContactForm) => ContactForm) => void;
};

export function ContactFormModal({ open, selectedId, form, saving, definitions, onClose, onSubmit, onChange }: Props) {
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md overflow-hidden rounded-[5px] border border-slate-100 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-black tracking-tight text-slate-900">{selectedId ? "Edit Contact" : "Add New Contact"}</h2>
              <button type="button" onClick={onClose} className="rounded-[5px] p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900">
                <X size={20} />
              </button>
            </div>

            <form className="custom-scrollbar max-h-[75vh] space-y-4 overflow-y-auto p-6" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full Name" value={form.name} onChange={(e) => onChange((c) => ({ ...c, name: e.target.value }))} placeholder="John Doe" />
                <Input label="Phone Number" value={form.phone} onChange={(e) => onChange((c) => ({ ...c, phone: e.target.value }))} placeholder="919999999999" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Email Address" value={form.email} onChange={(e) => onChange((c) => ({ ...c, email: e.target.value }))} placeholder="john@example.com" />
                <Input label="Company" value={form.company} onChange={(e) => onChange((c) => ({ ...c, company: e.target.value }))} placeholder="Acme Corp" />
              </div>
              <Input label="Tags" value={form.tags} onChange={(e) => onChange((c) => ({ ...c, tags: e.target.value }))} placeholder="vip, new-lead, search-campaign" hint="Comma separated tags" />
              {definitions.length ? <div className="space-y-4 rounded-[10px] border border-slate-100 p-4">
                <div><div className="text-xs font-black uppercase tracking-widest text-slate-500">Attributes</div><div className="mt-1 text-xs font-medium leading-5 text-slate-400">Assign values to existing attributes. Create new attributes from the Attributes page.</div></div>
                {definitions.map((definition) => <AttributeInput key={definition.key} definition={definition} value={form.attributes[definition.key]} onChange={(value) => onChange((current) => ({ ...current, attributes: { ...current.attributes, [definition.key]: value } }))} />)}
              </div> : <div className="rounded-[10px] border border-dashed border-slate-200 p-5 text-center text-sm font-semibold text-slate-500">No attributes created yet. Create attributes from the Attributes page.</div>}
              {Object.keys(form.legacyAttributes).length ? <details className="rounded-[5px] border border-amber-200 bg-amber-50 p-4">
                <summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-amber-800">Legacy attributes ({Object.keys(form.legacyAttributes).length})</summary>
                <div className="mt-3 space-y-2">{Object.entries(form.legacyAttributes).map(([key, value]) => <div key={key} className="flex justify-between gap-3 text-xs"><span className="font-black">{key}</span><span>{String(value)}</span></div>)}</div>
              </details> : null}
              <Textarea
                label="Private Notes"
                value={form.notes}
                onChange={(e) => onChange((c) => ({ ...c, notes: e.target.value }))}
                placeholder="Add context about this customer..."
                className="min-h-[100px]"
              />

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={saving} className="px-8">{saving ? "Saving..." : selectedId ? "Update Contact" : "Create Contact"}</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function AttributeInput({ definition, value, onChange }: { definition: AttributeDefinition; value: string | number | boolean | null | undefined; onChange: (value: string | number | boolean | null) => void }) {
  const hasValue = value !== null && value !== undefined && String(value) !== "";
  const helper = definition.defaultValue !== undefined && String(definition.defaultValue) !== "" ? `Default: ${String(definition.defaultValue)}` : "Optional";
  if (definition.type === "boolean") {
    return <div><AttributeLabel definition={definition} helper={helper} onClear={hasValue ? () => onChange(null) : undefined} /><select className="mt-2 w-full rounded-[5px] border border-slate-200 px-3 py-2.5 text-sm font-semibold" value={value === true ? "true" : value === false ? "false" : ""} disabled={!definition.editable} onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "true")}><option value="">Not set</option><option value="true">Yes</option><option value="false">No</option></select></div>;
  }
  return <div><AttributeLabel definition={definition} helper={helper} onClear={hasValue ? () => onChange(null) : undefined} /><input className="mt-2 w-full rounded-[5px] border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50" type={definition.type === "text" ? "text" : definition.type} value={String(value ?? "")} disabled={!definition.editable} onChange={(event) => onChange(event.target.value || null)} /></div>;
}

function AttributeLabel({ definition, helper, onClear }: { definition: AttributeDefinition; helper: string; onClear?: () => void }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="text-xs font-black text-slate-700">{definition.label}</div>
        <div className="mt-0.5 font-mono text-[11px] font-bold text-brand-600">${definition.key} <span className="font-sans font-medium text-slate-400">· {helper}</span></div>
      </div>
      {onClear ? <button type="button" onClick={onClear} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-600"><CircleX size={13} /> Clear</button> : null}
    </div>
  );
}

