import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";

type Props = {
  isOpen: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function BlockUserModal({ isOpen, busy, onClose, onConfirm }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm user block">
      <div className="space-y-3">
        <p className="text-[12px] text-slate-600">This will block login, JWT access, and API-key access immediately.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-10 px-4">No</Button>
          <Button disabled={busy} onClick={onConfirm} className="h-10 px-4">{busy ? "Blocking..." : "Yes, block user"}</Button>
        </div>
      </div>
    </Modal>
  );
}
