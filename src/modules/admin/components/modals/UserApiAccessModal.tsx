import { useEffect, useState } from "react";
import { API } from "@api/api";
import { Modal } from "@components/ui/Modal";
import { UserSecuritySection } from "@modules/admin/components/sections/UserSecuritySection";
import { UserCrmCard } from "@modules/admin/components/cards/UserCrmCard";
import { UserExternalApiCard } from "@modules/admin/components/cards/UserExternalApiCard";
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
  onEnableCampaignSend: () => void;
  onDisableCampaignSend: () => void;
  onEnableChat: () => void;
  onDisableChat: () => void;
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

  async function toggleExternalChat(next: boolean) {
    if (!workspaceId) return;
    if (!next) {
      const ok = window.confirm(
        "Disabling External Chat API will immediately block all external CRM inbox access for this workspace. Existing API keys will remain, but chat endpoints will be denied."
      );
      if (!ok) return;
    }
    await workspaceFeature.toggle(next);
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
          onEnableChat={onEnableChat}
          onDisableChat={onDisableChat}
        />
        {workspaceId ? (
          <UserExternalApiCard
            workspaceId={workspaceId}
            busy={busy}
            enabled={workspaceFeature.enabled}
            loading={workspaceFeature.busy}
            error={workspaceFeature.error}
            onToggle={toggleExternalChat}
          />
        ) : null}
        {workspaceId ? <UserCrmCard workspaceId={workspaceId} busy={busy} /> : null}
       
      </div>
    </Modal>
  );
}
