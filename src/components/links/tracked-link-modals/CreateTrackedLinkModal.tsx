import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { X } from "lucide-react";
import { API } from "@api/api";
import { useToast } from "@shared/providers/ToastContext";
import type { TrackedLink } from "./shared";

export function CreateTrackedLinkModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (link: TrackedLink) => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setMessage("");
    setBusy(false);
  }, [open]);

  const messageError = useMemo(() => {
    if (!message.trim()) return "Message is required.";
    if (message.trim().length > 1000) return "Message is too long (max 1000 chars).";
    return null;
  }, [message]);

  async function create() {
    if (messageError) return toast(messageError, "warning");
    setBusy(true);
    try {
      const res = await API.links.tracked.create({ title: title.trim(), message: message.trim() });
      toast("Tracked link created", "success");
      onCreated({ ...res.link, trackedUrl: res.trackedUrl });
      onClose();
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Failed to create link", "error");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[999] overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div className="w-full max-w-xl overflow-hidden rounded-[5px] bg-white shadow-2xl border border-slate-100 relative" initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div><h3 className="text-lg font-black tracking-tight text-slate-900">Create Tracked Link</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">WhatsApp redirect + QR + analytics</p></div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-[5px] transition-colors text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div className="grid gap-5">
                <Input label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Webinar Registration" />
                <Textarea label="Prefilled Message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Example: Hi! I want to register for the webinar." className="min-h-[140px]" />
                {messageError ? <div className="text-xs font-bold text-rose-600">{messageError}</div> : <div className="text-[11px] font-semibold text-slate-500">Tip: Keep it short. You can edit later anytime.</div>}
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
              <Button onClick={create} disabled={busy || !!messageError} className="min-w-[140px]">{busy ? "Creating..." : "Create Link"}</Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
