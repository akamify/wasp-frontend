import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";
import { cn } from "@shared/utils/cn";
import { inr } from "./shared";

type AdminWorkspaceAction = "activate" | "block" | "delete";

function SummaryCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <div className="rounded-[5px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-[5px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value || "all"}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionMenu({
  open,
  onToggle,
  onAction,
  loadingAction,
}: {
  open: boolean;
  onToggle: () => void;
  onAction: (action: AdminWorkspaceAction) => void;
  loadingAction: string;
}) {
  return (
    <div className="relative flex justify-end">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 border-slate-200"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <MoreHorizontal size={16} />
      </Button>
      {open ? (
        <div
          className="absolute right-0 top-11 z-30 min-w-[190px] rounded-[8px] border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-[5px] px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => onAction("activate")}
          >
            <ShieldCheck size={15} />
            {loadingAction === "activate" ? "Activating..." : "Activate Workspace"}
          </button>
          <button
            type="button"
            className="mt-1 flex w-full items-center gap-2 rounded-[5px] px-3 py-2 text-left text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
            onClick={() => onAction("block")}
          >
            <ShieldAlert size={15} />
            {loadingAction === "block" ? "Blocking..." : "Block Workspace"}
          </button>
          <button
            type="button"
            className="mt-1 flex w-full items-center gap-2 rounded-[5px] px-3 py-2 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            onClick={() => onAction("delete")}
          >
            <Trash2 size={15} />
            {loadingAction === "delete" ? "Deleting..." : "Delete Plan"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ActionConfirmDialog({
  item,
  action,
  loading,
  onCancel,
  onConfirm,
}: {
  item: any;
  action: AdminWorkspaceAction;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const config =
    action === "activate"
      ? {
          title: "Activate Workspace Plan",
          tone: "emerald",
          body: "Latest eligible plan access will be restored and the workspace will become active again.",
          confirmLabel: "Activate Now",
        }
      : action === "block"
        ? {
            title: "Block Workspace",
            tone: "amber",
            body: "This will suspend workspace access at platform level. Billing history will stay preserved.",
            confirmLabel: "Block Workspace",
          }
        : {
            title: "Delete Plan Assignment",
            tone: "rose",
            body: "Current plan assignment will be removed, auto-renew access will be stopped, and the workspace will reset to free.",
            confirmLabel: "Delete Assignment",
          };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-lg rounded-[10px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Confirm Action</div>
            <h3 className="mt-2 text-xl font-black text-slate-900">{config.title}</h3>
          </div>
          <Badge
            className={cn(
              "border",
              config.tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-700",
              config.tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
              config.tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700"
            )}
          >
            {action.toUpperCase()}
          </Badge>
        </div>

        <div className="mt-5 rounded-[8px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">{item?.name || "Workspace"}</div>
          <div className="mt-1 text-xs text-slate-500">{item?.owner?.email || "-"}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="bg-slate-900 text-white">{item?.subscription?.planName || item?.plan || "Free"}</Badge>
            <Badge className="bg-slate-100 text-slate-700">{item?.workspaceStatus || "active"}</Badge>
            <Badge className="bg-slate-100 text-slate-700">{item?.subscription?.subscriptionStatus || "no subscription"}</Badge>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{config.body}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={action === "delete" ? "danger" : action === "block" ? "outline" : "primary"}
            className={cn(action === "block" && "border-amber-200 text-amber-700 hover:bg-amber-50")}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Please wait..." : config.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionsList() {
  const [summary, setSummary] = useState<{ plan: string; count: number }[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState("");
  const [autoRenewFilter, setAutoRenewFilter] = useState("");
  const [billingModeFilter, setBillingModeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [openActionMenuId, setOpenActionMenuId] = useState("");
  const [pendingAction, setPendingAction] = useState<{ item: any; action: AdminWorkspaceAction } | null>(null);
  const menuRootRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isSuperAdmin = String(user?.role || "") === "super_admin" && location.pathname.startsWith("/super-admin");
  const base = isSuperAdmin ? "/super-admin/subscriptions-data" : "/admin/subscriptions-data";

  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin
        .subscriptionsData({
          ...params,
          planId: planFilter || undefined,
          status: statusFilter || undefined,
          workspaceStatus: workspaceStatusFilter || undefined,
          autoRenew: autoRenewFilter || undefined,
          billingMode: billingModeFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
        .then((response: any) => {
          const data = response?.data || {};
          const pagination = data?.pagination || {};
          setSummary(Array.isArray(data?.summary) ? data.summary : []);
          setAnalytics(data?.analytics || null);
          return {
            items: data?.items || [],
            total: Number(pagination.total || 0),
            page: Number(pagination.page || params.page),
            limit: Number(pagination.limit || params.limit),
            totalPages: Number(pagination.totalPages || 1),
          };
        }),
    [planFilter, statusFilter, workspaceStatusFilter, autoRenewFilter, billingModeFilter, dateFrom, dateTo]
  );
  const list = useAdminList<any>({ fetcher, initialLimit: 25 });

  useEffect(() => {
    if (!openActionMenuId) return;
    const handleOutside = (event: MouseEvent) => {
      if (!menuRootRef.current) return;
      if (!menuRootRef.current.contains(event.target as Node)) {
        setOpenActionMenuId("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openActionMenuId]);

  const planOptions = useMemo(
    () =>
      [{ value: "", label: "All plans" }].concat(
        summary.map((entry) => ({ value: entry.plan, label: `${String(entry.plan || "").toUpperCase()} (${entry.count})` }))
      ),
    [summary]
  );

  async function submitSuperAdminAction() {
    if (!pendingAction) return;
    const workspaceId = String(pendingAction.item?.id || "");
    const action = pendingAction.action;
    setActionLoadingId(`${workspaceId}:${action}`);
    try {
      if (action === "activate") {
        await API.superAdmin.activateWorkspacePlan(workspaceId, { reason: "Activated from subscriptions list" });
        toast("Workspace plan activated", "success");
      } else if (action === "block") {
        await API.superAdmin.blockWorkspacePlan(workspaceId, { reason: "Blocked from subscriptions list" });
        toast("Workspace blocked", "success");
      } else {
        await API.superAdmin.deleteWorkspacePlanAssignment(workspaceId, { reason: "Assignment removed from subscriptions list" });
        toast("Workspace plan assignment removed", "success");
      }
      setPendingAction(null);
      setOpenActionMenuId("");
      list.refresh();
    } catch (error: any) {
      toast(error?.response?.data?.message || "Action failed", "error");
    } finally {
      setActionLoadingId("");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:p-8">
      <AdminToolbar
        title="Subscription Data"
        subtitle="Workspace subscriptions with billing state, AI eligibility, and super admin controls."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Matched Workspaces" value={analytics?.totalWorkspaces || 0} helper="Current filtered results" />
        <SummaryCard label="Active Plans" value={analytics?.activeSubscriptions || 0} helper="Latest active subscriptions" />
        <SummaryCard label="Blocked Workspaces" value={analytics?.blockedWorkspaces || 0} helper="Suspended workspace status" />
        <SummaryCard label="Visible Revenue" value={inr(analytics?.totalRevenuePaise || 0)} helper="Latest payable values in current view" />
      </div>

      <div className="rounded-[5px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-12">
          <div className="xl:col-span-2">
            <FilterSelect label="Plan" value={planFilter} onChange={setPlanFilter} options={planOptions} />
          </div>
          <div className="xl:col-span-2">
            <FilterSelect
              label="Subscription"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "cancelled", label: "Cancelled" },
                { value: "expired", label: "Expired" },
                { value: "past_due", label: "Past Due" },
                { value: "payment_due", label: "Payment Due" },
              ]}
            />
          </div>
          <div className="xl:col-span-2">
            <FilterSelect
              label="Workspace"
              value={workspaceStatusFilter}
              onChange={setWorkspaceStatusFilter}
              options={[
                { value: "", label: "All workspaces" },
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
              ]}
            />
          </div>
          <div className="xl:col-span-2">
            <FilterSelect
              label="Auto Renew"
              value={autoRenewFilter}
              onChange={setAutoRenewFilter}
              options={[
                { value: "", label: "All modes" },
                { value: "enabled", label: "Enabled" },
                { value: "disabled", label: "Disabled" },
              ]}
            />
          </div>
          <div className="xl:col-span-2">
            <FilterSelect
              label="Billing"
              value={billingModeFilter}
              onChange={setBillingModeFilter}
              options={[
                { value: "", label: "All billing" },
                { value: "manual", label: "Manual" },
                { value: "razorpay", label: "Razorpay" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 xl:col-span-2">
            <Input label="From" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <Input label="To" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
        </div>
      </div>

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {summary.length ? (
        <div className="flex flex-wrap gap-2">
          {summary.map((entry) => (
            <Badge key={entry.plan} className="text-[10px] font-black uppercase tracking-widest">
              {entry.plan}: {entry.count}
            </Badge>
          ))}
        </div>
      ) : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={isSuperAdmin ? 11 : 10} rows={10} />
      ) : (
        <>
          <div ref={menuRootRef}>
            <AdminTable
              columns={[
                { key: "workspace", label: "Workspace" },
                { key: "owner", label: "Owner" },
                { key: "plan", label: "Plan" },
                { key: "subscription", label: "Subscription" },
                { key: "workspaceStatus", label: "Workspace Status" },
                { key: "billing", label: "Billing" },
                { key: "autoRenew", label: "Auto Renew" },
                { key: "ai", label: "AI Eligibility" },
                { key: "validUntil", label: "Valid Until" },
                { key: "amount", label: "Amount" },
                ...(isSuperAdmin ? [{ key: "actions", label: "Actions", className: "text-right" }] : []),
              ]}
            >
              {list.items.length ? (
                list.items.map((workspace: any) => {
                  const subscription = workspace.subscription || {};
                  const ai = workspace.aiDiagnostics || {};
                  const actionKeyPrefix = `${workspace.id}:`;
                  return (
                    <tr key={workspace.id} className="cursor-pointer align-top hover:bg-slate-50" onClick={() => navigate(`${base}/${workspace.id}`)}>
                      <td className="px-6 py-4">
                        <div className="min-w-[180px]">
                          <div className="truncate text-sm font-bold text-slate-900">{workspace.name}</div>
                          <div className="mt-1 break-all text-[11px] text-slate-500">{workspace.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-[180px]">
                          <div className="truncate text-sm font-semibold text-slate-800">{workspace.owner?.email || "-"}</div>
                          <div className="mt-1 text-[11px] text-slate-500">{workspace.owner?.name || "No owner name"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-[150px]">
                          <div className="text-sm font-semibold text-slate-800">{subscription.planName || workspace.plan || "-"}</div>
                          <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{subscription.planSlug || workspace.plan || "-"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-slate-600">{subscription.subscriptionStatus || "-"}</td>
                      <td className="px-6 py-4">
                        <Badge className={workspace.workspaceStatus === "suspended" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}>
                          {workspace.workspaceStatus || "active"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-700">{subscription.paymentMode || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-700">{subscription.autoRenewEnabled ? "Enabled" : "Disabled"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn("text-xs font-black uppercase", ai.aiFeatureEligible ? "text-emerald-700" : "text-rose-700")}>
                          {ai.aiFeatureEligible ? "Eligible" : "Blocked"}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">{ai.aiBlockedReason || "ready"}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {subscription.validUntil ? new Date(subscription.validUntil).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{inr(subscription.payableAmountPaise)}</td>
                      {isSuperAdmin ? (
                        <td className="px-6 py-4">
                          <ActionMenu
                            open={openActionMenuId === workspace.id}
                            onToggle={() => setOpenActionMenuId((current) => (current === workspace.id ? "" : workspace.id))}
                            loadingAction={
                              actionLoadingId === `${actionKeyPrefix}activate`
                                ? "activate"
                                : actionLoadingId === `${actionKeyPrefix}block`
                                  ? "block"
                                  : actionLoadingId === `${actionKeyPrefix}delete`
                                    ? "delete"
                                    : ""
                            }
                            onAction={(action) => {
                              setPendingAction({ item: workspace, action });
                              setOpenActionMenuId("");
                            }}
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={isSuperAdmin ? 11 : 10}>
                    No subscription data available.
                  </td>
                </tr>
              )}
            </AdminTable>
          </div>
          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}

      {pendingAction ? (
        <ActionConfirmDialog
          item={pendingAction.item}
          action={pendingAction.action}
          loading={actionLoadingId === `${pendingAction.item?.id}:${pendingAction.action}`}
          onCancel={() => {
            if (actionLoadingId) return;
            setPendingAction(null);
          }}
          onConfirm={() => void submitSuperAdminAction()}
        />
      ) : null}
    </div>
  );
}
