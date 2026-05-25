import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Button } from "@components/ui/Button";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";

type Props = {
  open: boolean;
  onClose: () => void;
  planName: string;
};

export function SalesContactModal({ open, onClose, planName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    businessName: "",
    businessAddress: "",
    website: "",
    additionalInfo: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast("Your inquiry has been sent! Our sales team will contact you within 24 hours.", "success");
      onClose();
      setForm({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        businessName: "",
        businessAddress: "",
        website: "",
        additionalInfo: "",
      });
    } catch {
      toast("Failed to send inquiry. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-[5px] border border-slate-100 bg-white shadow-2xl"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">Sales Inquiry</div>
                <h2 className="mt-1 text-lg font-black text-slate-900">{planName} Plan Details</h2>
              </div>
              <button onClick={onClose} className="rounded-[5px] p-2 text-slate-400 transition-colors hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form className="space-y-4 p-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Full Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                <Input label="Email Address *" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Phone Number *" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} required />
                <Input label="Business Name *" value={form.businessName} onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))} required />
              </div>
              <Input
                label="Business Address *"
                value={form.businessAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, businessAddress: e.target.value }))}
                placeholder="Street, City, State, Zip"
                required
              />
              <Input label="Website" value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} placeholder="https://example.com" />
              <Textarea
                label="Additional Information"
                value={form.additionalInfo}
                onChange={(e) => setForm((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="Tell us about your business needs..."
                className="min-h-[100px]"
              />

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy ? "Sending..." : "Submit Inquiry"}</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
