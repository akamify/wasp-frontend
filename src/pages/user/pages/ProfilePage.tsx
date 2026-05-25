import { useNavigate } from "react-router-dom";
import { Mail, Phone, Building2, Calendar, BadgeCheck, Edit2, Copy, Check, Shield } from "lucide-react";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { EditProfileModal } from "@pages/user/components/EditProfileModal";
import { useProfilePage } from "@pages/user/hooks/useProfilePage";

export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    user,
    workspace,
    editModalOpen,
    editBusy,
    editForm,
    setEditForm,
    profileOtp,
    setProfileOtp,
    profileOtpBusy,
    profileOtpPurpose,
    otpSent,
    copiedWorkspaceId,
    formatDate,
    openEditModal,
    closeEditModal,
    handleSaveProfile,
    requestOtp,
    verifyOtp,
    copyWorkspaceId,
  } = useProfilePage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-8 max-w-4xl mx-auto">
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-ink-900">Profile</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Your account information</p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 md:p-8 border-ink-900/5 shadow-xl shadow-ink-900/5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[8px] bg-brand-100 flex items-center justify-center text-brand-600 font-black text-2xl sm:text-4xl shadow-md flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                </div>
              </div>

              <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-ink-900 mb-1 truncate">{user?.name || "User"}</h2>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs sm:text-sm font-bold text-ink-800/60 uppercase tracking-widest">{workspace?.plan || "Free"} Plan</span>
                      <BadgeCheck size={14} className="text-brand-600 flex-shrink-0" />
                    </div>
                  </div>
                  <button onClick={openEditModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-[5px] transition-colors flex-shrink-0" title="Edit Profile">
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 sm:pt-4 space-y-2 border-t border-slate-100">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-ink-800/70">
                <Mail size={14} className="text-ink-800/40 flex-shrink-0" />
                <span className="truncate">{user?.email || "â€”"}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-ink-800/70">
                <Phone size={14} className="text-ink-800/40 flex-shrink-0" />
                <span className="truncate">{user?.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-ink-800/70">
                <Building2 size={14} className="text-ink-800/40 flex-shrink-0" />
                <span className="truncate">{workspace?.name || "Personal Workspace"}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-ink-800/70">
                <Shield size={14} className="text-ink-800/40 flex-shrink-0" />
                <span className="truncate">{workspace?.id || "â€”"}</span>
                {workspace?.id ? (
                  <button type="button" onClick={() => void copyWorkspaceId()} className="rounded p-1 text-ink-800/60 hover:bg-slate-100" title={copiedWorkspaceId ? "Copied" : "Copy"}>
                    {copiedWorkspaceId ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                ) : null}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-ink-800/70">
                <Calendar size={14} className="text-ink-800/40 flex-shrink-0" />
                <span>Joined {formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </Card>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <Card className="p-4 sm:p-6 border-ink-900/5">
              <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-ink-800/40 mb-2">Account Status</div>
              <div className="text-xl sm:text-2xl font-black text-ink-900 mb-1">Active</div>
              <div className="text-xs font-semibold text-ink-800/60">Your account is verified and active</div>
            </Card>
            <Card className="p-4 sm:p-6 border-ink-900/5">
              <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-ink-800/40 mb-2">Workspace</div>
              <div className="text-xl sm:text-2xl font-black text-ink-900 mb-1 truncate">{workspace?.name || "Personal"}</div>
              <div className="text-xs font-semibold text-ink-800/60">You have access to this workspace</div>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
            <Button onClick={() => navigate("/app/settings")} variant="outline" className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
              Account Settings
            </Button>
            <Button onClick={() => navigate("/app/plan")} className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
              View Plans
            </Button>
          </div>
        </div>
      </div>

      <EditProfileModal
        open={editModalOpen}
        onClose={closeEditModal}
        editForm={editForm}
        setEditForm={setEditForm}
        profileOtp={profileOtp}
        setProfileOtp={setProfileOtp}
        profileOtpBusy={profileOtpBusy}
        profileOtpPurpose={profileOtpPurpose}
        otpSent={otpSent}
        onRequestOtp={requestOtp}
        onVerifyOtp={verifyOtp}
        onSave={handleSaveProfile}
        editBusy={editBusy}
      />
    </div>
  );
}
