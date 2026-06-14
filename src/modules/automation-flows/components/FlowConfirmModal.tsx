import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";

interface FlowConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function FlowConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  danger,
  busy,
  onClose,
  onConfirm,
}: Readonly<FlowConfirmModalProps>) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-lg">
      <p className="text-sm font-medium leading-6 text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={() => void onConfirm()}
          disabled={busy}
        >
          {busy ? "Working..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
