import { Modal } from "@components/ui/Modal";
import { ApiKeyListSection } from "@modules/admin/components/sections/ApiKeyListSection";
import type { UserApiKey } from "@modules/admin/types/api-key.types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: UserApiKey[];
  busy?: boolean;
  onDisable: (keyId: string) => void;
  onEnable: (keyId: string) => void;
};

export function ApiKeyManagementModal({ isOpen, onClose, apiKeys, busy, onDisable, onEnable }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="API Key Management">
      <ApiKeyListSection
        apiKeys={apiKeys}
        busy={busy}
        onDisable={onDisable}
        onEnable={onEnable}
      />
    </Modal>
  );
}
