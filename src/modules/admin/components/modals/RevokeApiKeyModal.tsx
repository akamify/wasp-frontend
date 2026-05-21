import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";

type Props = {
  isOpen: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function RevokeApiKeyModal({ isOpen, busy, onClose, onConfirm }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Disable API key">
      <div className="space-y-3">
        <p className="text-[12px] text-slate-600">Disable this API key now?</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-10 px-4">No</Button>
          <Button disabled={busy} onClick={onConfirm} className="h-10 px-4">{busy ? "Disabling..." : "Yes, disable"}</Button>
        </div>
      </div>
    </Modal>
  );
}
