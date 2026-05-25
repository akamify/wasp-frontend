import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";

export function PasswordResetModal(props: {
  open: boolean;
  onClose: () => void;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  setOldPassword: (v: string) => void;
  setNewPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Modal isOpen={props.open} onClose={props.onClose} title="Reset Password" className="max-w-[860px]">
      <div className="space-y-4 p-1">
        <Input label="Old Password" type="password" value={props.oldPassword} onChange={(e) => props.setOldPassword(e.target.value)} />
        <Input label="New Password" type="password" value={props.newPassword} onChange={(e) => props.setNewPassword(e.target.value)} />
        <Input label="Confirm Password" type="password" value={props.confirmPassword} onChange={(e) => props.setConfirmPassword(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={props.onClose}>Cancel</Button>
          <Button onClick={props.onSave} disabled={props.saving}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

export function TwoFactorModal(props: {
  open: boolean;
  onClose: () => void;
  otpSent: boolean;
  otpCode: string;
  setOtpCode: (v: string) => void;
  onSend: () => void;
  onVerify: () => void;
  saving: boolean;
  canSend: boolean;
  cooldown: number;
  remainingAttempts: number;
  maxAttempts: number;
}) {
  return (
    <Modal isOpen={props.open} onClose={props.onClose} title="Enable 2FA" className="max-w-[860px]">
      <div className="space-y-4 p-1">
        <div className="text-sm text-slate-600">Enable 2FA by verifying OTP sent on registered email.</div>
        {props.otpSent ? (
          <Input label="OTP" value={props.otpCode} onChange={(e) => props.setOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={props.onClose}>Cancel</Button>
          {!props.otpSent ? (
            <Button onClick={props.onSend} disabled={props.saving || !props.canSend}>
              {!props.canSend ? (props.cooldown > 0 ? `Send in ${props.cooldown}s` : "Send limit reached") : "Send OTP"}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={props.onSend} disabled={props.saving || !props.canSend}>
                {!props.canSend ? (props.cooldown > 0 ? `Resend in ${props.cooldown}s` : "Resend limit reached") : "Resend OTP"}
              </Button>
              <Button onClick={props.onVerify} disabled={props.saving || props.otpCode.length !== 6}>Verify & Enable</Button>
            </>
          )}
        </div>
        <div className="text-center text-[11px] font-semibold text-slate-500">
          OTP tries left: {props.remainingAttempts}/{props.maxAttempts}
        </div>
      </div>
    </Modal>
  );
}

export function RequestOtpModal(props: {
  open: boolean;
  onClose: () => void;
  requestOtpCode: string;
  setRequestOtpCode: (v: string) => void;
  resend: () => void;
  verify: () => void;
  busy: boolean;
  canSend: boolean;
  cooldown: number;
  remainingAttempts: number;
  maxAttempts: number;
}) {
  return (
    <Modal isOpen={props.open} onClose={props.onClose} title="Verify OTP" className="max-w-[860px]">
      <div className="space-y-4 p-1">
        <div className="text-sm text-slate-600">Enter the OTP sent to your registered email to apply the approved change.</div>
        <Input label="OTP" value={props.requestOtpCode} onChange={(e) => props.setRequestOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={props.onClose}>Cancel</Button>
          <Button variant="outline" onClick={props.resend} disabled={props.busy || !props.canSend}>
            {!props.canSend ? (props.cooldown > 0 ? `Resend in ${props.cooldown}s` : "Resend limit reached") : "Resend OTP"}
          </Button>
          <Button onClick={props.verify} disabled={props.busy || props.requestOtpCode.length !== 6}>
            {props.busy ? "Verifying..." : "Verify"}
          </Button>
        </div>
        <div className="text-center text-[11px] font-semibold text-slate-500">
          OTP tries left: {props.remainingAttempts}/{props.maxAttempts}
        </div>
      </div>
    </Modal>
  );
}

export function EditProfileRequestModal(props: {
  open: boolean;
  onClose: () => void;
  requestType: string;
  setRequestType: (v: string) => void;
  needsNewValue: boolean;
  newValue: string;
  setNewValue: (v: string) => void;
  reasonPreset: string;
  setReasonPreset: (v: string) => void;
  reasonText: string;
  setReasonText: (v: string) => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  return (
    <Modal isOpen={props.open} onClose={props.onClose} title="Edit Profile (Request to Super Admin)" className="max-w-[980px]">
      <div className="space-y-4 p-1">
        <label className="text-xs font-bold text-slate-600">
          Request Type
          <select
            className="mt-1 h-10 w-full rounded-[5px] border border-slate-200 bg-white px-3 text-sm"
            value={props.requestType}
            onChange={(e) => { props.setRequestType(e.target.value); props.setNewValue(""); }}
          >
            <option value="name">Name Change</option>
            <option value="email">Email Change</option>
            <option value="phone">Phone Change</option>
            <option value="password_reset">Password Reset Link</option>
            <option value="2fa_enable">Enable 2FA</option>
            <option value="2fa_disable">Disable 2FA</option>
          </select>
        </label>

        {props.needsNewValue ? (
          <Input
            label={props.requestType === "email" ? "New Email" : props.requestType === "phone" ? "New Phone" : "New Name"}
            value={props.newValue}
            onChange={(e) => props.setNewValue(e.target.value)}
          />
        ) : null}

        <label className="text-xs font-bold text-slate-600">
          Reason Category
          <select
            className="mt-1 h-10 w-full rounded-[5px] border border-slate-200 bg-white px-3 text-sm"
            value={props.reasonPreset}
            onChange={(e) => props.setReasonPreset(e.target.value)}
          >
            <option value="Profile Update">Profile Update</option>
            <option value="Security Requirement">Security Requirement</option>
            <option value="Contact Information Update">Contact Information Update</option>
            <option value="Compliance Requirement">Compliance Requirement</option>
          </select>
        </label>

        <Input label="Reason Details" value={props.reasonText} onChange={(e) => props.setReasonText(e.target.value)} />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={props.onClose}>Cancel</Button>
          <Button onClick={props.onSubmit} disabled={props.saving}>Submit Request</Button>
        </div>
      </div>
    </Modal>
  );
}
