import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Mail, Globe, Info, Edit2, Edit, LocationEdit } from "lucide-react";

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
  const websites = Array.isArray(businessProfile?.websites) ? businessProfile.websites : [];
  const avatarUrl = businessProfile?.profile_picture_url || "";

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-[5px] bg-white shadow-2xl border border-slate-100 relative"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
          >
            {/* Header matching Edit modal spacing */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-lg font-black tracking-tight text-slate-900">Business Profile</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-[5px] transition-colors text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* WhatsApp Profile Layout */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="h-32 w-32 overflow-hidden rounded-full bg-slate-100 border border-slate-100">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-black text-brand-600">
                        {phone?.verified_name?.[0] || "W"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-center gap-1.5">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      {phone?.verified_name || "WhatsApp Business"}
                    </h2>
                  </div>
                  <p className="mt-1 text-base font-bold text-slate-500">
                    {phone?.display_phone_number || "—"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                    {businessProfile?.vertical || "Business Account"}
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="mt-10 space-y-2">
                {/* About/Notes */}
                <div className="group flex items-start gap-4 p-4 hover:bg-slate-50 rounded-[5px] transition-all">
                   <div className="mt-1 text-slate-400">
                      <Edit2 size={18} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">About</p>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                        {businessProfile?.about || "No business details added."}
                      </p>
                   </div>
                </div>

                <div className="h-px bg-slate-50 mx-4" />

                {/* Description */}
                <div className="group flex items-start gap-4 p-4 hover:bg-slate-50 rounded-[5px] transition-all">
                   <div className="mt-1 text-slate-400">
                      <Edit size={18} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                        {businessProfile?.description || "No description added."}
                      </p>
                   </div>
                </div>

                <div className="h-px bg-slate-50 mx-4" />

                {/* Business Info Banner */}
                 <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[5px] border border-slate-100">
                   <Info size={18} className="text-slate-400" />
                   <p className="text-xs font-bold text-slate-600">This is a business account.</p>
                </div>

                <div className="h-px bg-slate-50 mx-4" />

                {/* Contact Details */}
                <div className="space-y-1">
                   {businessProfile?.email && (
                      <div className="flex items-center gap-4 p-4 hover:bg-emerald-50 rounded-[5px] transition-all group">
                        <Mail size={18} className="text-slate-400 group-hover:text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-600">{businessProfile.email}</span>
                      </div>
                   )}

                   {businessProfile?.address && (
                      <div className="flex items-center gap-4 p-4 hover:bg-emerald-50 rounded-[5px] transition-all group">
                        <LocationEdit size={18} className="text-slate-400 group-hover:text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-600">{businessProfile.address}</span>
                      </div>
                   )}
                   
                   {websites.map((w: string) => (
                     <a
                       key={w}
                       href={w}
                       target="_blank"
                       rel="noreferrer"
                        className="flex items-center gap-4 p-4 hover:bg-emerald-50 rounded-[5px] transition-all group"
                     >
                        <Globe size={18} className="text-slate-400 group-hover:text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-600 truncate">{w}</span>
                     </a>
                   ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
