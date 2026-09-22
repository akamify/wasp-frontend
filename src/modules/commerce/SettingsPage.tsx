import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { API } from "@api/api";
import { useCommerce, useCommerceAction, useCommerceQuery } from "./commerceContext";
import type { Catalog, Gateway, OrderSettings, PaymentSettings } from "./types";
import { Check, date, ErrorNotice, fieldClass, Panel, QueryState, Status } from "./ui";
import { FailedEvents } from "./PaymentsPage";
import { CreateCatalog } from "./CreateCatalog";
function CatalogSettings() {
  const { can } = useCommerce(), query = useCommerceQuery<{ catalog: Catalog | null }>("/catalog"), action = useCommerceAction();
  const [listing, setListing] = useState(false), [cursor, setCursor] = useState<string>(), [catalogId, setCatalogId] = useState(""), [dedicated, setDedicated] = useState(false), [disconnect, setDisconnect] = useState(false);
  const catalogs = useCommerceQuery<{ catalogs: { id: string; name: string }[]; cursor: string | null }>(listing ? "/catalogs" : null, { cursor });
  const catalog = query.data?.catalog, manage = can("commerce.catalog.manage");
  return <Panel title="WhatsApp catalog" action={<Button size="sm" variant="outline" onClick={query.reload}>Refresh status</Button>}><QueryState {...query} /><ErrorNotice message={action.error} />
    {query.data && !catalog && manage && <CreateCatalog connected={query.reload} />}
    {catalog ? <><div className="space-y-2 text-sm"><Status value={catalog.status} /><p>Catalog {catalog.catalogId} · Phone ID {catalog.phoneNumberId}</p><p>Last checked: {date(catalog.lastCheckedAt)}</p>{catalog.activePhoneMatches === false && <ErrorNotice message="This catalog belongs to a different WhatsApp phone. Reconnect its original phone or disconnect the catalog." />}{catalog.lastError && <ErrorNotice message={catalog.lastError} />}</div>
      <Check label="Show catalog on WhatsApp" checked={catalog.catalogVisible} disabled={!manage || action.busy} onChange={(v) => action.run("/catalog/settings", { revision: catalog.revision, catalogVisible: v, cartEnabled: catalog.cartEnabled }, query.reload, "PATCH")} />
      <Check label="Allow customers to send carts" checked={catalog.cartEnabled} disabled={!manage || action.busy} onChange={(v) => action.run("/catalog/settings", { revision: catalog.revision, catalogVisible: catalog.catalogVisible, cartEnabled: v }, query.reload, "PATCH")} />
      {manage && <div className="flex gap-2"><Button size="sm" variant="outline" disabled={action.busy} onClick={() => action.run("/catalog/refresh", { revision: catalog.revision }, query.reload)}>Check Meta settings</Button><Button size="sm" variant="ghost" onClick={() => setDisconnect(true)}>Disconnect catalog</Button></div>}
    </> : query.data && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void action.run("/catalog", { catalogId, confirmDedicatedCatalog: dedicated }, query.reload, "PUT"); }}><p className="text-sm">Connect a dedicated, empty catalog owned by your current WhatsApp business. AIWizChat will create the missing WhatsApp account link after verifying ownership.</p>
      {manage && <><Button type="button" variant="outline" size="sm" onClick={() => setListing(true)}>Find linked catalogs</Button>{listing && <><QueryState {...catalogs} empty={!catalogs.data?.catalogs.length} />{catalogs.data?.catalogs.map((c) => <Button key={c.id} type="button" variant="ghost" onClick={() => setCatalogId(c.id)}>{c.name} · {c.id}</Button>)}{catalogs.data?.cursor && <Button type="button" variant="outline" size="sm" onClick={() => setCursor(catalogs.data!.cursor!)}>More catalogs</Button>}</>}
        <Input label="Catalog ID" required pattern="[0-9]{1,30}" value={catalogId} onChange={(e) => setCatalogId(e.target.value)} /><Check label="This is a dedicated catalog managed by AIWizChat." checked={dedicated} onChange={setDedicated} /><Button type="submit" disabled={action.busy || !dedicated}>Connect catalog</Button></>}
    </form>}
    {disconnect && catalog && <Modal open title="Disconnect catalog" onClose={() => !action.busy && setDisconnect(false)}><p className="mb-4 text-sm">New Commerce operations on this catalog will stop. Historical orders remain available.</p><ErrorNotice message={action.error} /><Button variant="danger" disabled={action.busy} onClick={() => action.run("/catalog", { revision: catalog.revision }, () => { setDisconnect(false); query.reload(); }, "DELETE")}>Disconnect</Button></Modal>}
  </Panel>;
}
function OrderSettingsForm({ settings, saved }: { settings: OrderSettings; saved: () => void }) {
  const { can } = useCommerce(), action = useCommerceAction(), [form, setForm] = useState(settings), [recipients, setRecipients] = useState(settings.testRecipients.join("\n"));
  return <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void action.run("/orders/settings", { revision: settings.revision, enabled: form.enabled, pickupEnabled: form.pickupEnabled, deliveryEnabled: form.deliveryEnabled, pickupInstructions: form.pickupInstructions, testRecipients: recipients.split(/[\n,]/).map((v) => v.trim()).filter(Boolean) }, saved, "PATCH"); }}>
    <fieldset disabled={!can("commerce.orders.manage") || action.busy} className="space-y-3">{([ ["enabled", "Accept customer carts"], ["pickupEnabled", "Offer pickup"], ["deliveryEnabled", "Offer delivery"] ] as const).map(([key, text]) => <Check key={key} label={text} checked={form[key]} onChange={(v) => setForm((old) => ({ ...old, [key]: v }))} />)}
      <label className="block text-sm">Pickup instructions<textarea className={fieldClass} maxLength={1000} value={form.pickupInstructions} onChange={(e) => setForm((v) => ({ ...v, pickupInstructions: e.target.value }))} /></label>
      <label className="block text-sm">Test recipient phones (country code, one per line; maximum 20)<textarea className={fieldClass} rows={3} value={recipients} onChange={(e) => setRecipients(e.target.value)} /></label><p className="text-sm text-slate-500">Carts from these numbers create test orders. Other customers create live orders.</p>
      {can("commerce.orders.manage") && <Button type="submit" disabled={action.busy}>Save order settings</Button>}
    </fieldset><ErrorNotice message={action.error} />
  </form>;
}
function CheckoutSettingsForm({ settings, saved }: { settings: PaymentSettings; saved: () => void }) {
  const { can } = useCommerce(), action = useCommerceAction(), [live, setLive] = useState(settings.liveCheckoutEnabled), [minutes, setMinutes] = useState(settings.reservationMinutes);
  return <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void action.run("/payments/settings", { revision: settings.revision, liveCheckoutEnabled: live, reservationMinutes: minutes }, saved, "PATCH"); }}><p className="text-sm">Platform checkout: {settings.checkoutEnabled ? "enabled" : "disabled"} · Platform live payments: {settings.liveEnabled ? "enabled" : "disabled"}</p>
    {settings.revision === 0 && <p className="text-sm text-amber-800">Save order settings first to initialize Commerce. Ask the workspace owner if you cannot manage orders.</p>}
    <fieldset disabled={!can("commerce.payments.manage") || action.busy || settings.revision === 0} className="space-y-3"><Check label="Enable live checkout for this workspace" checked={live} onChange={setLive} /><Input label="Inventory reservation (minutes)" type="number" required min={5} max={120} step={1} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /><p className="text-sm text-slate-500">Live hosted payments support verified manual API keys without OAuth. Configure the payment webhook and enable platform live checkout. Native WhatsApp payments require additional verified account identity and webhook health.</p>{can("commerce.payments.manage") && <Button type="submit" disabled={action.busy || settings.revision === 0}>Save checkout settings</Button>}</fieldset><ErrorNotice message={action.error} />
  </form>;
}
function GatewayCard({ gateway, refreshed }: { gateway: Gateway; refreshed: () => void }) {
  const [configurationName, setConfigurationName] = useState(gateway.nativeConfigurationName || ""), [nativeNotice, setNativeNotice] = useState("");
  const { access } = useCommerce(), action = useCommerceAction(), [confirm, setConfirm] = useState(false), [secret, setSecret] = useState<{ secret: string; webhookPath: string; events: string[] } | null>(null);
  const [showSecret, setShowSecret] = useState(false), [proof, setProof] = useState({ oauthGatewayConnectionId: "", providerPaymentId: "" });
  return <div className="rounded-md border border-slate-200 p-4 space-y-3"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Razorpay · {gateway.environment} · {gateway.authType === "api_keys" ? "Manual API keys" : "OAuth"}</h3><Status value={gateway.status} /></div>
    <p className="text-sm break-all">Connection ID: {gateway.id}</p><p className="text-sm">{gateway.keyLabel} · Identity {gateway.identityVerified ? "verified" : "unverified"} · Webhook {gateway.webhookStatus}</p>{gateway.authType === "api_keys" && <p className="text-sm">Manual API keys: Partner OAuth is not required for hosted payments. Account identity status below applies to native WhatsApp eligibility, not hosted payment access.</p>}{gateway.merchantAccountId && <p className="text-sm">Merchant: {gateway.merchantAccountId}</p>}
    {!!gateway.lastErrorCode && <ErrorNotice message={gateway.lastErrorCode} />}<ErrorNotice message={action.error} />
    {gateway.environment === "live" && gateway.active && <details className="text-sm"><summary className="cursor-pointer font-semibold">Native WhatsApp payments</summary>
      <p className="my-3">In WhatsApp Manager, link this merchant's Razorpay account under Payment configurations. This is a separate authorization from connecting Razorpay to AIWizChat.</p>
      <p>Last configuration check: {gateway.nativePaymentStatus}. Eligibility is checked again for each native checkout.</p>
      <form className="space-y-3 mt-3" onSubmit={(e) => { e.preventDefault(); void action.run<{ acceptedBinding: boolean }>(`/gateways/${gateway.id}/native`, { revision: gateway.revision, configurationName }, (value) => { setNativeNotice(value.acceptedBinding ? "Configuration verified. Native checkout is available subject to order and message checks." : "Configuration verified. Administrator acceptance for this merchant and WhatsApp phone is still required."); refreshed(); }); }}>
        <Input label="Meta payment configuration name" required maxLength={60} value={configurationName} onChange={(e) => setConfigurationName(e.target.value)} />
        <Button type="submit" size="sm" disabled={action.busy || !gateway.identityVerified}>Verify native configuration</Button>
      </form>{!gateway.identityVerified && <p className="mt-2">Verify the merchant identity first.</p>}{nativeNotice && <p role="status" className="mt-2">{nativeNotice}</p>}
    </details>}
    <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={action.busy} onClick={() => action.run(`/gateways/${gateway.id}/verify`, { revision: gateway.revision }, refreshed)}>Verify credentials</Button>
      {access.capabilities.payments && <Button size="sm" variant="outline" disabled={action.busy || !!secret} onClick={() => action.run<{ secret: string; webhookPath: string; events: string[] }>(`/payments/gateways/${gateway.id}/webhook`, { revision: gateway.revision }, (value) => { setSecret(value); })}>Generate webhook secret</Button>}
      <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>Disconnect</Button></div>
    {gateway.authType === "api_keys" && !gateway.identityVerified && access.capabilities.payments && <details className="text-sm"><summary className="cursor-pointer font-semibold">Optional account identity proof for native WhatsApp payments</summary><p className="my-3">Use a verified OAuth connection from this workspace and a payment belonging to that same merchant. This is not required for hosted Payment Links using manual API keys. Native WhatsApp payments require separate account identity proof.</p><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void action.run(`/payments/gateways/${gateway.id}/verify-identity`, { revision: gateway.revision, ...proof }, refreshed); }}><Input label="Verified OAuth connection ID" required pattern="[a-fA-F0-9]{24}" value={proof.oauthGatewayConnectionId} onChange={(e) => setProof((v) => ({ ...v, oauthGatewayConnectionId: e.target.value }))} /><Input label="Razorpay payment ID" required pattern="pay_[A-Za-z0-9]{1,80}" value={proof.providerPaymentId} onChange={(e) => setProof((v) => ({ ...v, providerPaymentId: e.target.value }))} /><Button type="submit" size="sm" disabled={action.busy}>Verify identity</Button></form></details>}
    {secret && <Modal open title="Configure Razorpay payment webhook" onClose={() => { setSecret(null); setShowSecret(false); refreshed(); }}><div className="space-y-3"><p className="text-sm">Save this secret in your merchant's Razorpay webhook settings. It is shown only once. Webhook health becomes verified after a signed event is processed and its payment is checked with Razorpay. Manual-key hosted checkout can create the first payment while webhook health is pending; save these settings in Razorpay before accepting payments.</p>
      <Input label="Webhook URL" readOnly value={new URL(secret.webhookPath, new URL(API.baseUrl, window.location.origin)).href} onFocus={(e) => e.target.select()} />
      <Input label="Webhook secret" type={showSecret ? "text" : "password"} readOnly autoComplete="off" value={secret.secret} onFocus={(e) => e.target.select()} /><Check label="Show secret" checked={showSecret} onChange={setShowSecret} /><p className="text-sm break-words">Subscribe to: {secret.events.join(", ")}</p><Button onClick={() => { setSecret(null); setShowSecret(false); refreshed(); }}>I have saved the webhook settings</Button>
    </div></Modal>}
    {confirm && <Modal open title="Disconnect merchant gateway" onClose={() => !action.busy && setConfirm(false)}><p className="mb-4 text-sm">New checkout on this connection stops. Historical payment reconciliation remains available. Revoke app authorization separately in Razorpay if needed.</p><ErrorNotice message={action.error} /><Button variant="danger" disabled={action.busy} onClick={() => action.run(`/gateways/${gateway.id}/disconnect`, { revision: gateway.revision }, () => { setConfirm(false); refreshed(); })}>Disconnect gateway</Button></Modal>}
  </div>;
}
function GatewaySettings() {
  const { environment, access } = useCommerce(), query = useCommerceQuery<{ gateways: Gateway[] }>("/gateways"), action = useCommerceAction();
  const [keys, setKeys] = useState({ keyId: "", keySecret: "" }), [notice, setNotice] = useState("");
  return <Panel title="Merchant payment gateway" action={<Button size="sm" variant="outline" onClick={query.reload}>Refresh</Button>}><p className="text-sm text-slate-500">Connect the merchant's own Razorpay account for {environment} payments. Credentials are encrypted and never stored in your browser.</p><QueryState {...query} /><ErrorNotice message={action.error} />
    {query.data?.gateways.filter((g) => g.environment === environment).map((gateway) => <GatewayCard key={gateway.id} gateway={gateway} refreshed={query.reload} />)}
    {!query.loading && !query.error && !query.data?.gateways.some((g) => g.environment === environment && g.active) && <form className="space-y-3 border-t pt-4" onSubmit={(e) => { e.preventDefault(); const input = { environment, ...keys }; setKeys({ keyId: "", keySecret: "" }); void action.run("/gateways/manual", input, query.reload); }}>
      <h3 className="font-semibold">Connect with manual API keys</h3><Input label={`Razorpay ${environment} key ID`} autoComplete="off" required pattern={`rzp_${environment}_[A-Za-z0-9]+`} value={keys.keyId} onChange={(e) => setKeys((v) => ({ ...v, keyId: e.target.value }))} /><Input label="Razorpay key secret" type="password" autoComplete="new-password" required value={keys.keySecret} onChange={(e) => setKeys((v) => ({ ...v, keySecret: e.target.value }))} /><Button type="submit" disabled={action.busy}>Connect manual keys</Button>
      {access.capabilities.oauth && <Button type="button" variant="outline" disabled={action.busy} onClick={() => action.run<{ authorizationUrl: string }>("/gateways/oauth/start", { environment }, (value) => { const url = new URL(value.authorizationUrl); if (url.protocol === "https:" && url.hostname === "auth.razorpay.com") window.location.assign(url.href); else setNotice("OAuth authorization URL was rejected. Contact your administrator."); })}>Connect with Razorpay OAuth</Button>}
    </form>}{notice && <ErrorNotice message={notice} />}<p className="text-sm text-slate-500">Native WhatsApp payments require a verified live configuration and administrator acceptance for your merchant account and WhatsApp phone. Hosted Payment Links support test and live manual API keys without Partner OAuth, subject to checkout settings and webhook setup.</p>
  </Panel>;
}
export default function SettingsPage() {
  const { can, access } = useCommerce();
  const [search] = useSearchParams(), oauthResult = search.get("oauth");
  const orders = useCommerceQuery<{ settings: OrderSettings }>(can("commerce.orders.view") && access.capabilities.orders ? "/orders/settings" : null);
  const payments = useCommerceQuery<{ settings: PaymentSettings }>(can("commerce.payments.view") && access.capabilities.payments ? "/payments/settings" : null);
  // Both forms share the same settings revision on the server.
  const refreshSettings = () => { orders.reload(); payments.reload(); };
  return <div className="space-y-5">
    {["connected", "cancelled"].includes(oauthResult || "") && <p role="status" className="rounded-md bg-blue-50 p-3 text-sm">OAuth authorization returned. Review the connection status in the workspace and environment where you started setup.</p>}
    {can("commerce.catalog.view") && (access.capabilities.catalog ? <CatalogSettings /> : <p className="text-sm text-slate-500">Catalog setup is not enabled by the platform.</p>)}
    {can("commerce.orders.view") && access.capabilities.orders && <><Panel title="Orders and fulfillment" action={<Button size="sm" variant="outline" onClick={refreshSettings}>Refresh settings</Button>}><QueryState {...orders} />{orders.data && <OrderSettingsForm key={orders.data.settings.revision} settings={orders.data.settings} saved={refreshSettings} />}</Panel><FailedEvents kind="orders" /></>}
    {can("commerce.gateway.manage") && (access.capabilities.gateway ? <GatewaySettings /> : <p className="text-sm text-slate-500">Gateway connection is not enabled by the platform.</p>)}
    {can("commerce.payments.view") && access.capabilities.payments && <Panel title="Checkout settings" action={<Button size="sm" variant="outline" onClick={refreshSettings}>Refresh settings</Button>}><QueryState {...payments} />{payments.data && <CheckoutSettingsForm key={payments.data.settings.revision} settings={payments.data.settings} saved={refreshSettings} />}</Panel>}
  </div>;
}
