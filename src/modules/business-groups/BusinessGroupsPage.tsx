import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@api/api";
import { Button } from "@components/ui/Button";
import { startReportRefresh } from "./reportRefresh";

type Workspace = { id: string; name: string };
type Link = { workspaceId: string; requestId: string; status: string; name?: string };
type Group = { id: string; name: string; links: Link[] };
type Approval = Link & { groupId: string; groupName: string };
type Payment = { currency: string; capturedPaise: number; refundedPaise: number };
type Row = { workspaceId: string; name: string; orders: number; paidOrders: number; completedOrders: number; payments: Payment[] };
type Report = { rows: Row[]; generatedAt: string; uniqueOrderCustomers: number; uniqueContactNumbers: number; next: string | null;
  orders: { _id: string; workspaceId: string; orderNumber: string; status: string; paymentStatus: string; totalPaise: number; currency: string }[] };
const input = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
const card = "rounded-xl border border-slate-200 bg-white p-5 space-y-4";
const message = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Unable to complete the request. Please retry.";
const money = (value: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value / 100);
const get = async <T,>(path: string, params?: Record<string, string>, signal?: AbortSignal): Promise<T> => {
  const config = { params, cacheTtlMs: 0, signal };
  return (await api.get(`/business-groups${path}`, config)).data;
};

