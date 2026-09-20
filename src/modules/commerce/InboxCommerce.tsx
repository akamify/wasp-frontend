import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { CommerceProvider, useCommerce, useCommerceAction, useCommerceQuery, useWorkspaceId } from "./commerceContext";
import type { Attempt, Order, Page, Product } from "./types";
import { Check, EnvironmentPicker, ErrorNotice, label, money, Pager, QueryState, Status } from "./ui";
type Props = { to: string; disabled?: boolean; onSent: () => void };
function PaymentAction({ order, send, busy }: { order: Order; send: (input: Record<string, unknown>) => void; busy: boolean }) {
  const { can } = useCommerce(), [inspect, setInspect] = useState(false);
  const query = useCommerceQuery<{ attempt: Attempt }>(inspect && can("commerce.payments.view") && order.activeAttemptId ? `/payments/attempts/${order.activeAttemptId}` : null);
  return <div className="space-y-2 border-b py-3"><div className="flex flex-wrap justify-between gap-2"><Link to={`/app/commerce/orders/${order.id}`} className="font-semibold text-brand-700 underline">{order.orderNumber} · {money(order.totalPaise)}</Link><Status value={order.status} /></div>{!inspect && can("commerce.payments.view") && order.activeAttemptId && <Button size="sm" variant="outline" onClick={() => setInspect(true)}>View payment request</Button>}<QueryState {...query} />
    {!order.activeAttemptId && order.paymentStatus !== "captured" && <p className="text-sm">Open this order to review details and create its payment request.</p>}
    {query.data?.attempt && <p className="text-sm">Payment request: {label(query.data.attempt.status)}{query.data.attempt.mode === "whatsapp_native" ? ". Native checkout includes a Review and Pay send attempt. Inspect its delivery in this chat." : ""}</p>}
    {query.data?.attempt.lastError && <ErrorNotice message={label(query.data.attempt.lastError)} />}
    {query.data?.attempt.paymentUrl && <Button size="sm" variant="outline" disabled={busy} onClick={() => send({ kind: "payment_request", attemptId: query.data!.attempt.id })}>Send payment request</Button>}</div>;
}
function InboxActions({ to, onSent, disabled }: Props) {
  const { can, access, environment } = useCommerce(), action = useCommerceAction(), [tab, setTab] = useState("products"), [selected, setSelected] = useState<string[]>([]), [cursors, setCursors] = useState<string[]>([]), [notice, setNotice] = useState("");
  const products = useCommerceQuery<{ products: Product[]; nextCursor: string | null }>(tab === "products" && can("commerce.products.view") && access.capabilities.catalog ? "/products" : null, { limit: 25, cursor: cursors.at(-1) });
  const orders = useCommerceQuery<Page<Order>>(tab === "orders" && can("commerce.orders.view") && access.capabilities.payments ? "/orders/inbox" : null, { environment, to, limit: 25, cursor: cursors.at(-1) });
  const intent = useRef<{ fingerprint: string; idempotencyKey: string } | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const busy = !!disabled || action.busy || uncertain;
  function send(input: Record<string, unknown>) {
    const fingerprint = JSON.stringify({ ...input, to });
    if (intent.current?.fingerprint !== fingerprint) intent.current = { fingerprint, idempotencyKey: crypto.randomUUID() };
    // Retain the key after any ambiguous result; a fresh modal intent needs inbox inspection.
    setUncertain(true); setNotice("Delivery is being checked. Inspect the inbox before sending again.");
    void action.run<{ message: { status: string } }>("/messages", { ...input, to, idempotencyKey: intent.current.idempotencyKey }, (result) => {
      setNotice(result.message.status === "unknown" ? "Delivery is unknown. Check the inbox before sending again." : "Message submitted to WhatsApp."); onSent();
    });
  }
  if (!can("commerce.messages.send") || !can("inbox.reply")) return <p>This workspace role cannot send Commerce messages.</p>;
  if (!access.capabilities.catalog) return <p>Commerce catalog is not enabled.</p>;
  return <div className="space-y-4"><p className="text-sm">Customer: {to}. Sending requires an open WhatsApp customer service window.</p><EnvironmentPicker />
    <div className="flex gap-2"><Button variant={tab === "products" ? "primary" : "outline"} size="sm" onClick={() => { setTab("products"); setCursors([]); }}>Catalog</Button><Button variant={tab === "orders" ? "primary" : "outline"} size="sm" onClick={() => { setTab("orders"); setCursors([]); }}>Customer orders</Button></div>
    <ErrorNotice message={action.error} />{notice && <p role="status" className="rounded-md bg-blue-50 p-3 text-sm">{notice}</p>}
    {tab === "products" ? <><Button disabled={busy} variant="outline" onClick={() => send({ kind: "catalog" })}>Send catalog</Button><QueryState {...products} empty={!products.data?.products.length} />
      {products.data?.products.map((p) => <Check key={p.id} label={`${p.name} · ${money(p.pricePaise)} · ${p.syncStatus}`} checked={selected.includes(p.id)} disabled={busy || !p.available || p.syncStatus !== "synced" || p.revision !== p.syncedRevision || !!p.archivedAt || p.trackInventory && p.stockOnHand <= p.stockReserved || selected.length >= 30 && !selected.includes(p.id)} onChange={(v) => setSelected((old) => v ? [...old, p.id] : old.filter((id) => id !== p.id))} />)}
      <Button disabled={busy || !selected.length} onClick={() => send({ kind: selected.length === 1 ? "product" : "product_list", productIds: selected })}>Send {selected.length} selected product{selected.length === 1 ? "" : "s"}</Button>
      <Pager next={products.data?.nextCursor} back={cursors.length ? () => setCursors((v) => v.slice(0, -1)) : undefined} onNext={() => setCursors((v) => [...v, products.data!.nextCursor!])} />
    </> : <>{!access.capabilities.payments && <p className="text-sm">Payment operations are not enabled yet.</p>}<QueryState {...orders} empty={!orders.data?.items.length} />{orders.data?.items.map((order) => <PaymentAction key={order.id} order={order} busy={busy} send={send} />)}<Pager next={orders.data?.nextCursor} back={cursors.length ? () => setCursors((v) => v.slice(0, -1)) : undefined} onNext={() => setCursors((v) => [...v, orders.data!.nextCursor!])} /></>}
  </div>;
}
export default function InboxCommerce(props: Props) {
  const workspaceId = useWorkspaceId();
  return <CommerceProvider key={`${workspaceId}:${props.to}`} workspaceId={workspaceId}><InboxActions {...props} /></CommerceProvider>;
}
