import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useToast } from "@shared/providers/ToastContext";
import { useOtpGuard } from "@shared/hooks/useOtpGuard";
import {
  AdminProfileCard,
  AdminProfileError,
  AdminProfileHeader,
  type LoginEvent,
  LoginHistoryCard,
  SubmittedRequestsCard,
} from "@pages/admin/pages/profile/AdminProfileSections";
import {
  EditProfileRequestModal,
  PasswordResetModal,
  RequestOtpModal,
  TwoFactorModal,
} from "@pages/admin/pages/profile/AdminProfileModals";

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
      <AdminProfileHeader onRefresh={load} onEdit={() => setEditModal(true)} />
      <AdminProfileError error={error} />

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminProfileCard
          profile={profile}
          onResetPassword={() => setPasswordModal(true)}
          onEnable2fa={() => setOtpModal(true)}
        />
        <SubmittedRequestsCard
          shownRequests={shownRequests}
          onScroll={(e) => onListScroll(e, "requests")}
          onOpenOtp={openRequestOtp}
          saving={saving}
        />
      </div>

      <LoginHistoryCard shownLogins={shownLogins} onScroll={(e) => onListScroll(e, "logins")} />

      <PasswordResetModal
        open={passwordModal}
        onClose={() => setPasswordModal(false)}
        oldPassword={oldPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        setOldPassword={setOldPassword}
        setNewPassword={setNewPassword}
        setConfirmPassword={setConfirmPassword}
        onSave={savePassword}
        saving={saving}
      />
      <TwoFactorModal
        open={otpModal}
        onClose={() => {
          setOtpModal(false);
          setOtpSent(false);
          setOtpCode("");
          twoFactorOtpGuard.reset();
        }}
        otpSent={otpSent}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        onSend={send2faOtp}
        onVerify={verify2faOtp}
        saving={saving}
        canSend={twoFactorOtpGuard.canSend}
        cooldown={twoFactorOtpGuard.cooldown}
        remainingAttempts={twoFactorOtpGuard.remainingAttempts}
        maxAttempts={twoFactorOtpGuard.maxAttempts}
      />
      <RequestOtpModal
        open={requestOtpModal}
        onClose={() => {
          setRequestOtpModal(false);
          setSelectedOtpRequest(null);
          setRequestOtpCode("");
          requestOtpGuard.reset();
        }}
        requestOtpCode={requestOtpCode}
        setRequestOtpCode={setRequestOtpCode}
        resend={resendRequestOtp}
        verify={verifyRequestOtp}
        busy={requestOtpBusy}
        canSend={requestOtpGuard.canSend}
        cooldown={requestOtpGuard.cooldown}
        remainingAttempts={requestOtpGuard.remainingAttempts}
        maxAttempts={requestOtpGuard.maxAttempts}
      />
      <EditProfileRequestModal
        open={editModal}
        onClose={() => setEditModal(false)}
        requestType={requestType}
        setRequestType={setRequestType}
        needsNewValue={needsNewValue}
        newValue={newValue}
        setNewValue={setNewValue}
        reasonPreset={reasonPreset}
        setReasonPreset={setReasonPreset}
        reasonText={reasonText}
        setReasonText={setReasonText}
        onSubmit={submitRequest}
        saving={saving}
      />
    </div>
  );
}
