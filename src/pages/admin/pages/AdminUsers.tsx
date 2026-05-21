import { useCallback, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { Mail, Phone, ShieldCheck, Calendar, Briefcase, Ban, Copy, Check } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { useToast } from "@shared/providers/ToastContext";
import { useUserApiKeys } from "@modules/admin/hooks/useUserApiKeys";
import { useApiKeyActions } from "@modules/admin/hooks/useApiKeyActions";
import { useChatAccess } from "@modules/admin/hooks/useChatAccess";
import { UserApiAccessModal } from "@modules/admin/components/modals/UserApiAccessModal";
import { BlockUserModal } from "@modules/admin/components/modals/BlockUserModal";

type Item = any;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string; filter?: string; sort?: string }) =>
      API.admin.users(params).then((r: any) => ({
        items: r.items || [],
        total: Number(r.total || 0),
        page: Number(r.page || params.page),
        limit: Number(r.limit || params.limit),
        totalPages: Number(r.totalPages || 1),
      })),
    []
  );

  const list = useAdminList<Item>({ 
    fetcher, 
    initialLimit: 25,
    initialFilter: "all",
    initialSort: "recent"
  });

  const [selected, setSelected] = useState<Item | null>(null);
  const [copiedWorkspaceId, setCopiedWorkspaceId] = useState("");
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const apiKeys = useUserApiKeys();
  const apiActions = useApiKeyActions();
  const chatAccess = useChatAccess();

  const selectedId = selected?.id;

  function pick(u: any) {
    setSelected(u);
  }

  async function copyWorkspaceId(value?: string) {
    const text = String(value || "").trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedWorkspaceId(text);
    toast("Workspace ID copied", "success");
    window.setTimeout(() => setCopiedWorkspaceId(""), 1200);
  }

  async function openApiAccess() {
    if (!selectedId) return;
    try {
      await apiKeys.load(selectedId);
      setApiModalOpen(true);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load API access", "error");
    }
  }

  async function refreshAccess() {
    if (!selectedId) return;
    await apiKeys.load(selectedId);
    list.refresh();
  }

  async function toggleCampaignSend(enabled: boolean) {
    if (!selectedId) return;
    try {
      if (enabled) await chatAccess.enableCampaignSend(selectedId);
      else await chatAccess.disableCampaignSend(selectedId);
      await refreshAccess();
      toast(`Campaign send ${enabled ? "enabled" : "disabled"}`, "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed", "error");
    }
  }

  async function toggleChatAccess(enabled: boolean) {
    if (!selectedId) return;
    try {
      if (enabled) await chatAccess.enableChat(selectedId);
      else await chatAccess.disableChat(selectedId);
      await refreshAccess();
      toast(`Chat access ${enabled ? "enabled" : "disabled"}`, "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed", "error");
    }
  }

  async function disableApiKeys(keyIds: string[]) {
    if (!selectedId || !keyIds.length) return;
    if (!window.confirm(`Disable ${keyIds.length} active API key(s)?`)) return;
    try {
      for (const keyId of keyIds) {
        await apiActions.disableKey(selectedId, keyId);
      }
      await refreshAccess();
      toast("Active API keys disabled", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="User Management"
        subtitle="Manage and monitor all platform users and their workspaces."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        filterOptions={[
          { label: "All Users", value: "all" },
          { label: "Blocked", value: "blocked" },
          { label: "Active", value: "active" },
        ]}
        currentFilter={list.filter}
        onFilterChange={list.setFilter}
        sortOptions={[
          { label: "Newest", value: "recent" },
          { label: "Oldest", value: "old" },
          { label: "A-Z", value: "az" },
        ]}
        currentSort={list.sort}
        onSortChange={list.setSort}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={6} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "user", label: "User Info" },
              { key: "phone", label: "Contact" },
              { key: "role", label: "Permission" },
              { key: "workspace", label: "Workspace" },
              { key: "plan", label: "Subscription" },
              { key: "createdAt", label: "Joined" },
            ]}
          >
            {list.items.length ? (
              list.items.map((u: any) => (
                <tr
                  key={u.id}
                  className={cn(
                    "group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer",
                    u.id === selectedId ? "bg-brand-50/50" : ""
                  )}
                  onClick={() => pick(u)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-600 font-black text-sm group-hover:scale-110 transition-transform">
                        {u.name?.[0] || u.email?.[0] || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                          {u.name || "Unnamed User"}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1">
                          <Mail size={10} /> {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      {u.phone || "No phone"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest",
                      "bg-blue-100 text-blue-700"
                    )}>
                      <ShieldCheck size={10} />
                      user
                    </div>
                    {Boolean(u.accountBlocked) ? (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-100">
                        <Ban size={10} /> blocked
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                       <Briefcase size={12} className="text-slate-400" />
                       <AdminTruncate text={u.workspace?.name || "N/A"} max={24} />
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-[4px] bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                      <span className="uppercase tracking-wider text-slate-400">ID</span>
                      <span>{u.workspace?.id || "-"}</span>
                      {u.workspace?.id ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void copyWorkspaceId(u.workspace.id);
                          }}
                          className="rounded p-0.5 text-slate-500 hover:bg-slate-200"
                          title={copiedWorkspaceId === u.workspace.id ? "Copied" : "Copy"}
                        >
                          {copiedWorkspaceId === u.workspace.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 rounded-[4px] text-[10px] font-black uppercase tracking-widest border border-brand-100">
                      {u.workspace?.plan || "FREE"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={6}>
                  No users found matching your search criteria.
                </td>
              </tr>
            )}
          </AdminTable>

          <AdminPagination
            page={list.page}
            totalPages={list.totalPages}
            total={list.total}
            onPageChange={list.setPage}
          />
        </>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="User Details">
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-black text-slate-900">{selected.name || "Unnamed User"}</div>
              <div className="mt-1 text-[11px] font-semibold text-slate-600">{selected.email}</div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Status</div>
              <div className="text-[11px] font-semibold text-slate-500">
                Current: {selected.accountBlocked ? "blocked" : "active"}. Blocked users can't login or use API keys.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={openApiAccess} className="h-11 px-5">
                Access
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <UserApiAccessModal
        isOpen={apiModalOpen}
        onClose={() => setApiModalOpen(false)}
        workspaceId={selected?.workspace?.id || null}
        userId={selectedId || null}
        data={apiKeys.data}
        busy={apiActions.busy || chatAccess.busy}
        onEnableCampaignSend={() => toggleCampaignSend(true)}
        onDisableCampaignSend={() => toggleCampaignSend(false)}
        onEnableChat={() => toggleChatAccess(true)}
        onDisableChat={() => toggleChatAccess(false)}
        onDisableKey={(keyId) => disableApiKeys([keyId])}
        onDisableKeys={disableApiKeys}
        onEnableKey={async (keyId) => {
          if (!selectedId) return;
          try {
            await apiActions.enableKey(selectedId, keyId);
            await refreshAccess();
            toast("API key enabled", "success");
          } catch (e: any) {
            toast(e?.response?.data?.message || "Failed", "error");
          }
        }}
        onBlock={() => setBlockModalOpen(true)}
        onUnblock={async () => {
          if (!selectedId) return;
          try {
            await API.admin.unblockUser(selectedId);
            await refreshAccess();
            setSelected((prev: any) => (prev ? { ...prev, accountBlocked: false } : null));
            toast("User unblocked", "success");
          } catch (e: any) {
            toast(e?.response?.data?.message || "Failed", "error");
          }
        }}
      />

      <BlockUserModal
        isOpen={blockModalOpen}
        busy={chatAccess.busy}
        onClose={() => setBlockModalOpen(false)}
        onConfirm={async () => {
          if (!selectedId) return;
          try {
            await API.admin.blockUser(selectedId);
            await refreshAccess();
            setBlockModalOpen(false);
            setSelected((prev: any) => (prev ? { ...prev, accountBlocked: true } : null));
            toast("User blocked", "success");
          } catch (e: any) {
            toast(e?.response?.data?.message || "Failed", "error");
          }
        }}
      />

    </div>
  );
}