export default function BusinessGroupsPage() {
  const [group, setGroup] = useState<Group | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceNext, setWorkspaceNext] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [ownedTarget, setOwnedTarget] = useState("");
  const [inboxWorkspace, setInboxWorkspace] = useState("");
  const [inbox, setInbox] = useState<Approval[]>([]);
  const [inboxNext, setInboxNext] = useState<string | null>(null);
  const [environment, setEnvironment] = useState("live");
  const [from, setFrom] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [report, setReport] = useState<Report | null>(null);
  const [cursor, setCursor] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [reportError, setReportError] = useState("");
  const reportSequence = useRef(0);
  const inboxSequence = useRef(0);
  const refresh = useCallback(async () => {
    const [data, owned] = await Promise.all([get<{ group: Group | null }>("/"), get<{ items: Workspace[]; next: string | null }>("/owned-workspaces")]);
    setGroup(data.group); setName(data.group?.name || ""); setWorkspaces(owned.items); setWorkspaceNext(owned.next);
    setVersion((v) => v + 1);
  }, []);
  useEffect(() => { refresh().catch((e) => setError(message(e))).finally(() => setLoading(false)); }, [refresh]);
  useEffect(() => {
    const sequence = ++reportSequence.current;
    setReport(null);
    setReportError("");
    if (!group || busy) { setReportLoading(false); return; }
    const refresher = startReportRefresh({
      load: (signal) => get<Report>("/report", { environment, from, to, ...(cursor ? { after: cursor } : {}) }, signal),
      onSuccess: (data) => { if (sequence === reportSequence.current) { setReport(data); setReportError(""); } },
      onError: (e) => { if (sequence === reportSequence.current) { setReport(null); setReportError(message(e)); } },
      onLoading: (value) => { if (sequence === reportSequence.current) setReportLoading(value); },
      canRefresh: () => document.visibilityState !== "hidden" && navigator.onLine,
      repeat: autoRefresh && !cursor,
    });
    const resume = () => { if (autoRefresh && !cursor) void refresher.refresh(); };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      reportSequence.current++; refresher.stop();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [group, environment, from, to, cursor, version, autoRefresh, busy]);
  useEffect(() => {
    const sequence = ++inboxSequence.current;
    setInbox([]); setInboxNext(null);
    if (!inboxWorkspace) { setInboxLoading(false); return; }
    setInboxLoading(true);
    get<{ items: Approval[]; next: string | null }>(`/inbox/${inboxWorkspace}`)
      .then((data) => { if (sequence === inboxSequence.current) { setInbox(data.items); setInboxNext(data.next); } })
      .catch((e) => { if (sequence === inboxSequence.current) setError(message(e)); })
      .finally(() => { if (sequence === inboxSequence.current) setInboxLoading(false); });
    return () => { inboxSequence.current++; };
  }, [inboxWorkspace, version]);
  async function action(run: () => Promise<unknown>, success: string) {
    setBusy(true); setError(""); setNotice(""); setReport(null); reportSequence.current++;
    try { await run(); setNotice(success); await refresh(); }
    catch (e) { setError(message(e)); setVersion((v) => v + 1); }
    finally { setBusy(false); }
  }
  function link(workspaceId: string) {
    return action(async () => {
      await api.post("/business-groups/links", { workspaceId: workspaceId.trim() }); setTarget("");
    }, "Link request saved. Workspaces owned by another account require that owner's approval.");
  }
  function decide(groupId: string, item: Link, decision: string) {
    return action(() => api.post(`/business-groups/${groupId}/links/${item.workspaceId}/decision`, { requestId: item.requestId, decision }), "Workspace permission updated.");
  }
  async function moreOwned() {
    if (!workspaceNext) return;
    setBusy(true); setError("");
    try { const data = await get<{ items: Workspace[]; next: string | null }>("/owned-workspaces", { after: workspaceNext });
      setWorkspaces((old) => [...old, ...data.items]); setWorkspaceNext(data.next);
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  async function moreInbox() {
    if (!inboxNext) return;
    const sequence = inboxSequence.current;
    setBusy(true); setError("");
    try { const data = await get<{ items: Approval[]; next: string | null }>(`/inbox/${inboxWorkspace}`, { after: inboxNext });
      if (sequence === inboxSequence.current) { setInbox((old) => [...old, ...data.items]); setInboxNext(data.next); }
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  const paymentTotals = new Map<string, Payment>();
  for (const row of report?.rows || []) for (const payment of row.payments) {
    const total = paymentTotals.get(payment.currency) || { currency: payment.currency, capturedPaise: 0, refundedPaise: 0 };
    total.capturedPaise += payment.capturedPaise; total.refundedPaise += payment.refundedPaise;
    paymentTotals.set(payment.currency, total);
  }
  if (loading) return <p role="status" className="p-6">Loading Business Groups…</p>;
  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Business Groups</h1>
      <p className="text-sm text-slate-600">Connect your panels to one read-only reporting dashboard.</p></div>
      <Button disabled={busy} onClick={() => action(async () => {}, "Dashboard refreshed.")}>Refresh</Button></header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{notice}</p>}
    <section className={card}><h2 className="font-semibold">{group ? "Your reporting group" : "Create your reporting group"}</h2>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); void action(() => api.put("/business-groups/", { name }), "Group saved."); }}>
        <label className="grid gap-1 text-sm">Group name<input className={input} required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <Button disabled={busy} type="submit">{group ? "Save name" : "Create group"}</Button></form>
      <p className="text-sm text-slate-500">One group per owner, up to 100 workspace links. Catalogs, orders and gateway accounts remain managed in their own panels.</p>
      {group && <p className="break-all text-sm">Your owner account ID: <code>{group.id}</code></p>}
    </section>
    {group && <section className={card}><h2 className="font-semibold">Connected workspaces</h2>
      <div className="flex flex-wrap items-end gap-3"><label className="grid gap-1 text-sm">Your workspace<select className={input} value={ownedTarget} onChange={(e) => setOwnedTarget(e.target.value)}><option value="">Select workspace</option>{workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
        <Button disabled={busy || !ownedTarget} onClick={() => link(ownedTarget)}>Connect workspace</Button></div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); void link(target); }}><label className="grid gap-1 text-sm">Workspace ID from another owner<input className={input} required pattern="[a-fA-F0-9]{24}" value={target} onChange={(e) => setTarget(e.target.value)} /></label><Button disabled={busy} type="submit">Request access</Button></form>
      <p className="text-sm text-slate-500">The other owner approves from the Workspace approvals section below. Sharing grants aggregate reports and an order summary without customer contact details.</p>
      {!group.links.length && <p>No workspaces connected yet.</p>}
      <ul className="divide-y divide-slate-100">{group.links.map((item) => <li key={item.workspaceId} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{item.name}</p><p className="text-xs text-slate-500">{item.workspaceId} · {item.status.replaceAll("_", " ")}</p></div>
        {["pending", "active", "reapproval_required"].includes(item.status) ? <Button disabled={busy} onClick={() => decide(group.id, item, "revoke")}>Disconnect</Button> : <Button disabled={busy} onClick={() => link(item.workspaceId)}>Request again</Button>}</li>)}</ul>
    </section>}
    <section className={card}><h2 className="font-semibold">Workspace approvals</h2>
      <p className="text-sm text-slate-600">Select a workspace you own to review requests or revoke existing reporting access. Verify the requesting owner's account ID before approving.</p>
      <label className="grid max-w-lg gap-1 text-sm">Workspace<select className={input} disabled={busy} value={inboxWorkspace} onChange={(e) => setInboxWorkspace(e.target.value)}><option value="">Select workspace</option>{workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
      {inboxWorkspace && <p className="break-all text-sm">Workspace ID to share: <code>{inboxWorkspace}</code></p>}
      {workspaceNext && <Button disabled={busy} onClick={moreOwned}>Load more owned workspaces</Button>}
      {inboxLoading && <p role="status">Loading requests…</p>}
      {inboxWorkspace && !inboxLoading && !inbox.length && <p className="text-sm">No reporting links to review.</p>}
      {inbox.map((item) => <div key={item.groupId} className="flex flex-wrap items-center justify-between gap-3 border-t py-3"><div><p>{item.groupName} · {item.status}</p><p className="text-xs text-slate-500">Owner account ID: {item.groupId}</p></div><div className="flex gap-2">{item.status === "pending" && <><Button disabled={busy} onClick={() => decide(item.groupId, item, "approve")}>Approve reporting</Button><Button disabled={busy} onClick={() => decide(item.groupId, item, "reject")}>Reject</Button></>}{item.status === "active" && <Button disabled={busy} onClick={() => decide(item.groupId, item, "revoke")}>Revoke access</Button>}</div></div>)}
      {inboxNext && <Button disabled={busy} onClick={moreInbox}>Load more requests</Button>}
    </section>
    {group && <section className={card}><h2 className="font-semibold">Combined commerce report</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />Auto-refresh every 30 seconds</label>
      <p className="text-xs text-slate-500">Updates while this tab is visible and online. Auto-refresh pauses on older order pages; return to the first page for new orders within the selected dates.</p>
      {reportError && <p role="alert" className="text-sm text-red-700">{reportError} Use Refresh to retry.</p>}
      <div className="flex flex-wrap gap-3"><label className="grid gap-1 text-sm">Environment<select className={input} value={environment} onChange={(e) => { setCursor(""); setEnvironment(e.target.value); }}><option value="live">Live</option><option value="test">Test</option></select></label>
        <label className="grid gap-1 text-sm">From (UTC)<input className={input} type="date" value={from} onChange={(e) => { setCursor(""); setFrom(e.target.value); }} /></label>
        <label className="grid gap-1 text-sm">To (exclusive, UTC)<input className={input} type="date" value={to} onChange={(e) => { setCursor(""); setTo(e.target.value); }} /></label></div>
      {reportLoading && <p role="status">Loading report…</p>}
      {report && <><div className="grid gap-3 sm:grid-cols-4">{[
        ["Orders received", report.rows.reduce((n, row) => n + row.orders, 0)], ["Paid orders", report.rows.reduce((n, row) => n + row.paidOrders, 0)],
        ["Unique ordering numbers", report.uniqueOrderCustomers], ["Existing contact numbers", report.uniqueContactNumbers],
      ].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-600">{label}</p><p className="text-2xl font-semibold">{value}</p></div>)}</div>
        {report.generatedAt && <p className="text-xs text-slate-500">Last updated: {new Date(report.generatedAt).toLocaleString()}</p>}
        {[...paymentTotals.values()].map((total) => <div key={total.currency} className="rounded-lg bg-slate-50 p-4 text-sm"><p>Combined captured ({total.currency}): <strong>{money(total.capturedPaise, total.currency)}</strong></p><p>Refunded against these captures: <strong>{money(total.refundedPaise, total.currency)}</strong></p></div>)}
        <p className="text-xs text-slate-500">Orders use received date; paid/completed are their current status. Captures use the date AIWizChat first recorded the verified payment, not the bank settlement date. Refunds are all refunds recorded against those captures, including later refunds. Contacts count all existing saved numbers across linked panels and do not have Test/Live separation. Numbers are deduplicated after removing an optional + prefix; country codes are never guessed.</p>
        {!report.rows.length ? <p>Connect an active workspace to see reports.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Workspace", "Orders", "Paid", "Completed", "Captured / refunded"].map((s) => <th key={s} className="p-3">{s}</th>)}</tr></thead><tbody>{report.rows.map((r) => <tr key={r.workspaceId} className="border-t"><td className="p-3">{r.name}</td><td className="p-3">{r.orders}</td><td className="p-3">{r.paidOrders}</td><td className="p-3">{r.completedOrders}</td><td className="p-3">{r.payments.length ? r.payments.map((p) => <div key={p.currency}>{money(p.capturedPaise, p.currency)} / {money(p.refundedPaise, p.currency)}</div>) : "No captures"}</td></tr>)}</tbody></table></div>}
        <h3 className="font-medium">Recent orders in selected period</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Order", "Workspace", "Status", "Payment", "Total"].map((s) => <th key={s} className="p-3">{s}</th>)}</tr></thead><tbody>{report.orders.map((o) => <tr key={o._id} className="border-t"><td className="p-3">{o.orderNumber}</td><td className="p-3">{report.rows.find((r) => r.workspaceId === o.workspaceId)?.name}</td><td className="p-3">{o.status}</td><td className="p-3">{o.paymentStatus}</td><td className="p-3">{money(o.totalPaise, o.currency)}</td></tr>)}</tbody></table></div>
        {!report.orders.length && <p>No orders in this period.</p>}<div className="flex gap-3">{cursor && <Button onClick={() => setCursor("")}>First page</Button>}{report.next && <Button onClick={() => setCursor(report.next || "")}>Next orders</Button>}</div>
      </>}
    </section>}
  </main>;
}
