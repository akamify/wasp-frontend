import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { StatusBadge, Tabs } from "@modules/crm/pages/employee-profile/shared";
import type { Employee, LeadItem, OwnerTabKey, PagedRes, ProfileRes } from "@modules/crm/pages/employee-profile/shared";
import { EmployeeProfilePrimarySections } from "@modules/crm/pages/employee-profile/EmployeeProfilePrimarySections";
import { EmployeeProfileSecondarySections } from "@modules/crm/pages/employee-profile/EmployeeProfileSecondarySections";
import { EmployeeProfileActionModals } from "@modules/crm/pages/employee-profile/EmployeeProfileActionModals";
import { CrmEmployeeProfileSkeleton } from "@components/ui/Skeletons";
export default function CrmEmployeeProfilePage() {
  const params = useParams();
  const employeeId = String(params.employeeId || "").trim();
  const navigate = useNavigate();
  const [tab, setTab] = useState<OwnerTabKey>("overview"); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [profile, setProfile] = useState<ProfileRes | null>(null);
  const [editOpen, setEditOpen] = useState(false); const [editForm, setEditForm] = useState({ name: "", role: "employee", email: "" }); const [confirmOpen, setConfirmOpen] = useState(false); const [confirmTitle, setConfirmTitle] = useState(""); const [confirmBody, setConfirmBody] = useState(""); const [confirmCta, setConfirmCta] = useState("Confirm"); const [confirmVariant, setConfirmVariant] = useState<"primary" | "danger">("primary"); const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false); const [resetMode, setResetMode] = useState<"link" | "direct">("link"); const [resetPwd, setResetPwd] = useState(""); const [resetPwd2, setResetPwd2] = useState("");
  const [leadsRange, setLeadsRange] = useState<"all" | "today" | "7d">("all"); const [leads, setLeads] = useState<PagedRes<LeadItem> | null>(null); const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null); const [leadMultiSelected, setLeadMultiSelected] = useState<Record<string, boolean>>({}); const [transferOpen, setTransferOpen] = useState(false); const [transferPhones, setTransferPhones] = useState<string[]>([]); const [employeesForTransfer, setEmployeesForTransfer] = useState<any[]>([]);
  const [activities, setActivities] = useState<PagedRes<any> | null>(null); const [sessions, setSessions] = useState<PagedRes<any> | null>(null); const [requests, setRequests] = useState<{ id: string; createdAt?: string; metadata: any }[] | null>(null); const [requestOpen, setRequestOpen] = useState(false); const [selectedRequest, setSelectedRequest] = useState<{ id: string; createdAt?: string; metadata: any } | null>(null);
  const [decisionBusy, setDecisionBusy] = useState(false); const [reviewNote, setReviewNote] = useState(""); const [newPassword, setNewPassword] = useState(""); const [emailOtp, setEmailOtp] = useState("");
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
  if (loading && !profile) return <CrmEmployeeProfileSkeleton />;
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tighter text-slate-900 truncate">{loading ? "Loading..." : title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">{employee ? <StatusBadge status={employee.status} /> : null}{employee ? <span className="text-xs font-semibold text-slate-600">{employee.email}</span> : null}</div>
        </div>
        <div className="flex items-center gap-2"><Button variant="ghost" onClick={() => navigate("/app/crm/employees")} disabled={busy}>Back</Button><Button onClick={() => setEditOpen(true)} disabled={busy || loading}>Edit Profile</Button></div>
      </div>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <Card className="p-4 border-slate-200 shadow-sm rounded-[5px]"><Tabs value={tab} onChange={setTab} /></Card>
      <EmployeeProfilePrimarySections tab={tab} loading={loading} leadCounts={leadCounts} openLeads={openLeads} closedLeads={closedLeads} employee={employee} convAssigned={convAssigned} assignedSeries={assignedSeries} closedSeries={closedSeries} leadsRange={leadsRange} setLeadsRange={setLeadsRange} busy={busy} loadLeads={loadLeads} someLeadsSelected={someLeadsSelected} selectedLeadsCount={selectedLeadsCount} ensureEmployeesForTransferLoaded={ensureEmployeesForTransferLoaded} selectedLeadPhones={selectedLeadPhones} setTransferPhones={setTransferPhones} setTransferOpen={setTransferOpen} setLeadMultiSelected={setLeadMultiSelected} allLeadsSelected={allLeadsSelected} leadMultiSelected={leadMultiSelected} leadsItems={leadsItems} leads={leads} setSelectedLead={setSelectedLead} transferOpen={transferOpen} transferPhones={transferPhones} employeesForTransfer={employeesForTransfer} employeeId={employeeId} setError={setError} loadRequests={loadRequests} requests={requests} setSelectedRequest={setSelectedRequest} setReviewNote={setReviewNote} setNewPassword={setNewPassword} setEmailOtp={setEmailOtp} setRequestOpen={setRequestOpen} API={API} setBusy={setBusy} reloadProfile={reloadProfile} />
      <EmployeeProfileSecondarySections tab={tab} busy={busy} activities={activities} sessions={sessions} loadActivities={loadActivities} loadSessions={loadSessions} selectedLead={selectedLead} setSelectedLead={setSelectedLead} requestOpen={requestOpen} setRequestOpen={setRequestOpen} selectedRequest={selectedRequest} reviewNote={reviewNote} setReviewNote={setReviewNote} newPassword={newPassword} setNewPassword={setNewPassword} emailOtp={emailOtp} setEmailOtp={setEmailOtp} decisionBusy={decisionBusy} verifyEmailOtp={verifyEmailOtp} decide={decide} />
      <EmployeeProfileActionModals editOpen={editOpen} setEditOpen={setEditOpen} editForm={editForm} setEditForm={setEditForm} busy={busy} sendResetLink={sendResetLink} employee={employee} updateStatus={updateStatus} saveProfileEdit={saveProfileEdit} resetModalOpen={resetModalOpen} setResetModalOpen={setResetModalOpen} resetPwd={resetPwd} setResetPwd={setResetPwd} resetPwd2={resetPwd2} setResetPwd2={setResetPwd2} resetMode={resetMode} setResetMode={setResetMode} setError={setError} openConfirm={openConfirm} resetPasswordDirect={resetPasswordDirect} confirmOpen={confirmOpen} setConfirmOpen={setConfirmOpen} confirmTitle={confirmTitle} confirmBody={confirmBody} confirmVariant={confirmVariant} confirmAction={confirmAction} confirmCta={confirmCta} />
    </div>
  );
}
