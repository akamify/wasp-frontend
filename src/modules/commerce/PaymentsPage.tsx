import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";
import { useCommerce, useCommerceAction, useCommerceQuery } from "./commerceContext";
import type { EventRecord, Page, Payment, Refund } from "./types";
import { date, DisabledFeature, ErrorNotice, money, Pager, Panel, QueryState, Status } from "./ui";
function Refunds({ payment, close }: { payment: Payment; close: () => void }) {
  const [cursors, setCursors] = useState<string[]>([]);
  const query = useCommerceQuery<Page<Refund>>(`/payments/${payment.id}/refunds`, { environment: payment.environment, limit: 25, cursor: cursors.at(-1) });
  return <Modal open title={`Refunds · ${payment.providerPaymentId}`} onClose={close}><p className="mb-3 text-sm">Issue refunds in this merchant's Razorpay dashboard. Verified refunds sync here; inventory is not automatically restocked.</p><QueryState {...query} empty={!query.data?.items.length} />{query.data?.items.map((refund) => <div key={refund.id} className="flex flex-wrap justify-between gap-2 border-b py-3 text-sm"><span>{refund.providerRefundId}</span><span>{money(refund.amountPaise)}</span><Status value={refund.status} /></div>)}<Pager next={query.data?.nextCursor} back={cursors.length ? () => setCursors((v) => v.slice(0, -1)) : undefined} onNext={() => setCursors((v) => [...v, query.data!.nextCursor!])} /></Modal>;
}
export function FailedEvents({ kind }: { kind: "orders" | "payments" }) {
  const { can } = useCommerce(), [cursors, setCursors] = useState<string[]>([]), action = useCommerceAction();
  const query = useCommerceQuery<Page<EventRecord>>(`/${kind}/events`, { status: "dead_letter", limit: 25, cursor: cursors.at(-1) });
  return <Panel title={kind === "orders" ? "Cart events needing attention" : "Payment events needing attention"} action={<Button size="sm" variant="outline" onClick={query.reload}>Refresh</Button>}><QueryState {...query} empty={!query.data?.items.length} /><ErrorNotice message={action.error} />
    {query.data?.items.map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-3 border-b py-3 text-sm"><div><p>{date(event.createdAt)} · {event.attempts} attempts</p><p>{event.lastError}</p></div>{can(`commerce.${kind}.manage`) && <Button size="sm" variant="outline" disabled={action.busy} onClick={() => action.run(`/${kind}/events/${event.id}/retry`, {}, query.reload)}>Retry processing</Button>}</div>)}
    <Pager next={query.data?.nextCursor} back={cursors.length ? () => setCursors((v) => v.slice(0, -1)) : undefined} onNext={() => setCursors((v) => [...v, query.data!.nextCursor!])} />
  </Panel>;
}
export default function PaymentsPage() {
  const { environment, access } = useCommerce(), [cursors, setCursors] = useState<string[]>([]), [selected, setSelected] = useState<Payment | null>(null);
  const query = useCommerceQuery<Page<Payment>>(access.capabilities.payments ? "/payments" : null, { environment, limit: 25, cursor: cursors.at(-1) });
  if (!access.capabilities.payments) return <DisabledFeature name="Payments" />;
  return <div className="space-y-5"><Panel title="Verified payments" action={<Button size="sm" variant="outline" onClick={query.reload}>Refresh</Button>}>
    <p className="text-sm text-slate-500">Customer payments settle through each merchant's gateway. AIWizChat platform billing is separate.</p><QueryState {...query} empty={!query.data?.items.length} />
    {query.data?.items.map((payment) => <div key={payment.id} className="flex flex-wrap justify-between gap-3 border-b py-4"><div className="space-y-1"><p className="font-semibold break-all">{payment.providerPaymentId}</p><p className="text-sm text-slate-500">{payment.method} · {date(payment.verifiedAt)}</p><div className="flex gap-2"><Status value={payment.status} />{payment.overpayment && <Status value="requires_attention" />}</div><Link className="text-sm text-brand-700 underline" to={`/app/commerce/orders/${payment.orderId}`}>View order</Link></div><div className="space-y-2 text-right"><p className="font-semibold">{money(payment.amountPaise)}</p><p className="text-sm">Refunded: {money(payment.refundedPaise)}</p><Button variant="outline" size="sm" onClick={() => setSelected(payment)}>View refunds</Button></div></div>)}
    <Pager next={query.data?.nextCursor} back={cursors.length ? () => setCursors((v) => v.slice(0, -1)) : undefined} onNext={() => setCursors((v) => [...v, query.data!.nextCursor!])} />
  </Panel><FailedEvents kind="payments" />{selected && <Refunds payment={selected} close={() => setSelected(null)} />}</div>;
}
