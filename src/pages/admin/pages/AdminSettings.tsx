import React, { useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { ShieldCheck, Lock, Fingerprint, KeyRound } from "lucide-react";

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    setBusy(true);
    try {
      await API.admin.changePassword({ currentPassword, newPassword });
      setSuccess("Admin password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.userMessage || err?.response?.data?.message || "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Admin Settings"
        subtitle="Manage administrative security preferences and global account credentials."
        onRefresh={() => {}}
      />

      <div className="max-w-2xl w-full mx-auto">
        <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
              <div className="size-12 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-600 shadow-inner">
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Security & Authentication</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Update Master Credentials</p>
              </div>
           </div>

           <form className="p-6 md:p-10 space-y-8" onSubmit={onSubmit}>
              {error ? <Alert variant="danger" className="rounded-[5px] border-red-100">{error}</Alert> : null}
              {success ? <Alert variant="success" className="rounded-[5px] border-emerald-100">{success}</Alert> : null}

              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 ml-1">
                       <Fingerprint size={12} className="text-brand-500" /> Current Password
                    </label>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="h-14 rounded-[5px] border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                    />
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 ml-1">
                          <Lock size={12} className="text-brand-500" /> New Password
                       </label>
                       <Input
                         type="password"
                         autoComplete="new-password"
                         placeholder="Min. 8 characters"
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         required
                         className="h-14 rounded-[5px] border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 ml-1">
                          <KeyRound size={12} className="text-brand-500" /> Confirm New Password
                       </label>
                       <Input
                         type="password"
                         autoComplete="new-password"
                         placeholder="Verify password"
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         required
                         className="h-14 rounded-[5px] border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                       />
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-slate-400">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">End-to-end Encrypted</span>
                 </div>
                 <Button 
                   type="submit" 
                   disabled={busy}
                   className="h-14 px-10 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-500/20 active:scale-95 transition-all"
                 >
                   {busy ? "Updating..." : "Save Credentials"}
                 </Button>
              </div>
           </form>
        </div>

        <div className="mt-8 p-6 rounded-[5px] border border-amber-200 bg-amber-50/50 flex gap-4 items-start">
           <div className="size-10 rounded-[5px] bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <KeyRound size={20} />
           </div>
           <div>
              <h3 className="text-sm font-black text-amber-900 tracking-tight mb-1">Important Security Notice</h3>
              <p className="text-xs font-bold text-amber-800/70 leading-relaxed">
                 Updating your admin password will not terminate existing active sessions immediately but will require the new credentials for any future authentication attempts. We strongly recommend using a unique, complex password managed by a secure vault.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

