import { useState } from "react";
import { Modal } from "@components/ui/Modal";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";

type Props = {
  isOpen: boolean;
  busy?: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
};

export function ChatAccessOtpModal({ isOpen, busy, onClose, onVerify }: Props) {
  const [otp, setOtp] = useState("");
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify OTP">
      <div className="space-y-3">
        <Input label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-10 px-4">Cancel</Button>
          <Button disabled={busy || !/^\d{6}$/.test(otp)} onClick={() => onVerify(otp)} className="h-10 px-4">
            {busy ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
