import { useEffect, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  LogOut,
  ShieldCheck,
  BadgeCheck,
  Settings
} from "lucide-react";
import { SettingsSkeleton } from "../components/ui/Skeletons";

export default function SettingsPage() {
  const { user, refreshMe, logout } = useAuth();
  const { toast } = useToast();
  const [initialLoading, setInitialLoading] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);

  useEffect(() => {
    // Simulate short load for UX consistency
    const timer = setTimeout(() => setInitialLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [passwordBusy, setPasswordBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLinkBusy, setResetLinkBusy] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [awaitingTwoFactorOtp, setAwaitingTwoFactorOtp] = useState(false);
  const [twoFactorResendCooldown, setTwoFactorResendCooldown] = useState(0);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user?.name, user?.phone]);

  useEffect(() => {
    if (twoFactorResendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setTwoFactorResendCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [twoFactorResendCooldown]);

  async function saveProfile() {
    setProfileBusy(true);
    try {
      await API.auth.updateProfile({ name, phone });
      toast("Profile details updated successfully.", "success");
      await refreshMe();
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Failed to update profile", "error");
    } finally {
      setProfileBusy(false);
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match.", "warning");
      return;
    }
    if (newPassword.length < 8) {
      toast("Password must be at least 8 characters.", "warning");
      return;
    }

    setPasswordBusy(true);
    try {
      await API.auth.changePassword({
        currentPassword,
        newPassword,
      });
      toast("Password changed successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Failed to change password", "error");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function sendResetLink() {
    setResetLinkBusy(true);
    try {
      await API.auth.forgotPassword({ email: user?.email || "" });
      toast("Reset link sent to your registered email.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to send reset link", "error");
    } finally {
      setResetLinkBusy(false);
    }
  }

  async function enable2fa() {
    setOtpBusy(true);
    try {
      await API.auth.requestEnable2fa();
      setAwaitingTwoFactorOtp(true);
      setTwoFactorResendCooldown(60);
      toast("OTP sent to your registered email.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to request 2FA OTP", "error");
    } finally {
      setOtpBusy(false);
    }
  }

  async function verify2fa() {
    if (!/^\d{6}$/.test(twoFactorOtp)) {
      toast("Enter a valid 6-digit OTP.", "warning");
      return;
    }
    setOtpBusy(true);
    try {
      await API.auth.verifyEnable2fa({ otp: twoFactorOtp });
      setTwoFactorOtp("");
      setAwaitingTwoFactorOtp(false);
      setTwoFactorResendCooldown(0);
      await refreshMe();
      toast("2FA enabled successfully.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to verify OTP", "error");
    } finally {
      setOtpBusy(false);
    }
  }

  async function disable2faAction() {
    setOtpBusy(true);
    try {
      await API.auth.disable2fa();
      setTwoFactorOtp("");
      setAwaitingTwoFactorOtp(false);
      setTwoFactorResendCooldown(0);
      await refreshMe();
      toast("2FA disabled.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to disable 2FA", "error");
    } finally {
      setOtpBusy(false);
    }
  }

  if (initialLoading) return <SettingsSkeleton />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
      {/* Header Section */}
      <div className="bg-white rounded-[5px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          {/* <div className="h-24 w-24 rounded-full bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center text-brand-600">
             <CircleUser size={48} strokeWidth={1.5} />
          </div> */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{user?.name || "User Account"}</h1>
              <BadgeCheck className="text-brand-600" size={24} />
            </div>
            <p className="text-slate-500 font-medium">Manage your personal account settings and security preferences.</p>
          </div>
          <div className="md:ml-auto">
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-[5px] font-black text-sm hover:bg-rose-100 transition-all border border-rose-100"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profile Details Card */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Settings size={18} className="text-slate-400" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Personal Details</h3>
          </div>
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            <div className="space-y-6">
              <div className="grid gap-6">
                <Input
                  label="Full Name"
                  icon={<User size={18} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
                <Input
                  label="Email Address"
                  icon={<Mail size={18} />}
                  value={user?.email || ""}
                  disabled
                  placeholder="email@example.com"
                />
                <Input
                  label="Phone Number"
                  icon={<Phone size={18} />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                />
              </div>

              <Button onClick={saveProfile} disabled={profileBusy} className="w-full h-12 rounded-[5px]">
                {profileBusy ? "Saving..." : "Save Profile Details"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Security Card */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <ShieldCheck size={18} className="text-slate-400" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Security & Privacy</h3>
          </div>
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            <div className="space-y-6">
              <div className="grid gap-6">
                <Input
                  label="Current Password"
                  type="password"
                  icon={<Lock size={18} />}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div className="h-px bg-slate-50" />
                <Input
                  label="New Password"
                  type="password"
                  icon={<Lock size={18} />}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  icon={<Lock size={18} />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>

              <Button onClick={changePassword} disabled={passwordBusy} variant="outline" className="w-full h-12 rounded-[5px] border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white">
                {passwordBusy ? "Updating..." : "Update Password"}
              </Button>

              <Button onClick={sendResetLink} disabled={resetLinkBusy} variant="ghost" className="w-full h-11 rounded-[5px] border border-ink-900/10 bg-white">
                {resetLinkBusy ? "Sending..." : "Send reset link to email"}
              </Button>

              <div className="rounded-[5px] border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Two-factor authentication</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  {user?.twoFactorEnabled ? (
                    <Button type="button" variant="ghost" disabled={otpBusy} onClick={disable2faAction}>
                      Disable
                    </Button>
                  ) : (
                    <Button type="button" disabled={otpBusy} onClick={enable2fa}>
                      Enable
                    </Button>
                  )}
                </div>

                {awaitingTwoFactorOtp && !user?.twoFactorEnabled ? (
                  <div className="mt-4 space-y-3">
                    <Input
                      label="Email OTP"
                      value={twoFactorOtp}
                      onChange={(e) => setTwoFactorOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                      placeholder="123456"
                    />
                    <Button type="button" disabled={otpBusy} onClick={verify2fa} className="w-full">
                      {otpBusy ? "Verifying..." : "Verify and enable 2FA"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={otpBusy || twoFactorResendCooldown > 0}
                      onClick={enable2fa}
                      className="w-full"
                    >
                      {twoFactorResendCooldown > 0
                        ? `Resend in ${twoFactorResendCooldown}s`
                        : "Resend OTP"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          <div className="p-6 bg-amber-50 rounded-[5px] border border-amber-100">
            <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
              <span className="font-black uppercase mr-1">Security Tip:</span>
              Use a strong password and rotate it periodically to keep your account safe from unauthorized access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
