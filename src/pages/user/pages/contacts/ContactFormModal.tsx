import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Button } from "@components/ui/Button";

export type ContactForm = {
  name: string;
  phone: string;
  email: string;
  company: string;
  tags: string;
  attributes: string;
  notes: string;
};

type Props = {
  open: boolean;
  selectedId: string | null;
  form: ContactForm;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (updater: (current: ContactForm) => ContactForm) => void;
};

export function ContactFormModal({ open, selectedId, form, saving, onClose, onSubmit, onChange }: Props) {
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
              <Textarea
                label="Attributes"
                value={form.attributes}
                onChange={(e) => onChange((c) => ({ ...c, attributes: e.target.value }))}
                placeholder={"city: Delhi\nplan: premium\nsource: website"}
                hint="One per line in key:value format"
                className="min-h-[90px]"
              />
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

