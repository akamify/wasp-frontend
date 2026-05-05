import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/Button";

function safeArray(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v || "").trim()).filter(Boolean);
}

function labelValue(label: string, value?: string | null) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-xs font-semibold text-ink-900/50">{label}</div>
      <div className="text-sm font-semibold text-ink-900">{value}</div>
    </div>
  );
}

export function WhatsAppManagerProfileViewModal({
  open,
  onClose,
  phone,
  businessProfile,
}: {
  open: boolean;
  onClose: () => void;
  phone: any;
  businessProfile: any;
}) {
  const websites = safeArray(businessProfile?.websites);
  const avatarUrl = businessProfile?.profile_picture_url || "";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="mx-auto my-6 w-full max-w-md overflow-hidden rounded-[5px] bg-white shadow-none ring-1 ring-ink-900/10"
            initial={{ y: 14, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
          >
            {/* WhatsApp-ish header */}
            <div className="flex items-center justify-between bg-emerald-700 px-4 py-3 text-white">
              <div className="text-sm font-bold">Business profile</div>
              <button
                onClick={onClose}
                className="rounded-[5px] p-2 hover:bg-white/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile hero */}
            <div className="px-5 pb-5 pt-5">
              <div className="flex flex-col items-center text-center">
                <div className="h-24 w-24 overflow-hidden rounded-full bg-ink-900/5 ring-1 ring-ink-900/10">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-ink-900/30">
                      {phone?.verified_name?.[0] || "W"}
                    </div>
                  )}
                </div>

                <div className="mt-4 text-xl font-black tracking-tight text-ink-900">
                  {phone?.verified_name || "WhatsApp Business"}
                </div>
                <div className="mt-1 text-sm font-semibold text-ink-900/60">
                  {phone?.display_phone_number || "—"}
                </div>
              </div>

              {/* WhatsApp-like sections */}
              <div className="mt-6 space-y-5">
                {businessProfile?.about ? (
                  <div className="rounded-[5px] bg-ink-900/5 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-ink-900/40">
                      About
                    </div>
                    <div className="mt-2 text-sm font-semibold text-ink-900">{businessProfile.about}</div>
                  </div>
                ) : null}

                <div className="rounded-[5px] bg-white p-4 ring-1 ring-ink-900/10">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-900/40">
                    <ShieldCheck size={14} className="text-ink-900/35" />
                    Details
                  </div>
                  <div className="mt-4 space-y-3">
                    {labelValue("Description", businessProfile?.description)}
                    {labelValue("Email", businessProfile?.email)}
                    {labelValue("Address", businessProfile?.address)}
                  </div>
                </div>

                {websites.length ? (
                  <div className="rounded-[5px] bg-white p-4 ring-1 ring-ink-900/10">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-ink-900/40">
                      Websites
                    </div>
                    <div className="mt-3 space-y-2">
                      {websites.map((w) => (
                        <a
                          key={w}
                          href={w}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-[5px] bg-ink-900/5 px-3 py-2 text-sm font-bold text-ink-900 hover:bg-ink-900/10"
                        >
                          <span className="truncate">{w}</span>
                          <ExternalLink size={16} />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-6">
                <Button className="w-full" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
