import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useToast } from "@shared/providers/ToastContext";
import { useOtpGuard } from "@shared/hooks/useOtpGuard";

type LoginEvent = {
  id: string;
  ip?: string;
  userAgent?: string;
  location?: string;
  action?: string;
  createdAt?: string;
};

const REQUEST_LABELS: Record<string, string> = {
  name: "Name Change",
  email: "Email Change",
  phone: "Phone Change",
  password_reset: "Password Reset Link",
  "2fa_enable": "Enable 2FA",
  "2fa_disable": "Disable 2FA",
};

export default function AdminProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [logins, setLogins] = useState<LoginEvent[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [visibleLogins, setVisibleLogins] = useState(10);
  const [visibleRequests, setVisibleRequests] = useState(10);

  const [passwordModal, setPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpModal, setOtpModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const twoFactorOtpGuard = useOtpGuard({ cooldownSeconds: 60, maxAttempts: 5 });

  const [requestOtpModal, setRequestOtpModal] = useState(false);
  const [requestOtpBusy, setRequestOtpBusy] = useState(false);
  const [requestOtpCode, setRequestOtpCode] = useState("");
  const [selectedOtpRequest, setSelectedOtpRequest] = useState<any>(null);
  const requestOtpGuard = useOtpGuard({ cooldownSeconds: 60, maxAttempts: 5 });

  const [editModal, setEditModal] = useState(false);
  const [requestType, setRequestType] = useState("name");
  const [newValue, setNewValue] = useState("");
  const [reasonPreset, setReasonPreset] = useState("Profile Update");
  const [reasonText, setReasonText] = useState("");

  const needsNewValue = useMemo(() => ["name", "email", "phone"].includes(requestType), [requestType]);
  const shownLogins = useMemo(() => logins.slice(0, visibleLogins), [logins, visibleLogins]);
  const shownRequests = useMemo(() => requests.slice(0, visibleRequests), [requests, visibleRequests]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [p, l, r]: any = await Promise.all([
        API.admin.profile(),
        API.admin.profileLogins({ page: 1, limit: 200 }),
        API.admin.profileRequests({ page: 1, limit: 100 }),
      ]);
      setProfile(p?.profile || null);
      setLogins(Array.isArray(l?.items) ? l.items : []);
      setRequests(Array.isArray(r?.items) ? r.items : []);
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setVisibleLogins(10);
    setVisibleRequests(10);
  }, [logins.length, requests.length]);

  function onListScroll(e: any, kind: "logins" | "requests") {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (!nearBottom) return;
    if (kind === "logins") setVisibleLogins((p) => Math.min(p + 10, logins.length));
    if (kind === "requests") setVisibleRequests((p) => Math.min(p + 10, requests.length));
  }

  async function savePassword() {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast("All password fields are required", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("Confirm password does not match", "warning");
      return;
    }
    setSaving(true);
    try {
      await API.admin.changePassword({ currentPassword: oldPassword, newPassword });
      toast("Password updated", "success");
      setPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to update password", "error");
    } finally {
      setSaving(false);
    }
  }

  async function send2faOtp() {
    if (!twoFactorOtpGuard.canSend) return;
    setSaving(true);
    try {
      await API.auth.requestEnable2fa();
      setOtpSent(true);
      twoFactorOtpGuard.onSendSuccess();
      toast("OTP sent to your registered email", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setSaving(false);
    }
  }

  async function verify2faOtp() {
    if (!/^\d{6}$/.test(otpCode)) {
      toast("Enter valid 6 digit OTP", "warning");
      return;
    }
    setSaving(true);
    try {
      await API.auth.verifyEnable2fa({ otp: otpCode });
      toast("2FA enabled", "success");
      setOtpModal(false);
      setOtpSent(false);
      setOtpCode("");
      twoFactorOtpGuard.reset();
      await load();
    } catch (e: any) {
      toast(e?.response?.data?.message || "OTP verification failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitRequest() {
    const value = String(newValue || "").trim();
    const details = String(reasonText || "").trim();
    if (!details) {
      toast("Reason details required", "warning");
      return;
    }
    if (needsNewValue && !value) {
      toast("New value required", "warning");
      return;
    }

    const reason = `${reasonPreset}${details ? ` | ${details}` : ""}`;
    setSaving(true);
    try {
      await API.admin.createProfileRequest({ requestType, newValue: value, reason });
      toast("Request submitted to super admin", "success");
      setEditModal(false);
      setNewValue("");
      setReasonText("");
      const r: any = await API.admin.profileRequests({ page: 1, limit: 100 });
      setRequests(Array.isArray(r?.items) ? r.items : []);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to submit request", "error");
    } finally {
      setSaving(false);
    }
  }

  function openRequestOtp(reqItem: any) {
    setSelectedOtpRequest(reqItem);
    setRequestOtpCode("");
    setRequestOtpModal(true);
    requestOtpGuard.reset();
  }

  async function resendRequestOtp() {
    if (!selectedOtpRequest?._id && !selectedOtpRequest?.id) return;
    if (!requestOtpGuard.canSend) return;
    const id = String(selectedOtpRequest?.id || selectedOtpRequest?._id || "");
    if (!id) return;
    setRequestOtpBusy(true);
    try {
      await API.admin.resendProfileRequestOtp(id);
      requestOtpGuard.onSendSuccess();
      toast("OTP resent to your registered email", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to resend OTP", "error");
    } finally {
      setRequestOtpBusy(false);
    }
  }

  async function verifyRequestOtp() {
    const id = String(selectedOtpRequest?.id || selectedOtpRequest?._id || "");
    if (!id) return;
    if (!/^\d{6}$/.test(requestOtpCode)) {
      toast("Enter valid 6 digit OTP", "warning");
      return;
    }
    setRequestOtpBusy(true);
    try {
      await API.admin.verifyProfileRequestOtp(id, { otp: requestOtpCode });
      toast("OTP verified. Changes applied.", "success");
      setRequestOtpModal(false);
      setSelectedOtpRequest(null);
      setRequestOtpCode("");
      requestOtpGuard.reset();
      await load();
    } catch (e: any) {
      toast(e?.response?.data?.message || "OTP verification failed", "error");
    } finally {
      setRequestOtpBusy(false);
    }
  }

  if (loading) return <TableSkeleton cols={4} rows={8} />;

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black leading-none tracking-tight text-slate-900 md:text-4xl">Admin Profile</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Profile info, security controls, and complete login history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}>Refresh</Button>
          <Button onClick={() => setEditModal(true)}>Edit Profile</Button>
        </div>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[5px] border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-5">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Profile</div>
          </div>
          <div className="space-y-4 p-6">
            <Input label="Name" value={String(profile?.displayName || "")} disabled />
            <Input label="Email" value={String(profile?.email || "")} disabled />
            <Input label="Phone" value={String(profile?.phone || "")} disabled />
            <Input label="2FA" value={profile?.twoFactorEnabled ? "Enabled" : "Disabled"} disabled />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" onClick={() => setPasswordModal(true)}>Reset Password</Button>
              <Button onClick={() => setOtpModal(true)} disabled={!!profile?.twoFactorEnabled}>Enable 2FA</Button>
            </div>
          </div>
        </div>

        <div className="rounded-[5px] border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-5">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Submitted Requests</div>
          </div>
          <div className="max-h-[280px] overflow-auto divide-y divide-slate-100" onScroll={(e) => onListScroll(e, "requests")}>
            {shownRequests.length ? shownRequests.map((r) => (
              <div key={String(r._id)} className="px-6 py-4 text-xs">
                <div className="font-black text-slate-900">{REQUEST_LABELS[String(r?.metadata?.requestType || "")] || r?.action || "Request"}</div>
                <div className="mt-1 text-slate-600">{String(r?.metadata?.reason || "-")}</div>
                <div className="mt-1 text-slate-500">Status: {String(r?.metadata?.status || "pending")} | {r?.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "-"}</div>
                {String(r?.metadata?.status || "") === "approved_pending_otp" ? (
                  <div className="mt-3">
                    <Button variant="outline" onClick={() => openRequestOtp(r)} disabled={saving}>
                      Verify OTP
                    </Button>
                  </div>
                ) : null}
              </div>
            )) : <div className="px-6 py-8 text-sm text-slate-500">No requests yet.</div>}
          </div>
        </div>
      </div>

      <div className="rounded-[5px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Login History (Full)</div>
        </div>
        <div className="max-h-[520px] overflow-auto divide-y divide-slate-100" onScroll={(e) => onListScroll(e, "logins")}>
          {shownLogins.length ? shownLogins.map((e) => (
            <div key={e.id} className="px-6 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-xs font-black text-slate-900">{e.userAgent || "Unknown device"}</div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-500 truncate">
                    Action: {e.action || "-"} | IP: {e.ip || "-"} | Location: {e.location || "Localhost"}
                  </div>
                </div>
                <div className="whitespace-nowrap text-[11px] font-black text-slate-500">
                  {e.createdAt ? new Date(e.createdAt).toLocaleString("en-IN") : "-"}
                </div>
              </div>
            </div>
          )) : <div className="px-6 py-14 text-center text-sm font-bold text-slate-400">No login events yet.</div>}
        </div>
      </div>

      <Modal isOpen={passwordModal} onClose={() => setPasswordModal(false)} title="Reset Password" className="max-w-[860px]">
        <div className="space-y-4 p-1">
          <Input label="Old Password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPasswordModal(false)}>Cancel</Button>
            <Button onClick={savePassword} disabled={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={otpModal} onClose={() => { setOtpModal(false); setOtpSent(false); setOtpCode(""); twoFactorOtpGuard.reset(); }} title="Enable 2FA" className="max-w-[860px]">
        <div className="space-y-4 p-1">
          <div className="text-sm text-slate-600">Enable 2FA by verifying OTP sent on registered email.</div>
          {otpSent ? (
            <Input label="OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setOtpModal(false); setOtpSent(false); setOtpCode(""); }}>Cancel</Button>
            {!otpSent ? (
              <Button onClick={send2faOtp} disabled={saving || !twoFactorOtpGuard.canSend}>
                {!twoFactorOtpGuard.canSend
                  ? twoFactorOtpGuard.cooldown > 0
                    ? `Send in ${twoFactorOtpGuard.cooldown}s`
                    : "Send limit reached"
                  : "Send OTP"}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={send2faOtp} disabled={saving || !twoFactorOtpGuard.canSend}>
                  {!twoFactorOtpGuard.canSend
                    ? twoFactorOtpGuard.cooldown > 0
                      ? `Resend in ${twoFactorOtpGuard.cooldown}s`
                      : "Resend limit reached"
                    : "Resend OTP"}
                </Button>
                <Button onClick={verify2faOtp} disabled={saving || otpCode.length !== 6}>Verify & Enable</Button>
              </>
            )}
          </div>
          <div className="text-center text-[11px] font-semibold text-slate-500">
            OTP tries left: {twoFactorOtpGuard.remainingAttempts}/{twoFactorOtpGuard.maxAttempts}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={requestOtpModal}
        onClose={() => {
          setRequestOtpModal(false);
          setSelectedOtpRequest(null);
          setRequestOtpCode("");
          requestOtpGuard.reset();
        }}
        title="Verify OTP"
        className="max-w-[860px]"
      >
        <div className="space-y-4 p-1">
          <div className="text-sm text-slate-600">Enter the OTP sent to your registered email to apply the approved change.</div>
          <Input label="OTP" value={requestOtpCode} onChange={(e) => setRequestOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRequestOtpModal(false)}>Cancel</Button>
            <Button variant="outline" onClick={resendRequestOtp} disabled={requestOtpBusy || !requestOtpGuard.canSend}>
              {!requestOtpGuard.canSend
                ? requestOtpGuard.cooldown > 0
                  ? `Resend in ${requestOtpGuard.cooldown}s`
                  : "Resend limit reached"
                : "Resend OTP"}
            </Button>
            <Button onClick={verifyRequestOtp} disabled={requestOtpBusy || requestOtpCode.length !== 6}>
              {requestOtpBusy ? "Verifying..." : "Verify"}
            </Button>
          </div>
          <div className="text-center text-[11px] font-semibold text-slate-500">
            OTP tries left: {requestOtpGuard.remainingAttempts}/{requestOtpGuard.maxAttempts}
          </div>
        </div>
      </Modal>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Profile (Request to Super Admin)" className="max-w-[980px]">
        <div className="space-y-4 p-1">
          <label className="text-xs font-bold text-slate-600">
            Request Type
            <select
              className="mt-1 h-10 w-full rounded-[5px] border border-slate-200 bg-white px-3 text-sm"
              value={requestType}
              onChange={(e) => { setRequestType(e.target.value); setNewValue(""); }}
            >
              <option value="name">Name Change</option>
              <option value="email">Email Change</option>
              <option value="phone">Phone Change</option>
              <option value="password_reset">Password Reset Link</option>
              <option value="2fa_enable">Enable 2FA</option>
              <option value="2fa_disable">Disable 2FA</option>
            </select>
          </label>

          {needsNewValue ? (
            <Input
              label={requestType === "email" ? "New Email" : requestType === "phone" ? "New Phone" : "New Name"}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          ) : null}

          <label className="text-xs font-bold text-slate-600">
            Reason Category
            <select
              className="mt-1 h-10 w-full rounded-[5px] border border-slate-200 bg-white px-3 text-sm"
              value={reasonPreset}
              onChange={(e) => setReasonPreset(e.target.value)}
            >
              <option value="Profile Update">Profile Update</option>
              <option value="Security Requirement">Security Requirement</option>
              <option value="Contact Information Update">Contact Information Update</option>
              <option value="Compliance Requirement">Compliance Requirement</option>
            </select>
          </label>

          <Input label="Reason Details" value={reasonText} onChange={(e) => setReasonText(e.target.value)} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button onClick={submitRequest} disabled={saving}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
