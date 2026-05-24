import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { cn } from "@shared/utils/cn";
import { AssignLeadModal } from "@modules/crm/components/AssignLeadModal";

type Employee = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "ACTIVE" | "BLOCKED" | "DISABLED" | "DELETED";
  assignedChatsCount: number;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
};

type ProfileRes = {
  success: boolean;
  employee: Employee;
  metrics: {
    leadsAssigned: { total: number; today: number; last7Days: number };
    leadsOpen?: { total: number };
    leadsClosed?: { total: number };
    conversationsAssigned?: { total: number };
    series?: {
      assignedLast7Days?: { day: string; count: number }[];
      closedLast7Days?: { day: string; count: number }[];
    };
  };
};

type LeadItem = {
  id: string;
  phone: string;
  status: string;
  assignedAt?: string | null;
  lastInboundAt?: string | null;
  firstInboundAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type PagedRes<T> = { success: boolean; items: T[]; total: number; page: number; limit: number };

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function StatusBadge({ status }: { status: Employee["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] px-2 py-1 text-[10px] font-black uppercase tracking-widest border",
        status === "ACTIVE"
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : status === "BLOCKED"
            ? "bg-rose-50 text-rose-700 border-rose-100"
            : "bg-slate-50 text-slate-700 border-slate-200"
      )}
    >
      {status}
    </span>
  );
}

