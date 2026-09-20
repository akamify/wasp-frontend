import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import AddressFields, { emptyAddress } from "./AddressFields";
import { OrderDelivery } from "./DeliveryManagement";
import PaymentRequestButton from "./PaymentRequestButton";
import { useCommerce, useCommerceAction, useCommerceQuery } from "./commerceContext";
import type { Attempt, Gateway, Notification, Order, Page, Quote } from "./types";
import { Check, date, DisabledFeature, ErrorNotice, fieldClass, label, money, Pager, Panel, QueryState, Status } from "./ui";
const editable = (order: Order) => ["needs_details", "needs_review"].includes(order.status) && !order.activeAttemptId && order.paymentStatus !== "captured";
function OrderEdit({ order, close, saved }: { order: Order; close: () => void; saved: () => void }) {
  const { access } = useCommerce();
  const [method, setMethod] = useState(order.fulfillmentMethod || "pickup"), [address, setAddress] = useState(order.address || emptyAddress);
  const [delivery, setDelivery] = useState((order.deliveryPaise / 100).toFixed(2)), [tax, setTax] = useState(order.deliveryTaxRateBps == null ? "" : String(order.deliveryTaxRateBps / 100));
  const [items, setItems] = useState(order.items.map((i) => ({ sku: i.sku, quantity: i.quantity }))), action = useCommerceAction();
  return <Modal open title="Edit order details" onClose={() => !action.busy && close()}><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void action.run(`/orders/${order.id}`, {
    revision: order.revision, fulfillmentMethod: method, ...(method === "delivery" ? { address } : {}), deliveryPrice: method === "pickup" ? "0.00" : delivery,
    deliveryTaxRateBps: method === "pickup" || tax === "" ? null : Math.round(Number(tax) * 100), items }, saved, "PATCH"); }}>
    <fieldset disabled={action.busy} className="space-y-4"><p className="text-sm text-slate-500">Changes require a fresh review. Only products from the customer cart can be ordered.</p>
      {items.map((item, index) => <div key={item.sku} className="flex items-end gap-2"><Input label={`Quantity · ${item.sku}`} type="number" min={1} max={10000} step={1} required value={item.quantity} onChange={(e) => setItems((old) => old.map((v, n) => n === index ? { ...v, quantity: Number(e.target.value) } : v))} /><Button type="button" variant="ghost" disabled={items.length === 1} onClick={() => setItems((old) => old.filter((_, n) => n !== index))}>Remove</Button></div>)}
      <label className="block text-sm">Fulfillment<select className={fieldClass} value={method} onChange={(e) => setMethod(e.target.value as "pickup" | "delivery")}><option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></label>
      {method === "delivery" && <><AddressFields value={address} onChange={setAddress} locationRequired={access.capabilities.delivery} /><Input label="Delivery charge (INR, tax inclusive)" required pattern="[0-9]+(\.[0-9]{1,2})?" value={delivery} onChange={(e) => setDelivery(e.target.value)} /><Input label="Delivery tax rate % (blank if unspecified)" type="number" min="0" max="100" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} /></>}
    </fieldset><ErrorNotice message={action.error} /><Button type="submit" disabled={action.busy}>Save details</Button>
  </form></Modal>;
}
function Review({ order, refreshed }: { order: Order; refreshed: () => void }) {
  const query = useCommerceQuery<{ quote: Quote }>(`/orders/${order.id}/quote`), action = useCommerceAction(), [acknowledged, setAcknowledged] = useState(false);
  return <Panel title="Review current prices"><QueryState {...query} /><ErrorNotice message={action.error} />{query.data && <>
    {query.data.quote.items.map((item) => <div key={item.sku} className="flex justify-between gap-3 text-sm"><span>{item.quantity} × {item.name}</span><span>{money(item.grossPaise)}</span></div>)}
    <p className="font-semibold">Current total: {money(query.data.quote.totalPaise)}</p>
    {query.data.quote.warnings.map((warning, i) => <p key={i} className="text-sm text-amber-800">{label(warning)}</p>)}
    {query.data.quote.blockers.map((blocker, i) => <ErrorNotice key={i} message={label(blocker)} />)}
    <Check label="I have checked the items, total, fulfillment details and all warnings." checked={acknowledged} onChange={setAcknowledged} />
    <Button disabled={action.busy || !acknowledged || !!query.data.quote.blockers.length} onClick={() => action.run(`/orders/${order.id}/review`, { revision: order.revision, expectedTotalPaise: query.data!.quote.totalPaise, productRevisions: query.data!.quote.productRevisions, acknowledgeWarnings: true }, refreshed)}>Approve review</Button>
  </>}</Panel>;
}
function OrderPayments({ order, refreshed }: { order: Order; refreshed: () => void }) {
  const { can, access } = useCommerce(), action = useCommerceAction();
  const [cursors, setCursors] = useState<string[]>([]);
  const attempts = useCommerceQuery<Page<Attempt>>(`/orders/${order.id}/payment-requests`, { environment: order.environment, limit: 25, cursor: cursors.at(-1) });
  const notifications = useCommerceQuery<Page<Notification>>(`/orders/${order.id}/notifications`, { environment: order.environment, limit: 25 });
  const gateways = useCommerceQuery<{ gateways: Gateway[] }>(can("commerce.gateway.manage") && access.capabilities.gateway ? "/gateways" : null);
  const [gatewayId, setGatewayId] = useState(""), [confirmation, setConfirmation] = useState<string | null>(null), [started, setStarted] = useState(false);
  const [mode, setMode] = useState<Attempt["mode"]>("razorpay_payment_link");
  const intent = useRef<{ revision: number; gatewayConnectionId: string; idempotencyKey: string; mode: Attempt["mode"] } | null>(null);
  const refresh = () => { attempts.reload(); notifications.reload(); refreshed(); };
  return <Panel title="Payment requests" action={<Button size="sm" variant="outline" disabled={action.busy} onClick={refresh}>Refresh status</Button>}>
    <ErrorNotice message={action.error} /><QueryState {...attempts} empty={!attempts.data?.items.length} />
    {attempts.data?.items.map((attempt) => <div key={attempt.id} className="space-y-2 rounded-md border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><Status value={attempt.status} /><span className="text-sm">{money(attempt.amountPaise)} · Expires {date(attempt.expiresAt)}</span></div>
      {attempt.lastError && <p className="text-sm text-amber-800">{label(attempt.lastError)}</p>}
      <PaymentRequestButton key={attempt.id} attempt={attempt} to={order.customerPhone} onSent={notifications.reload} />
      {attempt.paymentUrl && <a href={attempt.paymentUrl} target="_blank" rel="noreferrer" className="block break-all text-sm text-brand-700 underline">{attempt.paymentUrl}</a>}
      {attempt.active && can("commerce.payments.manage") && <Button size="sm" variant="outline" disabled={action.busy} onClick={() => setConfirmation(attempt.id)}>Cancel payment request</Button>}
    </div>)}
    <Pager next={attempts.data?.nextCursor} back={cursors.length ? () => setCursors((v) => v.slice(0, -1)) : undefined} onNext={() => setCursors((v) => [...v, attempts.data!.nextCursor!])} />
    {can("commerce.payments.manage") && <Button size="sm" variant="outline" disabled={action.busy || !attempts.data?.items.length} onClick={() => action.run(`/orders/${order.id}/reconcile`, {}, refresh)}>Verify payment status</Button>}
    {can("commerce.payments.manage") && can("commerce.orders.manage") && editable(order) && !!order.reviewedAt && <div className="space-y-3 border-t pt-4">
      <p className="text-sm">Checkout uses this merchant's connected Razorpay account.</p>
      {order.environment === "live" && access.capabilities.native && can("commerce.messages.send") && can("inbox.reply") && <label className="block text-sm">Payment experience<select className={fieldClass} value={mode} disabled={started || action.busy} onChange={(e) => setMode(e.target.value as Attempt["mode"])}><option value="razorpay_payment_link">Hosted Razorpay Payment Link</option><option value="whatsapp_native">Native WhatsApp Review and Pay</option></select></label>}
      {mode === "whatsapp_native" && <p className="text-sm text-amber-800">Creating this request sends Review and Pay to the customer. Requires an open WhatsApp reply window, a verified configuration and administrator acceptance for this merchant and phone.</p>}
      {can("commerce.gateway.manage") ? <><QueryState {...gateways} /><label className="block text-sm">Merchant gateway<select className={fieldClass} value={gatewayId} disabled={started || action.busy} onChange={(e) => setGatewayId(e.target.value)}><option value="">Select a connected gateway</option>{gateways.data?.gateways.filter((g) => g.environment === order.environment && g.active && g.status === "connected").map((g) => <option key={g.id} value={g.id}>Razorpay · {g.authType} · {g.keyLabel || g.merchantAccountId} · {g.environment}</option>)}</select></label></>
        : <Input label="Merchant gateway connection ID (from workspace owner)" value={gatewayId} disabled={started} pattern="[a-fA-F0-9]{24}" onChange={(e) => setGatewayId(e.target.value)} />}
      <Button disabled={action.busy || !/^[a-fA-F0-9]{24}$/.test(gatewayId) || !access.capabilities.checkout} onClick={() => {
        if (!intent.current) intent.current = { revision: order.revision, gatewayConnectionId: gatewayId, idempotencyKey: crypto.randomUUID(), mode };
        setStarted(true); void action.run(`/orders/${order.id}/payment-requests`, intent.current, refresh);
      }}>{started ? "Check / retry same payment request" : `Create payment request · ${money(order.totalPaise)}`}</Button>
      {!access.capabilities.checkout && <p className="text-sm text-amber-800">New checkout is currently disabled.</p>}
    </div>}
    <div className="space-y-2 border-t pt-4"><h3 className="text-sm font-semibold">Payment confirmations</h3><QueryState {...notifications} empty={!notifications.data?.items.length} />{notifications.data?.items.map((n) => <div key={n.id} className="flex flex-wrap items-center gap-3 text-sm"><Status value={n.status} /><span>{n.lastError && label(n.lastError)}</span>{n.status === "blocked" && can("commerce.messages.send") && <Button size="sm" variant="outline" disabled={action.busy} onClick={() => action.run(`/notifications/${n.id}/retry`, {}, notifications.reload)}>Retry confirmation</Button>}{n.status === "unknown" && <span>Check the inbox before contacting the customer again.</span>}</div>)}</div>
    {confirmation && <Modal open title="Cancel payment request" onClose={() => !action.busy && setConfirmation(null)}><p className="mb-4 text-sm">A captured payment remains paid. Uncertain native cancellation needs merchant review and blocks replacement checkout. Inventory reservations still expire at their scheduled time.</p><ErrorNotice message={action.error} /><Button variant="danger" disabled={action.busy} onClick={() => action.run(`/payments/attempts/${confirmation}/cancel`, {}, () => { setConfirmation(null); refresh(); })}>Request cancellation</Button></Modal>}
  </Panel>;
}
function OrderDetail({ id }: { id: string }) {
  const { can, access } = useCommerce(), query = useCommerceQuery<{ order: Order }>(`/orders/${id}`), action = useCommerceAction();
  const [edit, setEdit] = useState(false), [cancel, setCancel] = useState(false), [link, setLink] = useState(""), [ack, setAck] = useState(false);
  const order = query.data?.order, manage = can("commerce.orders.manage");
  const next = order && ({ confirmed: "processing", processing: order.fulfillmentMethod === "pickup" ? "ready" : "out_for_delivery", ready: "completed", out_for_delivery: "completed" } as Record<string, string>)[order.status];
  return <div className="space-y-5"><Link className="text-sm text-brand-700 underline" to="/app/commerce/orders">Back to orders</Link><QueryState {...query} /><ErrorNotice message={action.error} />{order && <>
    <Panel title={`Order ${order.orderNumber}`} action={<Button size="sm" variant="outline" onClick={query.reload}>Refresh</Button>}>
      <div className="flex flex-wrap gap-2"><Status value={order.status} /><Status value={order.paymentStatus} /><Status value={order.environment} /></div>
      <p className="text-sm">{order.customerName} · {order.customerPhone} · {date(order.receivedAt)}</p>
      {order.items.map((item) => <div key={item.sku} className="flex justify-between gap-4 text-sm"><span>{item.quantity} × {item.name} <span className="text-slate-500">({item.sku})</span></span><span className="whitespace-nowrap">{money(item.grossPaise)}</span></div>)}
      <div className="border-t pt-3 text-sm space-y-1"><p>Delivery: {money(order.deliveryPaise)}</p><p className="font-bold">Total: {money(order.totalPaise)}</p><p>Included tax: {money(order.includedTaxPaise)}</p><p>Fulfillment: {order.fulfillmentMethod || "Details needed"}</p></div>
      {order.address && <address className="text-sm not-italic whitespace-pre-line">{[order.address.name, order.address.phone, order.address.line1, order.address.line2, `${order.address.city}, ${order.address.state} ${order.address.postalCode}`].filter(Boolean).join("\n")}</address>}
      {order.customerNote && <p className="text-sm whitespace-pre-wrap">Customer note: {order.customerNote}</p>}
      {!!order.attentionReason && <ErrorNotice message={label(order.attentionReason)} />}
      <div className="flex flex-wrap gap-2"><Link className="text-sm text-brand-700 underline py-2" to={`/app/conversations/${order.customerPhone}`}>Open customer inbox</Link>
        {manage && editable(order) && <><Button size="sm" variant="outline" onClick={() => setEdit(true)}>Edit details</Button><Button size="sm" variant="outline" disabled={action.busy} onClick={() => action.run<{ token: string }>(`/orders/${id}/fulfillment-session`, { revision: order.revision }, (r) => setLink(`${window.location.origin}/commerce/fulfillment#${r.token}`))}>Create customer details link</Button><Button size="sm" variant="ghost" onClick={() => setCancel(true)}>Cancel order</Button></>}
        {manage && next && !order.manualDeliveryId && access.capabilities.payments && <Button disabled={action.busy} onClick={() => action.run(`/orders/${id}/fulfillment`, { revision: order.revision, status: next }, query.reload)}>Mark {label(next)}</Button>}
      </div>{link && <div className="space-y-2"><p className="text-sm">Share privately with this customer. One use; expires in 30 minutes. Creating another link or changing the order invalidates it.</p><Input label="Customer details link" readOnly value={link} onFocus={(e) => e.target.select()} /></div>}
      {manage && order.status === "requires_attention" && order.attentionReason === "payment_after_stock_release" && <div className="space-y-3"><Check label="Payment arrived after stock was released. I want to allocate available stock and confirm fulfillment." checked={ack} onChange={setAck} /><Button disabled={action.busy || !ack} onClick={() => action.run(`/orders/${id}/fulfillment`, { revision: order.revision, status: "confirmed", acknowledgeAttention: true }, query.reload)}>Allocate stock and confirm</Button></div>}
    </Panel>
    {access.capabilities.delivery && can("commerce.delivery.manage") && order.fulfillmentMethod === "delivery" && <OrderDelivery key={`delivery:${order.id}:${order.revision}`} orderId={order.id} revision={order.revision} refreshed={query.reload} />}
    {manage && editable(order) && <Review key={order.revision} order={order} refreshed={() => { setLink(""); query.reload(); }} />}
    {can("commerce.payments.view") && access.capabilities.payments && <OrderPayments key={order.revision} order={order} refreshed={query.reload} />}
    {edit && <OrderEdit key={order.revision} order={order} close={() => setEdit(false)} saved={() => { setEdit(false); setLink(""); query.reload(); }} />}
    {cancel && <Modal open title="Cancel order" onClose={() => !action.busy && setCancel(false)}><p className="mb-4">Cancel this unpaid order?</p><ErrorNotice message={action.error} /><Button variant="danger" disabled={action.busy} onClick={() => action.run(`/orders/${id}/cancel`, { revision: order.revision }, () => { setCancel(false); query.reload(); })}>Cancel order</Button></Modal>}
  </>}</div>;
}
function OrderList() {
  const { environment } = useCommerce(), [status, setStatus] = useState(""), [cursors, setCursors] = useState<string[]>([]);
  const query = useCommerceQuery<Page<Order>>("/orders", { environment, status: status || undefined, limit: 25, cursor: cursors.at(-1) });
  return <Panel title="Customer orders" action={<Button variant="outline" size="sm" onClick={query.reload}>Refresh</Button>}>
    <label className="block max-w-xs text-sm">Order status<select className={fieldClass} value={status} onChange={(e) => { setStatus(e.target.value); setCursors([]); }}><option value="">All statuses</option>{["needs_details", "needs_review", "awaiting_payment", "confirmed", "processing", "ready", "out_for_delivery", "completed", "cancelled", "requires_attention"].map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
    <QueryState {...query} empty={!query.data?.items.length} /><div className="divide-y divide-slate-100">{query.data?.items.map((order) => <Link key={order.id} to={`/app/commerce/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-slate-50"><div><p className="font-semibold">{order.orderNumber}</p><p className="text-sm text-slate-500">{order.customerName || order.customerPhone} · {date(order.receivedAt)}</p></div><div className="flex flex-wrap items-center gap-3"><Status value={order.status} /><Status value={order.paymentStatus} /><span className="font-semibold">{money(order.totalPaise)}</span></div></Link>)}</div>
    <Pager next={query.data?.nextCursor} back={cursors.length ? () => setCursors((v) => v.slice(0, -1)) : undefined} onNext={() => setCursors((v) => [...v, query.data!.nextCursor!])} />
  </Panel>;
}
export default function OrdersPage({ id }: { id?: string }) { const { access } = useCommerce(); return !access.capabilities.orders ? <DisabledFeature name="Orders" /> : id ? <OrderDetail id={id} /> : <OrderList />; }
