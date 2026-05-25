import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";

type Props = {
  open: boolean;
  onClose: () => void;
  editForm: { name: string; phone: string; email: string };
  setEditForm: Dispatch<SetStateAction<{ name: string; phone: string; email: string }>>;
  profileOtp: string;
  setProfileOtp: Dispatch<SetStateAction<string>>;
  profileOtpBusy: boolean;
  profileOtpPurpose: "" | "change_email" | "change_name";
  otpSent: boolean;
  onRequestOtp: (purpose: "change_email" | "change_name") => Promise<void>;
  onVerifyOtp: () => Promise<void>;
  onSave: () => Promise<void>;
  editBusy: boolean;
};

export function EditProfileModal({
  open,
  onClose,
  editForm,
  setEditForm,
  profileOtp,
  setProfileOtp,
  profileOtpBusy,
  profileOtpPurpose,
  otpSent,
  onRequestOtp,
  onVerifyOtp,
  onSave,
  editBusy,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-[5px] border border-slate-100 bg-white shadow-2xl my-auto"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50">
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Edit Profile</div>
                <h2 className="mt-1 text-sm sm:text-lg font-black text-slate-900 truncate">Update Your Information</h2>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-[5px] transition-colors flex-shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <Input
                label="Email (OTP required)"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Your email"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" disabled={profileOtpBusy} onClick={() => void onRequestOtp("change_email")} className="text-xs sm:text-sm w-full sm:w-auto">
                  {profileOtpBusy && profileOtpPurpose === "change_email" ? "Sending..." : "Send Email OTP"}
                </Button>
                <Button type="button" variant="outline" disabled={profileOtpBusy} onClick={() => void onRequestOtp("change_name")} className="text-xs sm:text-sm w-full sm:w-auto">
                  {profileOtpBusy && profileOtpPurpose === "change_name" ? "Sending..." : "Send Name OTP"}
                </Button>
              </div>

              {otpSent ? (
                <div className="grid gap-2">
                  <Input
                    label="OTP"
                    value={profileOtp}
                    onChange={(e) => setProfileOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                    placeholder="123456"
                  />
                  <Button type="button" disabled={profileOtpBusy} onClick={() => void onVerifyOtp()} className="text-xs sm:text-sm">
                    {profileOtpBusy ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              ) : null}

              <Input
                label="Full Name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                autoFocus
              />
              <Input
                label="Phone Number"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Your phone number"
              />

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={onClose} className="text-xs sm:text-sm">
                  Cancel
                </Button>
                <Button type="button" onClick={() => void onSave()} disabled={editBusy} className="text-xs sm:text-sm">
                  {editBusy ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