function MiniBarChart({ title, series }: { title: string; series: { day: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((s) => Number(s.count || 0)));
  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</div>
      <div className="mt-3 grid grid-cols-7 gap-1 items-end h-[64px]">
        {series.map((s) => {
          const h = Math.round((Number(s.count || 0) / max) * 64);
          return (
            <div key={s.day} className="flex flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-[4px] bg-slate-900/80"
                style={{ height: `${Math.max(2, h)}px` }}
                title={`${s.day}: ${s.count}`}
              />
              <div className="text-[9px] font-bold text-slate-400">{String(s.day || "").slice(8, 10)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type TabKey = "overview" | "leads" | "analytics" | "activities" | "sessions";
// Owner-only request approvals live here (employee submits via employee panel).
// Keep this surface in one place to avoid confusing scattered controls.
type OwnerTabKey = TabKey | "requests";

function Tabs({ value, onChange }: { value: OwnerTabKey; onChange: (v: OwnerTabKey) => void }) {
  const items: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "leads", label: "Leads" },
    { key: "analytics", label: "Analytics" },
    { key: "activities", label: "Activities" },
    { key: "sessions", label: "Login/Logout" },
  ];
  const ownerItems: { key: OwnerTabKey; label: string }[] = [...items, { key: "requests", label: "Requests" }];
  return (
    <div className="flex flex-wrap gap-2">
      {ownerItems.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "h-9 px-3 rounded-[5px] border text-[12px] font-black uppercase tracking-widest",
            value === t.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function CrmEmployeeProfilePage() {
  const params = useParams();
  const employeeId = String(params.employeeId || "").trim();
  const navigate = useNavigate();

  const [tab, setTab] = useState<OwnerTabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRes | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", role: "employee", email: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmBody, setConfirmBody] = useState("");
  const [confirmCta, setConfirmCta] = useState("Confirm");
  const [confirmVariant, setConfirmVariant] = useState<"primary" | "danger">("primary");
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetMode, setResetMode] = useState<"link" | "direct">("link");
  const [resetPwd, setResetPwd] = useState("");
  const [resetPwd2, setResetPwd2] = useState("");

  const [leadsRange, setLeadsRange] = useState<"all" | "today" | "7d">("all");
  const [leads, setLeads] = useState<PagedRes<LeadItem> | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [leadMultiSelected, setLeadMultiSelected] = useState<Record<string, boolean>>({});
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferPhones, setTransferPhones] = useState<string[]>([]);
  const [employeesForTransfer, setEmployeesForTransfer] = useState<any[]>([]);
  const [activities, setActivities] = useState<PagedRes<any> | null>(null);
  const [sessions, setSessions] = useState<PagedRes<any> | null>(null);
  const [requests, setRequests] = useState<{ id: string; createdAt?: string; metadata: any }[] | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ id: string; createdAt?: string; metadata: any } | null>(null);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  async function reloadProfile() {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const res: ProfileRes = await API.crm.employeeProfile(employeeId);
      setProfile(res);
      setEditForm({
        name: res?.employee?.name || "",
        role: res?.employee?.role || "employee",
        email: res?.employee?.email || "",
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load employee profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const employee = profile?.employee || null;

  function openConfirm(opts: {
    title: string;
    body: string;
    cta?: string;
    variant?: "primary" | "danger";
    action: () => Promise<void>;
  }) {
    setConfirmTitle(opts.title);
    setConfirmBody(opts.body);
    setConfirmCta(opts.cta || "Confirm");
    setConfirmVariant(opts.variant || "primary");
    setConfirmAction(() => opts.action);
    setConfirmOpen(true);
  }

  async function updateStatus(next: Employee["status"]) {
    if (!employeeId) return;
    openConfirm({
      title: "Confirm",
      body: next === "DELETED"
        ? "Fire/Delete is permanent. This employee email cannot be reused again for this workspace. Continue?"
        : `Set employee status to ${next}?`,
      cta: next === "DELETED" ? "Fire (Delete)" : "Confirm",
      variant: next === "DELETED" ? "danger" : "primary",
      action: async () => {
        setConfirmOpen(false);
        setBusy(true);
        setError(null);
        try {
          await API.crm.updateEmployeeStatus(employeeId, next);
          await reloadProfile();
        } catch (e: any) {
          setError(e?.response?.data?.message || "Failed");
        } finally {
          setBusy(false);
        }
      },
    });
  }

  async function updateStatusImmediate(next: Employee["status"]) {
    // kept for internal usage if needed
    setBusy(true);
    setError(null);
    try {
      await API.crm.updateEmployeeStatus(employeeId, next);
      await reloadProfile();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfileEdit() {
    if (!employeeId) return;
    setBusy(true);
    setError(null);
    try {
      await API.crm.updateEmployeeProfile(employeeId, { ...editForm });
      setEditOpen(false);
      await reloadProfile();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setBusy(false);
    }
  }

  async function loadLeads() {
    if (!employeeId) return;
    setBusy(true);
    setError(null);
    try {
      const res: PagedRes<LeadItem> = await API.crm.employeeLeads(employeeId, { range: leadsRange, page: 1, limit: 25 });
      setLeads(res);
      setLeadMultiSelected({});
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load leads");
    } finally {
      setBusy(false);
    }
  }

  async function ensureEmployeesForTransferLoaded() {
    if (employeesForTransfer.length) return;
    try {
      const res: any = await API.crm.employees();
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      const currentId = String(employeeId || "");
      setEmployeesForTransfer(items.filter((e: any) => String(e?.id || "") !== currentId));
    } catch {
      // ignore
    }
  }

  async function loadActivities() {
    if (!employeeId) return;
    setBusy(true);
    setError(null);
    try {
      const res: PagedRes<any> = await API.crm.employeeActivities(employeeId, { page: 1, limit: 25 });
      setActivities(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load activities");
    } finally {
      setBusy(false);
    }
  }

  async function loadSessions() {
    if (!employeeId) return;
    setBusy(true);
    setError(null);
    try {
      const res: PagedRes<any> = await API.crm.employeeSessions(employeeId, { page: 1, limit: 25 });
      setSessions(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load login/logout events");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (tab === "leads") void loadLeads();
    if (tab === "activities") void loadActivities();
    if (tab === "sessions") void loadSessions();
    if (tab === "requests") void loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, leadsRange, employeeId]);

  const metrics = profile?.metrics;
  const leadCounts = metrics?.leadsAssigned;
  const openLeads = metrics?.leadsOpen?.total ?? 0;
  const closedLeads = metrics?.leadsClosed?.total ?? 0;
  const convAssigned = metrics?.conversationsAssigned?.total ?? 0;
  const assignedSeries = Array.isArray(metrics?.series?.assignedLast7Days) ? metrics?.series?.assignedLast7Days! : [];
  const closedSeries = Array.isArray(metrics?.series?.closedLast7Days) ? metrics?.series?.closedLast7Days! : [];

  const title = useMemo(() => (employee ? employee.name || employee.email : "Employee"), [employee]);

  const selectedLeadPhones = useMemo(
    () => Object.keys(leadMultiSelected || {}).filter((p) => leadMultiSelected[p]),
    [leadMultiSelected]
  );
  const selectedLeadsCount = selectedLeadPhones.length;
  const someLeadsSelected = selectedLeadsCount > 0;
  const leadsItems = leads?.items || [];
  const allLeadsSelected = leadsItems.length > 0 && leadsItems.every((l) => !!leadMultiSelected[l.phone]);

  async function sendResetLink() {
    if (!employeeId) return;
    openConfirm({
      title: "Send Reset Link",
      body: "Send password reset link to employee email?",
      cta: "Send Link",
      variant: "primary",
      action: async () => {
        setConfirmOpen(false);
        setBusy(true);
        setError(null);
        try {
          await API.crm.sendEmployeeResetLink(employeeId);
        } catch (e: any) {
          setError(e?.response?.data?.message || "Failed to send reset link");
        } finally {
          setBusy(false);
        }
      },
    });
  }

  async function resetPasswordDirect(pwd: string) {
    if (!employeeId) return;
    setBusy(true);
    setError(null);
    try {
      await API.crm.resetEmployeePassword(employeeId, { newPassword: pwd });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  async function loadRequests() {
    if (!employeeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await API.crm.employeeRequests({ employeeId });
      setRequests(Array.isArray(res?.items) ? res.items : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load requests");
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: "approved" | "rejected") {
    if (!selectedRequest) return;
    if (!window.confirm(`${decision.toUpperCase()} this request?`)) return;
    setDecisionBusy(true);
    setError(null);
    try {
      const payload: any = { decision, reviewNote };
      const rt = String(selectedRequest?.metadata?.requestType || "");
      if (decision === "approved" && rt === "password_reset" && newPassword.trim()) payload.newPassword = newPassword.trim();
      await API.crm.decideEmployeeRequest(selectedRequest.id, payload);
      setRequestOpen(false);
      setSelectedRequest(null);
      setReviewNote("");
      setNewPassword("");
      setEmailOtp("");
      await loadRequests();
      await reloadProfile();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to decide");
    } finally {
      setDecisionBusy(false);
    }
  }

  async function verifyEmailOtp() {
    if (!employeeId) return;
    const otp = String(emailOtp || "").trim();
    if (!otp) return;
    setDecisionBusy(true);
    setError(null);
    try {
      await API.crm.verifyEmployeeEmailOtp(employeeId, { otp });
      setEmailOtp("");
      await reloadProfile();
    } catch (e: any) {
      setError(e?.response?.data?.message || "OTP verification failed");
    } finally {
      setDecisionBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tighter text-slate-900 truncate">{loading ? "Loading..." : title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {employee ? <StatusBadge status={employee.status} /> : null}
            {employee ? <span className="text-xs font-semibold text-slate-600">{employee.email}</span> : null}
          </div>
        </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate("/app/crm/employees")} disabled={busy}>
          Back
        </Button>
        <Button onClick={() => setEditOpen(true)} disabled={busy || loading}>
          Edit Profile
        </Button>
      </div>
    </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card className="p-4 border-slate-200 shadow-sm rounded-[5px]">
        <Tabs value={tab} onChange={setTab} />
      </Card>

      {tab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4 border-slate-200 shadow-sm rounded-[5px]">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leads Assigned</div>
            <div className="mt-2 text-3xl font-black text-slate-900">{loading ? "..." : leadCounts?.total ?? 0}</div>
            <div className="mt-2 text-xs text-slate-600 font-semibold">
              Today: {leadCounts?.today ?? 0} | Last 7 days: {leadCounts?.last7Days ?? 0}
            </div>
          </Card>
          <Card className="p-4 border-slate-200 shadow-sm rounded-[5px]">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open / Closed</div>
            <div className="mt-2 text-3xl font-black text-slate-900">{loading ? "..." : openLeads}</div>
            <div className="mt-2 text-xs text-slate-600 font-semibold">Open leads</div>
            <div className="mt-3 text-sm font-black text-slate-900">{loading ? "..." : closedLeads}</div>
            <div className="text-xs text-slate-600 font-semibold">Closed leads</div>
          </Card>
          <Card className="p-4 border-slate-200 shadow-sm rounded-[5px]">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Activity</div>
            <div className="mt-2 text-sm font-black text-slate-900">{fmtDate(employee?.lastActivityAt)}</div>
            <div className="mt-2 text-xs text-slate-600 font-semibold">Last login: {fmtDate(employee?.lastLoginAt)}</div>
          </Card>

          <Card className="p-4 border-slate-200 shadow-sm rounded-[5px] md:col-span-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[5px] border border-slate-200 p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Conversations</div>
                <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "..." : convAssigned}</div>
                <div className="mt-1 text-xs text-slate-600 font-semibold">Total conversations assigned</div>
              </div>
              {assignedSeries.length === 7 ? <MiniBarChart title="Leads Assigned (7d)" series={assignedSeries} /> : null}
              {closedSeries.length === 7 ? <MiniBarChart title="Leads Closed (7d)" series={closedSeries} /> : null}
            </div>
          </Card>

          <Card className="p-4 border-slate-200 shadow-sm rounded-[5px] md:col-span-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Created</div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{fmtDate(employee?.createdAt)}</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Updated</div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{fmtDate(employee?.updatedAt)}</div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "analytics" ? (
        <Card className="p-5 border-slate-200 shadow-sm rounded-[5px]">
          <div className="text-sm font-black text-slate-900">Analytics</div>
          <div className="mt-2 text-sm text-slate-600 font-semibold">
            This tab currently shows assignment metrics. More analytics (messages, closes, reopen, etc.) can be added safely next.
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[5px] border border-slate-200 p-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leads (Today)</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{leadCounts?.today ?? 0}</div>
            </div>
            <div className="rounded-[5px] border border-slate-200 p-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leads (7d)</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{leadCounts?.last7Days ?? 0}</div>
            </div>
            <div className="rounded-[5px] border border-slate-200 p-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leads (Total)</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{leadCounts?.total ?? 0}</div>
            </div>
          </div>
        </Card>
      ) : null}

      {tab === "leads" ? (
        <Card className="border-slate-200 shadow-sm rounded-[5px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-sm font-black text-slate-900">Assigned Leads</div>
              <div className="text-[11px] font-semibold text-slate-500">Click a row to view details (modal will be added next).</div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-[5px] border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700"
                value={leadsRange}
                onChange={(e) => setLeadsRange(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
              </select>
              <Button variant="ghost" disabled={busy} onClick={loadLeads}>
                Refresh
              </Button>
            </div>
          </div>

          {someLeadsSelected ? (
            <div className="bg-brand-50 border-y border-brand-100 px-4 py-3 flex items-center justify-between">
              <div className="text-sm font-bold text-brand-700">{selectedLeadsCount} leads selected</div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={async () => {
                    await ensureEmployeesForTransferLoaded();
                    setTransferPhones(selectedLeadPhones);
                    setTransferOpen(true);
                  }}
                  disabled={busy}
                >
                  Transfer Selected
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setLeadMultiSelected({})}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-[12px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="w-12 px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                    <input
                      type="checkbox"
                      checked={allLeadsSelected}
                      onChange={(e) => {
                        const next: Record<string, boolean> = { ...(leadMultiSelected || {}) };
                        if (e.target.checked) leadsItems.forEach((l) => (next[l.phone] = true));
                        else leadsItems.forEach((l) => delete next[l.phone]);
                        setLeadMultiSelected(next);
                      }}
                      className="rounded-[3px] border-ink-900/20"
                    />
                  </th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Phone</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Assigned</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Last inbound</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Created</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(leads?.items || []).map((l) => (
                  <tr
                    key={l.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                    onClick={() => setSelectedLead(l)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!!leadMultiSelected[l.phone]}
                        onChange={() => setLeadMultiSelected((p) => ({ ...(p || {}), [l.phone]: !p?.[l.phone] }))}
                        className="rounded-[3px] border-ink-900/20"
                      />
                    </td>
                    <td className="px-4 py-3 font-black text-slate-900">{l.phone}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{l.status}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(l.assignedAt)}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(l.lastInboundAt)}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(l.createdAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        disabled={busy}
                        onClick={async () => {
                          await ensureEmployeesForTransferLoaded();
                          setTransferPhones([l.phone]);
                          setTransferOpen(true);
                        }}
                      >
                        Transfer
                      </Button>
                    </td>
                  </tr>
                ))}
                {!busy && (leads?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500 font-semibold">
                      No leads found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <AssignLeadModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        phone={transferPhones[0] || ""}
        phones={transferPhones}
        employees={employeesForTransfer || []}
        onAssign={async (toEmployeeId, reason) => {
          if (!employeeId) return;
          const phones = (transferPhones || []).filter(Boolean);
          if (!phones.length) return;
          setBusy(true);
          setError(null);
          try {
            await Promise.all(phones.map((p) => API.crm.manualAssignLead(p, { employeeId: toEmployeeId, reason: reason || "transfer" })));
            setTransferOpen(false);
            setTransferPhones([]);
            setLeadMultiSelected({});
            await loadLeads();
            await reloadProfile();
          } catch (e: any) {
            setError(e?.response?.data?.message || "Failed to transfer leads");
          } finally {
            setBusy(false);
          }
        }}
      />

      {tab === "requests" ? (
        <Card className="border-slate-200 shadow-sm rounded-[5px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">Employee Requests</div>
              <div className="text-[11px] font-semibold text-slate-500">Click to view and approve/reject.</div>
            </div>
            <Button variant="ghost" disabled={busy} onClick={loadRequests}>
              Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-[12px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Time</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Type</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Requested</th>
                </tr>
              </thead>
              <tbody>
                {(requests || []).map((r) => {
                  const m = r.metadata || {};
                  const requested = m.requestType === "change_name" ? m.requestedName : m.requestType === "change_email" ? m.requestedEmail : "-";
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                      onClick={() => {
                        setSelectedRequest(r);
                        setReviewNote(String(m.reviewNote || ""));
                        setNewPassword("");
                        setEmailOtp("");
                        setRequestOpen(true);
                      }}
                    >
                      <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(r.createdAt)}</td>
                      <td className="px-4 py-3 font-black text-slate-900">{String(m.requestType || "-")}</td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">{String(m.status || "-")}</td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{requested || "-"}</td>
                    </tr>
                  );
                })}
                {!busy && (requests || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-semibold">
                      No requests found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {selectedLead ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
          <div className="w-full max-w-lg rounded-[5px] border border-slate-100 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lead</div>
                <div className="mt-1 text-lg font-black text-slate-900">{selectedLead.phone}</div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
            </div>
            <div className="p-4 grid gap-2 text-[13px]">
              <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Status</span><span className="font-black text-slate-900">{selectedLead.status}</span></div>
              <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Assigned</span><span className="font-semibold text-slate-700">{fmtDate(selectedLead.assignedAt)}</span></div>
              <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">First inbound</span><span className="font-semibold text-slate-700">{fmtDate(selectedLead.firstInboundAt)}</span></div>
              <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Last inbound</span><span className="font-semibold text-slate-700">{fmtDate(selectedLead.lastInboundAt)}</span></div>
              <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Created</span><span className="font-semibold text-slate-700">{fmtDate(selectedLead.createdAt)}</span></div>
              <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Updated</span><span className="font-semibold text-slate-700">{fmtDate(selectedLead.updatedAt)}</span></div>
            </div>
          </div>
        </div>
      ) : null}

      {requestOpen && selectedRequest ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setRequestOpen(false)}>
          <div className="w-full max-w-2xl rounded-[5px] border border-slate-100 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Request</div>
                <div className="mt-1 text-lg font-black text-slate-900">{String(selectedRequest.metadata?.requestType || "-")}</div>
                <div className="text-[11px] font-semibold text-slate-500">Status: {String(selectedRequest.metadata?.status || "-")}</div>
              </div>
              <Button variant="ghost" onClick={() => setRequestOpen(false)}>
                Close
              </Button>
            </div>
            <div className="p-4 grid gap-3">
              <div className="grid gap-2 text-[13px]">
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Employee</span><span className="font-black text-slate-900">{String(selectedRequest.metadata?.employeeEmail || "-")}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Requested Name</span><span className="font-semibold text-slate-700">{String(selectedRequest.metadata?.requestedName || "-")}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Requested Email</span><span className="font-semibold text-slate-700">{String(selectedRequest.metadata?.requestedEmail || "-")}</span></div>
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-500">Reason</span><span className="font-semibold text-slate-700">{String(selectedRequest.metadata?.reason || "-")}</span></div>
              </div>

              <Input label="Review note (optional)" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />

              {String(selectedRequest.metadata?.requestType || "") === "password_reset" ? (
                <Input
                  label="Set new password (optional). Leave empty to send reset link."
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              ) : null}

              {String(selectedRequest.metadata?.requestType || "") === "change_email" ? (
                <div className="grid gap-2">
                  <Input
                    label="Email OTP (after approval)"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                    placeholder="123456"
                  />
                  <Button variant="outline" disabled={decisionBusy || !emailOtp} onClick={verifyEmailOtp}>
                    {decisionBusy ? "Verifying..." : "Verify OTP & Apply Email Change"}
                  </Button>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" disabled={decisionBusy} onClick={() => decide("rejected")}>
                  Reject
                </Button>
                <Button disabled={decisionBusy} onClick={() => decide("approved")}>
                  {decisionBusy ? "Please wait..." : "Approve"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "activities" ? (
        <Card className="border-slate-200 shadow-sm rounded-[5px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">Activities</div>
              <div className="text-[11px] font-semibold text-slate-500">Assignment audits (latest first).</div>
            </div>
            <Button variant="ghost" disabled={busy} onClick={loadActivities}>
              Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-[12px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Time</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Phone</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Mode</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Reason</th>
                </tr>
              </thead>
              <tbody>
                {(activities?.items || []).map((a: any) => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(a.createdAt)}</td>
                    <td className="px-4 py-3 font-black text-slate-900">{a.phone}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{a.mode || "-"}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{a.reason || "-"}</td>
                  </tr>
                ))}
                {!busy && (activities?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-semibold">
                      No activities found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === "sessions" ? (
        <Card className="border-slate-200 shadow-sm rounded-[5px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">Login / Logout</div>
              <div className="text-[11px] font-semibold text-slate-500">Events recorded when employee signs in/out.</div>
            </div>
            <Button variant="ghost" disabled={busy} onClick={loadSessions}>
              Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-[12px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Time</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Type</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">IP</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">User agent</th>
                </tr>
              </thead>
              <tbody>
                {(sessions?.items || []).map((s: any) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(s.createdAt)}</td>
                    <td className="px-4 py-3 font-black text-slate-900">{String(s.type || "").toUpperCase()}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{s.ip || "-"}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold truncate max-w-[520px]">{s.userAgent || "-"}</td>
                  </tr>
                ))}
                {!busy && (sessions?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-semibold">
                      No login/logout events yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Employee Profile" className="max-w-[720px]">
        <div className="grid gap-3">
          <Input label="Name" value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
          <Input label="Email" value={editForm.email} onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))} />

          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
            Role
          </label>
          <select
            className="h-10 rounded-[5px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900"
            value={editForm.role}
            onChange={(e) => setEditForm((s) => ({ ...s, role: e.target.value }))}
          >
            <option value="employee">Employee</option>
            <option value="team_leader">Team Leader</option>
          </select>

          <div className="pt-2 border-t border-slate-100 grid gap-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account</div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" disabled={busy} onClick={() => { setResetMode("link"); setResetModalOpen(true); }}>
                Reset Password
              </Button>
              <Button variant="outline" disabled={busy} onClick={sendResetLink}>
                Send Reset Link
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => updateStatus(employee?.status === "BLOCKED" ? "ACTIVE" : "BLOCKED")}
              >
                {employee?.status === "BLOCKED" ? "Unblock Employee" : "Block Employee"}
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => updateStatus("DELETED")}>
                Fire (Delete)
              </Button>
            </div>

            <div className="text-[11px] font-semibold text-slate-500">
              Fire/Delete is permanent. Email cannot be reused again for this workspace.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" disabled={busy} onClick={() => setEditOpen(false)}>
              Close
            </Button>
            <Button disabled={busy} onClick={saveProfileEdit}>
              {busy ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setResetPwd("");
          setResetPwd2("");
          setResetMode("link");
        }}
        title="Reset Employee Password"
        className="max-w-[720px]"
      >
        <div className="grid gap-3">
          <div className="text-sm font-semibold text-slate-600">
            Choose how you want to reset password.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={resetMode === "link" ? "primary" : "outline"} onClick={() => setResetMode("link")}>
              Send Reset Link
            </Button>
            <Button variant={resetMode === "direct" ? "primary" : "outline"} onClick={() => setResetMode("direct")}>
              Set New Password
            </Button>
          </div>

          {resetMode === "link" ? (
            <div className="grid gap-3">
              <div className="text-xs font-semibold text-slate-500">
                Employee will reset password using the link sent to their email.
              </div>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setResetModalOpen(false);
                  sendResetLink();
                }}
              >
                Send Link
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              <Input label="New password" type="password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} />
              <Input label="Confirm password" type="password" value={resetPwd2} onChange={(e) => setResetPwd2(e.target.value)} />
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  const p1 = String(resetPwd || "");
                  const p2 = String(resetPwd2 || "");
                  if (p1.length < 8) {
                    setError("Password must be at least 8 characters.");
                    return;
                  }
                  if (p1 !== p2) {
                    setError("Confirm password does not match.");
                    return;
                  }
                  setResetModalOpen(false);
                  openConfirm({
                    title: "Confirm Reset Password",
                    body: "This will immediately log the employee out from all sessions. Continue?",
                    cta: "Reset Password",
                    variant: "danger",
                    action: async () => {
                      setConfirmOpen(false);
                      await resetPasswordDirect(p1);
                    },
                  });
                }}
              >
                Reset Password
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title={confirmTitle} className="max-w-[620px]">
        <div className="grid gap-4">
          <div className="text-sm font-semibold text-slate-700">{confirmBody}</div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={confirmVariant === "danger" ? "danger" : "primary"}
              disabled={!confirmAction}
              onClick={() => {
                if (!confirmAction) return;
                void confirmAction();
              }}
            >
              {confirmCta}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
