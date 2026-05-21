import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { useToast } from "@shared/providers/ToastContext";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "analytics", label: "Analytics" },
  { key: "activity", label: "Activity" },
  { key: "login-logout", label: "Login/Logout" },
  { key: "profile-requests", label: "Profile Requests" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SuperAdminAdminDetailPage() {
  const { id = "", tab = "profile" } = useParams();
  const activeTab = (TABS.some((t) => t.key === tab) ? tab : "profile") as TabKey;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState<any>(null);
  const [allActivity, setAllActivity] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; body: string; action: () => Promise<void> } | null>(null);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [visibleActivity, setVisibleActivity] = useState(10);
  const [visibleLogin, setVisibleLogin] = useState(10);
  const [visibleRequests, setVisibleRequests] = useState(10);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res: any = await API.superAdmin.adminDetail(id);
      const found = res?.admin || null;
      setAdmin(found);
      setAllActivity(Array.isArray(res?.activity) ? res.activity : []);
      setRequests(Array.isArray(res?.requests) ? res.requests : []);
      if (!found) setError("Admin account not found");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load admin details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const loginEvents = useMemo(
    () => allActivity.filter((x) => ["auth.login.success", "auth.logout", "auth.force_logout"].includes(String(x?.action || ""))),
    [allActivity]
  );
  const actionsOnly = useMemo(
    () => allActivity.filter((x) => !["auth.login.success", "auth.logout", "auth.force_logout"].includes(String(x?.action || ""))),
    [allActivity]
  );
  const shownActivity = useMemo(() => actionsOnly.slice(0, visibleActivity), [actionsOnly, visibleActivity]);
  const shownLogin = useMemo(() => loginEvents.slice(0, visibleLogin), [loginEvents, visibleLogin]);
  const shownRequests = useMemo(() => requests.slice(0, visibleRequests), [requests, visibleRequests]);

  useEffect(() => {
    setVisibleActivity(10);
    setVisibleLogin(10);
    setVisibleRequests(10);
  }, [id, activeTab, actionsOnly.length, loginEvents.length, requests.length]);

  function onListScroll(e: React.UIEvent<HTMLDivElement>, type: "activity" | "login" | "requests") {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (!nearBottom) return;
    if (type === "activity") setVisibleActivity((p) => Math.min(p + 10, actionsOnly.length));
    if (type === "login") setVisibleLogin((p) => Math.min(p + 10, loginEvents.length));
    if (type === "requests") setVisibleRequests((p) => Math.min(p + 10, requests.length));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-[5px] border border-slate-200 bg-white p-4">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        </div>
        <TableSkeleton cols={4} rows={8} />
      </div>
    );
  }
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="space-y-4 py-4 pr-6">
      <div className="rounded-[5px] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-black text-slate-900">Admin Detail</div>
            <div className="mt-2 text-sm text-slate-600">{admin?.email || "-"}</div>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {TABS.map((t) => (
            <Link
              key={t.key}
              to={`/super-admin/admins/${id}/${t.key}`}
              className={`rounded-[5px] px-3 py-2 text-xs font-black uppercase tracking-wider ${activeTab === t.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {activeTab === "profile" ? (
        <div className="rounded-[5px] border border-slate-200 bg-white p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Name" value={String(admin?.name || "")} disabled />
            <Input label="Email" value={String(admin?.email || "")} disabled />
            <Input label="Phone" value={String(admin?.phone || "")} disabled />
            <Input label="Status" value={String(admin?.status || "active")} disabled />
            <Input label="2FA" value={admin?.twoFactorEnabled ? "Enabled" : "Disabled"} disabled />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setConfirm({ title: "Password Reset", body: "Send reset link to admin email?", action: async () => { await API.superAdmin.resetUserPassword({ userId: id }); toast("Reset link sent", "success"); } })}>
              Send Reset Link
            </Button>
            <Button onClick={() => navigate(`/super-admin/admins/${id}/edit`)}>Edit Profile</Button>
          </div>
          <div className="rounded-[5px] border border-slate-200 p-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Permissions</div>
            <div className="mt-2 grid gap-3 md:grid-cols-3 text-xs">
              <SimpleList title="Pages" items={admin?.permissions?.pages || []} />
              <SimpleList title="Components" items={admin?.permissions?.components || []} />
              <SimpleList title="Actions" items={admin?.permissions?.actions || []} />
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "analytics" ? (
        <div className="rounded-[5px] border border-slate-200 bg-white p-5 text-sm text-slate-700">
          <div className="font-black text-slate-900">Analytics Summary</div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <AnalyticsCard label="Activity Events" value={actionsOnly.length} />
            <AnalyticsCard label="Login Events" value={loginEvents.filter((x) => x?.action === "auth.login.success").length} />
            <AnalyticsCard label="Logout Events" value={loginEvents.filter((x) => x?.action !== "auth.login.success").length} />
            <AnalyticsCard label="Profile Requests" value={requests.length} />
          </div>
          <div className="mt-4 rounded border border-slate-200 p-3">
            <div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">7-Day Activity Trend</div>
            <ActivityTrendGraph items={allActivity} />
          </div>
        </div>
      ) : null}

      {activeTab === "activity" ? (
        <ListSection title="Activity" items={shownActivity} onOpen={setDetailModal} onScroll={(e) => onListScroll(e, "activity")} kind="activity" />
      ) : null}
      {activeTab === "login-logout" ? (
        <ListSection title="Login / Logout" items={shownLogin} onOpen={setDetailModal} onScroll={(e) => onListScroll(e, "login")} kind="login" />
      ) : null}
      {activeTab === "profile-requests" ? (
        <ListSection title="Profile Requests" items={shownRequests} onOpen={setDetailModal} onScroll={(e) => onListScroll(e, "requests")} kind="request" />
      ) : null}
      {activeTab === "profile-requests" ? (
        <div className="rounded-[5px] border border-slate-200 bg-white p-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Request Actions</div>
          <div className="text-xs text-slate-600">Open a request row and use Approve/Reject from detail modal.</div>
        </div>
      ) : null}

      <Modal isOpen={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title || "Confirm"} className="max-w-[720px]">
        <div className="space-y-3">
          <p className="text-sm text-slate-700">{confirm?.body}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              disabled={saving}
              onClick={async () => {
                if (!confirm) return;
                try {
                  await confirm.action();
                  setConfirm(null);
                } catch {}
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Detail" className="max-w-[980px]">
        <div className="max-h-[70vh] overflow-auto rounded-[5px] border border-slate-200 p-4 text-xs text-slate-700">
          {detailModal ? <DetailFields detail={detailModal} /> : null}
          {activeTab === "profile-requests" && detailModal ? (
            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                variant="ghost"
                onClick={async () => {
                  const note = window.prompt("Reject reason", "") || "";
                  try {
                    await API.superAdmin.decideAdminProfileRequest(id, String(detailModal?._id || ""), { decision: "rejected", reviewNote: note });
                    toast("Request rejected", "success");
                    setDetailModal(null);
                    await load();
                  } catch (e: any) {
                    toast(e?.response?.data?.message || "Failed to reject", "error");
                  }
                }}
              >
                Reject
              </Button>
              <Button
                onClick={async () => {
                  const note = window.prompt("Approval note (optional)", "") || "";
                  try {
                    await API.superAdmin.decideAdminProfileRequest(id, String(detailModal?._id || ""), { decision: "approved", reviewNote: note });
                    toast("Request approved", "success");
                    setDetailModal(null);
                    await load();
                  } catch (e: any) {
                    toast(e?.response?.data?.message || "Failed to approve", "error");
                  }
                }}
              >
                Approve
              </Button>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function ListSection({
  title,
  items,
  onOpen,
  onScroll,
  kind,
}: {
  title: string;
  items: any[];
  onOpen: (item: any) => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  kind: "activity" | "login" | "request";
}) {
  return (
    <div className="rounded-[5px] border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">{title}</div>
      <div className="max-h-[70vh] overflow-auto p-3" onScroll={onScroll}>
        {items.length ? items.map((x) => (
          <button key={String(x._id)} onClick={() => onOpen(x)} className="mb-2 w-full rounded border border-slate-200 p-3 text-left text-xs hover:bg-slate-50">
            <div className="font-bold text-slate-900">{getListTitle(x, kind)}</div>
            <div className="text-slate-600 mt-1">{getListSubTitle(x, kind)}</div>
            <div className="text-slate-600">{x.createdAt ? new Date(x.createdAt).toLocaleString("en-IN") : "-"}</div>
          </button>
        )) : <div className="text-sm text-slate-500">No data.</div>}
      </div>
    </div>
  );
}

function getListTitle(item: any, kind: "activity" | "login" | "request") {
  if (kind === "login") {
    if (item?.action === "auth.login.success") return "Login Success";
    if (item?.action === "auth.logout") return "Manual Logout";
    if (item?.action === "auth.force_logout") return "Forced Logout";
  }
  if (kind !== "request") return item?.action || "event";
  const reqType = String(item?.metadata?.requestType || "").trim();
  if (!reqType) return item?.action || "profile request";
  const map: Record<string, string> = {
    name: "Name Change Request",
    email: "Email Change Request",
    phone: "Phone Change Request",
    password_reset: "Password Reset Link Request",
    "2fa_enable": "Enable 2FA Request",
    "2fa_disable": "Disable 2FA Request",
  };
  return map[reqType] || `Request: ${reqType}`;
}

function AnalyticsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function ActivityTrendGraph({ items }: { items: any[] }) {
  const bars = useMemo(() => {
    const now = new Date();
    const days: { key: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ key, label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), count: 0 });
    }
    const map = new Map(days.map((x) => [x.key, x]));
    (items || []).forEach((e) => {
      const dt = e?.createdAt ? new Date(e.createdAt) : null;
      if (!dt || Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      const row = map.get(key);
      if (row) row.count += 1;
    });
    const max = Math.max(1, ...days.map((x) => x.count));
    return days.map((x) => ({ ...x, pct: Math.round((x.count / max) * 100) }));
  }, [items]);

  return (
    <div className="grid grid-cols-7 gap-2 items-end h-36">
      {bars.map((b) => (
        <div key={b.key} className="flex flex-col items-center gap-1">
          <div className="text-[10px] font-bold text-slate-500">{b.count}</div>
          <div className="w-full rounded bg-slate-100 h-24 flex items-end">
            <div className="w-full rounded bg-brand-500" style={{ height: `${Math.max(6, b.pct)}%` }} />
          </div>
          <div className="text-[10px] text-slate-500">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

function getListSubTitle(item: any, kind: "activity" | "login" | "request") {
  if (kind !== "request") return "";
  const status = String(item?.metadata?.status || "pending");
  const reason = String(item?.metadata?.reason || "").trim();
  return `Status: ${status}${reason ? ` | Reason: ${reason}` : ""}`;
}

function SimpleList({ title, items }: { title: string; items: string[] }) {
  const uniq = Array.from(new Set(items || []));
  return (
    <div className="rounded border border-slate-200 p-2">
      <div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{title}</div>
      <div className="space-y-1">
        {uniq.map((item) => <div key={item} className="rounded bg-slate-50 px-2 py-1">{item}</div>)}
        {!uniq.length ? <div className="text-xs text-slate-400">No items</div> : null}
      </div>
    </div>
  );
}

function DetailFields({ detail }: { detail: any }) {
  const rows = [
    ["Action", String(detail?.action || "-")],
    ["Status", String(detail?.status || detail?.metadata?.status || "-")],
    ["Reason", String(detail?.reason || detail?.metadata?.reason || "-")],
    ["Review Note", String(detail?.reviewNote || detail?.metadata?.reviewNote || "-")],
    ["Actor Id", String(detail?.actorId || "-")],
    ["Target Id", String(detail?.targetId || "-")],
    ["Resource Type", String(detail?.resourceType || detail?.metadata?.resourceType || "-")],
    ["Resource Id", String(detail?.resourceId || detail?.metadata?.resourceId || "-")],
    ["IP", String(detail?.ip || "-")],
    ["Location", String(detail?.location || "-")],
    ["User Agent", String(detail?.userAgent || "-")],
    ["Created At", detail?.createdAt ? new Date(detail.createdAt).toLocaleString("en-IN") : "-"],
    ["Updated At", detail?.updatedAt ? new Date(detail.updatedAt).toLocaleString("en-IN") : "-"],
  ];

  const requestedChangesObj =
    detail?.requestedChanges && typeof detail.requestedChanges === "object"
      ? detail.requestedChanges
      : detail?.metadata?.requestedChanges && typeof detail.metadata.requestedChanges === "object"
      ? detail.metadata.requestedChanges
      : null;
  const requestedChanges = requestedChangesObj
    ? Object.entries(requestedChangesObj).map(([k, v]) => `${k}: ${String(v || "")}`).filter(Boolean).join(", ")
    : "";
  const requestType = String(detail?.metadata?.requestType || "").trim();
  const requestTypeLabel =
    requestType === "name"
      ? "Name Change"
      : requestType === "email"
      ? "Email Change"
      : requestType === "phone"
      ? "Phone Change"
      : requestType === "password_reset"
      ? "Password Reset Link"
      : requestType === "2fa_enable"
      ? "Enable 2FA"
      : requestType === "2fa_disable"
      ? "Disable 2FA"
      : "";

  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[160px_1fr] gap-3 border-b border-slate-100 pb-2">
          <div className="font-black text-slate-500">{k}</div>
          <div className="break-all text-slate-800">{v}</div>
        </div>
      ))}
      {requestedChanges ? (
        <div className="grid grid-cols-[160px_1fr] gap-3 border-b border-slate-100 pb-2">
          <div className="font-black text-slate-500">Requested Changes</div>
          <div className="break-all text-slate-800">{requestedChanges}</div>
        </div>
      ) : null}
      {requestTypeLabel ? (
        <div className="grid grid-cols-[160px_1fr] gap-3 border-b border-slate-100 pb-2">
          <div className="font-black text-slate-500">Request Type</div>
          <div className="break-all text-slate-800">{requestTypeLabel}</div>
        </div>
      ) : null}
    </div>
  );
}
