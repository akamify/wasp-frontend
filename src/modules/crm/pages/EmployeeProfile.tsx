import { useEffect, useMemo, useState } from "react";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Alert } from "@components/ui/Alert";
import { useEmployeeAuth } from "@modules/crm/providers/EmployeeAuthContext";
import { cn } from "@shared/utils/cn";
import { crmEmployeeProfileRequestsService } from "@modules/crm/services/crmEmployeeProfileRequests.service";

type RequestItem = {
  id: string;
  createdAt?: string;
  metadata: any;
};

type TabKey = "overview" | "requests";

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function EmployeeProfilePage() {
  const { employee } = useEmployeeAuth();
  const [tab, setTab] = useState<TabKey>("overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<RequestItem[]>([]);

  const [requestType, setRequestType] = useState<"change_name" | "change_email" | "password_reset">("change_name");
  const [requestedName, setRequestedName] = useState("");
  const [requestedEmail, setRequestedEmail] = useState("");
  const [reason, setReason] = useState("");

  async function reload() {
    setBusy(true);
    setError(null);
    try {
      const res = await crmEmployeeProfileRequestsService.list();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load requests");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (tab !== "requests") return;
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const header = useMemo(() => (employee?.name || employee?.email || "Employee"), [employee]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await crmEmployeeProfileRequestsService.submit({
        requestType,
        requestedName: requestType === "change_name" ? requestedName : undefined,
        requestedEmail: requestType === "change_email" ? requestedEmail : undefined,
        reason,
      });
      setRequestedName("");
      setRequestedEmail("");
      setReason("");
      await reload();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to submit request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="p-6 border-slate-200 shadow-sm rounded-[5px]">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Profile</div>
          <div className="mt-2 text-lg font-black text-slate-900">{header}</div>
          <div className="mt-1 text-sm font-bold text-slate-600">{employee?.email || "-"}</div>
          <div className="mt-3 text-xs font-bold text-slate-500">Workspace ID</div>
          <div className="text-sm font-black text-slate-900 break-all">{employee?.workspaceId || "-"}</div>

          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => setTab("overview")}
              className={cn(
                "h-9 px-3 rounded-[5px] border text-[12px] font-black uppercase tracking-widest",
                tab === "overview" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setTab("requests")}
              className={cn(
                "h-9 px-3 rounded-[5px] border text-[12px] font-black uppercase tracking-widest",
                tab === "requests" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              Requests
            </button>
          </div>
        </Card>

        {error ? <Alert variant="danger">{error}</Alert> : null}

        {tab === "requests" ? (
          <>
            <Card className="p-6 border-slate-200 shadow-sm rounded-[5px]">
              <div className="text-sm font-black text-slate-900">Submit Request</div>
              <div className="mt-1 text-xs font-semibold text-slate-600">
                You cannot directly change your profile details or send password reset links. Submit a request to your workspace owner.
              </div>

              <div className="mt-4 grid gap-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Request Type</label>
                <select
                  className="h-10 rounded-[5px] border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-800"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as any)}
                >
                  <option value="change_name">Change Name</option>
                  <option value="change_email">Change Email</option>
                  <option value="password_reset">Password Reset</option>
                </select>

                {requestType === "change_name" ? (
                  <Input label="Requested name" value={requestedName} onChange={(e) => setRequestedName(e.target.value)} />
                ) : null}
                {requestType === "change_email" ? (
                  <Input label="Requested email" value={requestedEmail} onChange={(e) => setRequestedEmail(e.target.value)} />
                ) : null}

                <Input label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />

                <Button disabled={busy} onClick={submit}>
                  {busy ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-[5px] overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="text-sm font-black text-slate-900">My Requests</div>
                <Button variant="ghost" disabled={busy} onClick={reload}>
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
                      <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => {
                      const m = r.metadata || {};
                      const requested = m.requestType === "change_name" ? m.requestedName : m.requestType === "change_email" ? m.requestedEmail : "-";
                      return (
                        <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(r.createdAt)}</td>
                          <td className="px-4 py-3 font-black text-slate-900">{String(m.requestType || "-")}</td>
                          <td className="px-4 py-3 text-slate-700 font-semibold">{String(m.status || "-")}</td>
                          <td className="px-4 py-3 text-slate-600 font-semibold">{requested || "-"}</td>
                          <td className="px-4 py-3 text-slate-600 font-semibold">{String(m.reviewNote || "") || "-"}</td>
                        </tr>
                      );
                    })}
                    {!busy && items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-semibold">
                          No requests yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
