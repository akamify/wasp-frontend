import { useState } from "react";
import { useAuth } from "@shared/providers/AuthContext";
import { Card } from "@components/ui/Card";
import { Mail, Phone, Building2, Calendar, BadgeCheck, Edit2, X, Copy, Check, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useToast } from "@shared/providers/ToastContext";
import { API } from "@api/api";
import { AnimatePresence, motion } from "framer-motion";

export default function ProfilePage() {
    const { user, workspace, refreshMe } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editBusy, setEditBusy] = useState(false);
    const [editForm, setEditForm] = useState({ name: user?.name || "", phone: user?.phone || "", email: user?.email || "" });
    const [profileOtp, setProfileOtp] = useState("");
    const [profileOtpBusy, setProfileOtpBusy] = useState(false);
    const [profileOtpPurpose, setProfileOtpPurpose] = useState<"" | "change_email" | "change_name">("");
    const [otpSent, setOtpSent] = useState(false);
    const [copiedWorkspaceId, setCopiedWorkspaceId] = useState(false);

    const formatDate = (date?: string) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    async function handleSaveProfile() {
        if (!editForm.name.trim()) {
            toast("Name is required", "warning");
            return;
        }

        const currentEmail = String(user?.email || "").trim().toLowerCase();
        const nextEmail = String(editForm.email || "").trim().toLowerCase();
        const currentName = String(user?.name || "").trim();
        const nextName = String(editForm.name || "").trim();

        // Name/email changes require OTP verification.
        if (nextEmail && nextEmail !== currentEmail) {
            toast("Please verify OTP to change email.", "warning");
            return;
        }
        if (nextName && currentName && nextName !== currentName) {
            toast("Please verify OTP to change name.", "warning");
            return;
        }

        setEditBusy(true);
        try {
            await API.auth.updateProfile({
                name: nextName,
                phone: editForm.phone,
            });
            await refreshMe();
            toast("Profile updated successfully", "success");
            setEditModalOpen(false);
        } catch (e: any) {
            toast(e?.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setEditBusy(false);
        }
    }

    async function requestOtp(purpose: "change_email" | "change_name") {
        setProfileOtpBusy(true);
        try {
            if (purpose === "change_email") {
                const nextEmail = String(editForm.email || "").trim().toLowerCase();
                if (!nextEmail) {
                    toast("New email is required", "warning");
                    return;
                }
                await API.auth.requestProfileOtp({ purpose, email: nextEmail });
            } else {
                const nextName = String(editForm.name || "").trim();
                if (!nextName) {
                    toast("New name is required", "warning");
                    return;
                }
                await API.auth.requestProfileOtp({ purpose, name: nextName });
            }
            setProfileOtpPurpose(purpose);
            setOtpSent(true);
            toast("OTP sent to your registered email", "success");
        } catch (e: any) {
            toast(e?.response?.data?.message || "Failed to send OTP", "error");
        } finally {
            setProfileOtpBusy(false);
        }
    }

    async function verifyOtp() {
        const otp = String(profileOtp || "").trim();
        if (!otp) {
            toast("Enter OTP", "warning");
            return;
        }
        setProfileOtpBusy(true);
        try {
            await API.auth.verifyProfileOtp({ otp });
            await refreshMe({ silent: true } as any);
            setProfileOtp("");
            setOtpSent(false);
            setProfileOtpPurpose("");
            toast("OTP verified successfully", "success");
        } catch (e: any) {
            toast(e?.response?.data?.message || "OTP verification failed", "error");
        } finally {
            setProfileOtpBusy(false);
        }
    }

    async function copyWorkspaceId() {
        const id = String(workspace?.id || "").trim();
        if (!id) return;
        await navigator.clipboard.writeText(id);
        setCopiedWorkspaceId(true);
        toast("Workspace ID copied", "success");
        window.setTimeout(() => setCopiedWorkspaceId(false), 1200);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
            <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="pt-2">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-ink-900">Profile</h1>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Your account information</p>
                </div>

                <div className="grid gap-4 sm:gap-6">
                    {/* User Info Card */}
                    <Card className="p-4 sm:p-6 md:p-8 border-ink-900/5 shadow-xl shadow-ink-900/5">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[8px] bg-brand-100 flex items-center justify-center text-brand-600 font-black text-2xl sm:text-4xl shadow-md flex-shrink-0">
                                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 w-full text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                                    <div className="min-w-0">
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-ink-900 mb-1 truncate">{user?.name || "User"}</h2>
                                        <div className="flex items-center justify-center sm:justify-start gap-2">
                                            <span className="text-xs sm:text-sm font-bold text-ink-800/60 uppercase tracking-widest">{workspace?.plan || "Free"} Plan</span>
                                            <BadgeCheck size={14} className="text-brand-600 flex-shrink-0" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditForm({ name: user?.name || "", phone: user?.phone || "", email: user?.email || "" });
                                            setProfileOtp("");
                                            setOtpSent(false);
                                            setProfileOtpPurpose("");
                                            setEditModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-[5px] transition-colors flex-shrink-0"
                                        title="Edit Profile"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="pt-3 sm:pt-4 space-y-2 border-t border-slate-100">
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-ink-800/70">
                                <Mail size={14} className="text-ink-800/40 flex-shrink-0" />
                                <span className="truncate">{user?.email || "—"}</span>
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
                                <span className="truncate">{workspace?.id || "—"}</span>
                                {workspace?.id ? (
                                  <button
                                    type="button"
                                    onClick={() => void copyWorkspaceId()}
                                    className="rounded p-1 text-ink-800/60 hover:bg-slate-100"
                                    title={copiedWorkspaceId ? "Copied" : "Copy"}
                                  >
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

                    {/* Account Stats */}
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

                    {/* Action Buttons */}
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

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {editModalOpen && (
                    <motion.div
                        className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditModalOpen(false)}
                    >
                        <motion.div
                            className="relative w-full max-w-md overflow-hidden rounded-[5px] border border-slate-100 bg-white shadow-2xl my-auto"
                            initial={{ y: 20, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50">
                                <div className="min-w-0">
                                    <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Edit Profile</div>
                                    <h2 className="mt-1 text-sm sm:text-lg font-black text-slate-900 truncate">Update Your Information</h2>
                                </div>
                                <button
                                    onClick={() => setEditModalOpen(false)}
                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-[5px] transition-colors flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                                <Input
                                    label="Email (OTP required)"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder="Your email"
                                />

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={profileOtpBusy}
                                        onClick={() => requestOtp("change_email")}
                                        className="text-xs sm:text-sm w-full sm:w-auto"
                                    >
                                        {profileOtpBusy && profileOtpPurpose === "change_email" ? "Sending..." : "Send Email OTP"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={profileOtpBusy}
                                        onClick={() => requestOtp("change_name")}
                                        className="text-xs sm:text-sm w-full sm:w-auto"
                                    >
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
                                        <Button type="button" disabled={profileOtpBusy} onClick={verifyOtp} className="text-xs sm:text-sm">
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

                                {/* Modal Footer */}
                                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setEditModalOpen(false)}
                                        className="text-xs sm:text-sm"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSaveProfile}
                                        disabled={editBusy}
                                        className="text-xs sm:text-sm"
                                    >
                                        {editBusy ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
