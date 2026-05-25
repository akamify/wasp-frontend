import { useEffect, useMemo, useState } from "react";
import { X, Upload, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Select } from "@components/ui/Select";
import { useToast } from "@shared/providers/ToastContext";
import { cn } from "@shared/utils/cn";

const VERTICAL_OPTIONS = [
  "AUTO", "BEAUTY", "CLOTHING", "EDU", "ENTERTAIN", "EVENT_PLAN",
  "FINANCE", "GROCERY", "HEALTH", "HOTEL", "NONPROFIT",
  "PROF_SERVICES", "RETAIL", "TRAVEL", "OTHER"
];

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
}

export function WhatsAppManagerProfileModal({
  open,
  onClose,
  businessProfile,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  businessProfile: any;
  onSaved?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const [about, setAbout] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [vertical, setVertical] = useState("");
  const [websites, setWebsites] = useState<string[]>([""]);

  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [profilePictureHandle, setProfilePictureHandle] = useState<string>("");
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAbout(businessProfile?.about || "");
    setDescription(businessProfile?.description || "");
    setAddress(businessProfile?.address || "");
    setEmail(businessProfile?.email || "");
    setVertical(businessProfile?.vertical || "OTHER");
    const ws = Array.isArray(businessProfile?.websites) ? businessProfile.websites : [];
    setWebsites(ws.length ? ws : [""]);
    setProfilePictureUrl(businessProfile?.profile_picture_url || "");
    setProfilePictureHandle("");
  }, [open, businessProfile]);

  const normalizedWebsites = useMemo(
    () => websites.map((w) => String(w || "").trim()).filter(Boolean),
    [websites]
  );

  const websitesError = useMemo(() => {
    for (const w of normalizedWebsites) {
      if (!isValidHttpUrl(w)) return "Websites must be valid http/https URLs.";
    }
    if (normalizedWebsites.length > 2) return "You can add up to 2 websites.";
    return null;
  }, [normalizedWebsites]);

  async function onPickImage(file: File) {
    setUploadBusy(true);
    try {
      const res = await API.meta.uploadProfilePicture(file);
      setProfilePictureHandle(res.handle);
      toast("Profile picture uploaded. Click Save to apply it.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Upload failed", "error");
    } finally {
      setUploadBusy(false);
    }
  }

  async function save() {
    if (websitesError) {
      toast(websitesError, "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await API.meta.updateProfile({
        about, description, address, email,
        websites: normalizedWebsites,
        vertical,
        profilePictureHandle: profilePictureHandle || undefined,
      });
      toast(String(res?.message || "Profile updated successfully!"), "success");
      onClose();
      onSaved?.();
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Save failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
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
            className="mx-auto my-20 w-full max-w-2xl bg-white rounded-[5px] shadow-2xl border border-slate-100 overflow-hidden"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">Edit Profile</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage Business Details</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-[5px] transition-colors text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* Profile Image Section */}
              <div className="bg-slate-50 rounded-[5px] p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-bold text-slate-900">Profile Image</h4>
                  <label className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-[5px] text-xs font-black transition-all cursor-pointer",
                    uploadBusy ? "bg-slate-200 text-slate-400" : "bg-white text-brand-600 shadow-sm border border-brand-100 hover:shadow-md"
                  )}>
                    <Upload size={14} />
                    {uploadBusy ? "Uploading..." : "Upload New"}
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPickImage(f);
                      }}
                      disabled={uploadBusy}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-[5px] overflow-hidden bg-white ring-4 ring-white shadow-lg shadow-slate-200 shrink-0">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-300">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                      {profilePictureHandle ? (
                         <span className="flex items-center gap-2 text-emerald-600 font-bold">
                            <CheckCircle2 size={14} /> Ready to save
                         </span>
                      ) : "Recommended: Square image (512x512px)."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                <Textarea label="About" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="A short catchphrase..." className="min-h-[100px]" />
                <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers about your business..." className="min-h-[100px]" />
                
                <div className="sm:col-span-2 grid gap-6 sm:grid-cols-2">
                  <Input label="Business Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@company.com" />
                  <Select label="Business Category" value={vertical} onChange={(e) => setVertical(e.target.value)}>
                    {VERTICAL_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </Select>
                </div>

                <div className="sm:col-span-2">
                   <Input label="Business Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Business Way, City, Country" />
                </div>

                <div className="sm:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Websites</h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max 2</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[0, 1].map((idx) => (
                      <Input
                        key={idx}
                        value={websites[idx] || ""}
                        onChange={(e) => {
                          const next = [...websites];
                          next[idx] = e.target.value;
                          setWebsites(next);
                        }}
                        placeholder={`https://website-${idx+1}.com`}
                      />
                    ))}
                  </div>
                  {websitesError && <div className="flex items-center gap-2 text-xs font-bold text-rose-600"><AlertCircle size={14} /> {websitesError}</div>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-end gap-4">
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
                  <Button onClick={save} disabled={busy || !!websitesError} className="min-w-[120px]">
                    {busy ? "Saving..." : <span className="flex items-center gap-2"><Save size={16} /> Save Changes</span>}
                  </Button>
               </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
