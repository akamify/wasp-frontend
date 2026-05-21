import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { useToast } from "@shared/providers/ToastContext";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useOtpGuard } from "@shared/hooks/useOtpGuard";

export default function SuperAdminProfileEditPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");

  const [pwdModal, setPwdModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [contactModal, setContactModal] = useState<null | "change_email" | "change_phone">(null);
  const [nextValue, setNextValue] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const contactOtpGuard = useOtpGuard({ cooldownSeconds: 60, maxAttempts: 5 });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res: any = await API.superAdmin.profile();
      setProfile(res?.profile || null);
      setName(String(res?.profile?.name || ""));
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveName() {
    setSaving(true);
    try {
      await API.superAdmin.updateProfileName({ name: String(name || "").trim() });
      toast("Name updated", "success");
      await load();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to update name", "error");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setSaving(true);
    try {
      await API.superAdmin.changeProfilePassword({ currentPassword, newPassword });
      toast("Password updated", "success");
      setPwdModal(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to update password", "error");
    } finally {
      setSaving(false);
    }
  }

  async function sendOtp() {
    if (!contactModal) return;
    if (!contactOtpGuard.canSend) return;
    setSaving(true);
    try {
      const payload = contactModal === "change_email" ? { purpose: contactModal, email: nextValue } : { purpose: contactModal, phone: nextValue };
      await API.superAdmin.requestProfileOtp(payload);
      contactOtpGuard.onSendSuccess();
      toast("OTP sent", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setSaving(false);
    }
  }

  async function verifyOtpAndSave() {
    setSaving(true);
    try {
      await API.superAdmin.verifyProfileOtp({ otp: otpCode });
      toast("Updated successfully", "success");
      setContactModal(null);
      setNextValue("");
      setOtpCode("");
      contactOtpGuard.reset();
      await load();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to verify OTP", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4 pr-6">
        <div className="rounded-[5px] border border-slate-200 bg-white p-5">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        </div>
        <TableSkeleton cols={4} rows={6} />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="space-y-4 py-4 pr-6">
      <div className="rounded-[5px] border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-black text-slate-900">Edit Super Admin Profile</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/super-admin/profile")}>Back</Button>
            <Button onClick={saveName} disabled={saving}>Save Name</Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={String(profile?.email || "")} disabled />
        </div>

        <div className="mt-4 flex items-center justify-end flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPwdModal(true)} disabled={saving}>Change Password</Button>
          <Button
            variant="outline"
            onClick={() => {
              setContactModal("change_email");
              setNextValue("");
              setOtpCode("");
              contactOtpGuard.reset();
            }}
            disabled={saving}
          >
            Change Email (OTP)
          </Button>
        </div>
      </div>

      <Modal isOpen={pwdModal} onClose={() => setPwdModal(false)} title="Change Password" className="max-w-[820px]">
        <div className="space-y-4 p-1">
          <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPwdModal(false)}>Cancel</Button>
            <Button onClick={savePassword} disabled={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!contactModal}
        onClose={() => { setContactModal(null); contactOtpGuard.reset(); }}
        title={contactModal === "change_email" ? "Change Email with OTP" : "Change Mobile with OTP"}
        className="max-w-[920px]"
      >
        <div className="space-y-4 p-1">
          <Input
            label={contactModal === "change_email" ? "New Email" : "New Mobile"}
            value={nextValue}
            onChange={(e) => setNextValue(e.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-end">
            <Button variant="outline" onClick={sendOtp} disabled={saving || !nextValue.trim() || !contactOtpGuard.canSend}>
              {!contactOtpGuard.canSend
                ? contactOtpGuard.cooldown > 0
                  ? `Send in ${contactOtpGuard.cooldown}s`
                  : "Send limit reached"
                : "Send OTP"}
            </Button>
            <Input label="OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
          </div>
          <div className="text-center text-[11px] font-semibold text-slate-500">
            OTP tries left: {contactOtpGuard.remainingAttempts}/{contactOtpGuard.maxAttempts}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setContactModal(null); contactOtpGuard.reset(); }}>Cancel</Button>
            <Button onClick={verifyOtpAndSave} disabled={saving || otpCode.length !== 6}>Verify & Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
