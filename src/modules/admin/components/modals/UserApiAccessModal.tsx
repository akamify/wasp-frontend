import { useEffect, useState } from "react";
import { API } from "@api/api";
import { Modal } from "@components/ui/Modal";
import { UserSecuritySection } from "@modules/admin/components/sections/UserSecuritySection";
import { UserCrmCard } from "@modules/admin/components/cards/UserCrmCard";
import { UserPermissionCard } from "@modules/admin/components/cards/UserPermissionCard";
import { ApiKeyListSection } from "@modules/admin/components/sections/ApiKeyListSection";
import { useWorkspaceExternalChatFeature } from "@modules/admin/hooks/useWorkspaceExternalChatFeature";
import type { UserApiKeyListResponse } from "@modules/admin/types/api-key.types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string | null;
  userId: string | null;
  data: UserApiKeyListResponse | null;
  busy?: boolean;
  onDisableKey: (keyId: string) => void;
  onDisableKeys?: (keyIds: string[]) => void;
  onEnableKey: (keyId: string) => void;
  onSetKeyChatAccess?: (keyId: string, enabled: boolean) => void;
  onEnableCampaignSend: () => void;
  onDisableCampaignSend: () => void;
  onEnableChat: () => void | Promise<void>;
  onDisableChat: () => void | Promise<void>;
  onBlock: () => void;
  onUnblock: () => void;
};

export function UserApiAccessModal(props: Props) {
  const {
    isOpen,
    onClose,
    workspaceId,
    userId,
    data,
    busy,
    onDisableKey,
    onDisableKeys,
    onEnableKey,
    onSetKeyChatAccess,
    onEnableCampaignSend,
    onDisableCampaignSend,
    onEnableChat,
    onDisableChat,
    onBlock,
    onUnblock,
  } = props;

  const workspaceFeature = useWorkspaceExternalChatFeature(workspaceId || null);
  const [workspace, setWorkspace] = useState<any>(null);
  const campaignSendEnabled = Boolean(workspace?.allowedApiPermissions?.campaignSend);
  const chatAccessEnabled = workspaceFeature.enabled === null ? Boolean(workspace?.allowedApiPermissions?.chatAccess) : workspaceFeature.enabled;

  useEffect(() => {
    if (!isOpen || !workspaceId) {
      setWorkspace(null);
      return;
    }
    let active = true;
    API.workspaces
      .overview(workspaceId)
      .then((res: any) => {
        if (!active) return;
        setWorkspace(res?.workspace || null);
      })
      .catch(() => {
        if (!active) return;
        setWorkspace(null);
      });
    return () => {
      active = false;
    };
  }, [isOpen, workspaceId]);

  async function toggleWorkspaceChat(next: boolean) {
    if (next) {
      await onEnableChat();
      workspaceFeature.setEnabled(true);
      return;
    }
    await onDisableChat();
    workspaceFeature.setEnabled(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workspace Access">
      <div className="space-y-3">
        <UserSecuritySection blocked={Boolean(data?.accountBlocked)} busy={busy} onBlock={onBlock} onUnblock={onUnblock} />
        <UserPermissionCard
          campaignSend={campaignSendEnabled}
          chatAccess={chatAccessEnabled}
          busy={busy || workspaceFeature.busy}
          onEnableCampaignSend={onEnableCampaignSend}
          onDisableCampaignSend={onDisableCampaignSend}
          onEnableChat={() => toggleWorkspaceChat(true)}
          onDisableChat={() => toggleWorkspaceChat(false)}
        />
        {workspaceFeature.error ? (
          <div className="rounded-[5px] border border-rose-100 bg-rose-50 p-2 text-[11px] font-bold text-rose-700">
            {workspaceFeature.error}
          </div>
        ) : null}
        {workspaceId ? <UserCrmCard workspaceId={workspaceId} busy={busy} /> : null}
        <ApiKeyListSection
          apiKeys={data?.apiKeys || []}
          busy={busy}
          onDisable={onDisableKey}
          onDisableMany={onDisableKeys}
          onEnable={onEnableKey}
          onSetChatAccess={onSetKeyChatAccess}
        />
      </div>
    </Modal>
  );
}
