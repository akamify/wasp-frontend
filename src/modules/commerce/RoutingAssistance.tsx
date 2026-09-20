import { useEffect, useState } from "react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useCommerce, useCommerceAction, useCommerceQuery } from "./commerceContext";
import { date, ErrorNotice, fieldClass, Panel, QueryState } from "./ui";

export type DispatchConfig = { revision: number; batchPriority?: string; branchAutoSelect?: boolean; pickupRadiusMetres: number; locationMaxAgeSeconds: number; maxAccuracyMetres: number; routeShortlist: number; offerSeconds: number; routingEnabled: boolean; newDispatchEnabled: boolean; strategy: string; autoDispatch: boolean; autoDispatchAvailable: boolean; handoverSeconds: number; allowedVehicles: string[] };
type Candidate = { courierId: string; name: string; vehicle: string; gpsAt: string; accuracyMetres: number; pickupEtaSeconds: number; pickupRoadMetres: number; customerDirectEtaSeconds: number | null; deliveryEtaSeconds: number | null; fallback: boolean };
type Recommendation = { mode: string; deliveryRevision: number; generatedAt: string; expiresAt: string; warning: string; candidates: Candidate[]; suggestedCourierId: string | null };
const minutes = (seconds: number | null) => seconds == null ? "Unavailable" : `${Math.ceil(seconds / 60)} min`;
export function RecommendationResults({ result, disabled, onSelect }: { result: Recommendation; disabled: boolean; onSelect: (c: Candidate) => void }) {
  return <div className="space-y-3"><p className="text-sm">Road estimates from <span translate="no" className="whitespace-nowrap font-normal text-[#5e5e5e]">Google Maps</span> - {date(result.generatedAt)}. Estimates may change.</p>
    <ErrorNotice message={result.warning} />{!result.candidates.length && <p>No eligible riders with valid routes. Refresh GPS or use manual dispatch.</p>}
    {result.candidates.map((c) => <div className="rounded border p-3 space-y-1" key={c.courierId}><p className="font-semibold">{c.name} {result.suggestedCourierId === c.courierId && "(Suggested Rider)"}</p>
      <p className="text-sm">{c.vehicle} - Pickup: {minutes(c.pickupEtaSeconds)}, {(c.pickupRoadMetres / 1000).toFixed(1)} km by road. Customer direct: {minutes(c.customerDirectEtaSeconds)}. Delivery via pickup, preparation and handover: {minutes(c.deliveryEtaSeconds)}.</p>
      <p className="text-xs">GPS {date(c.gpsAt)}, uncertainty {c.accuracyMetres} m.{c.fallback && " Google returned a fallback route estimate."}</p>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => onSelect(c)}>Select {c.name}</Button></div>)}
    <p className="text-sm">Selecting a recommendation does not assign the rider. Confirm with “Offer delivery to rider” below. Bicycle and two-wheeler routes may omit clear paths; follow local road signs and use caution.</p>
  </div>;
}
export function RoutingAssistance({ deliveryId, revision, onSelect }: { deliveryId: string; revision: number; onSelect: (c: { courierId: string; name: string }) => void }) {
  const settings = useCommerceQuery<DispatchConfig>("/delivery-settings"), action = useCommerceAction();
  const [selectedMode, setMode] = useState<string | null>(null), [result, setResult] = useState<Recommendation | null>(null), [clock, setClock] = useState(Date.now());
  const mode = selectedMode || (({ NEAREST_PICKUP: "nearest_pickup", NEAREST_CUSTOMER: "nearest_customer" } as Record<string, string>)[settings.data?.strategy || ""] || "smart");
  useEffect(() => { if (!result) return; const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, [result]);
  if (!settings.data?.routingEnabled) return settings.error ? <ErrorNotice message={settings.error} retry={settings.reload} /> : null;
  const expired = !!result && (result.deliveryRevision !== revision || Date.parse(result.expiresAt) <= clock || result.mode !== mode);
  return <section className="space-y-3 rounded border p-3"><h3 className="font-semibold">Routing assistance</h3>
    <p className="text-sm">Shortlist up to {settings.data.routeShortlist} eligible riders within {settings.data.pickupRadiusMetres / 1000} km of pickup. Auto Dispatch {settings.data.autoDispatch && settings.data.autoDispatchAvailable && settings.data.strategy !== "MANUAL" ? "ON" : "OFF"}. Manual recommendations are calculated when requested.</p>
    <label>Rank riders by<select className={fieldClass} disabled={action.busy} value={mode} onChange={(e) => { setMode(e.target.value); setResult(null); }}><option value="smart">SMART - Suggested Rider (recommended)</option><option value="nearest_pickup">Nearest Pickup</option><option value="nearest_customer">Nearest Customer</option></select></label>
    <p className="text-sm">Nearest Customer compares direct rider-to-customer ETA. SMART includes pickup, remaining preparation, handover and outlet-to-customer travel.</p>
    <Button variant="outline" disabled={action.busy} onClick={() => { setResult(null); void action.run<Recommendation>(`/deliveries/${deliveryId}/recommendations`, { revision, mode }, (data) => { setClock(Date.now()); setResult(data); }); }}>{action.busy ? "Calculating road ETAs..." : "Get recommendations"}</Button>
    <ErrorNotice message={action.error} />{expired && <p role="status">Recommendation expired or delivery changed. Request fresh estimates.</p>}
    {result && <RecommendationResults result={result} disabled={expired || action.busy} onSelect={onSelect} />}
  </section>;
}
const fields = [
  ["pickupRadiusMetres", "Pickup radius (metres)", 100, 50000], ["locationMaxAgeSeconds", "Location freshness (seconds)", 15, 300],
  ["maxAccuracyMetres", "Maximum GPS uncertainty (metres)", 1, 1000], ["routeShortlist", "Route shortlist (riders)", 1, 20], ["offerSeconds", "Offer lifetime (seconds)", 10, 120],
  ["handoverSeconds", "Handover allowance (seconds)", 0, 1800],
] as const;
function SettingsForm({ config, reload }: { config: DispatchConfig; reload: () => void }) {
  const [form, setForm] = useState(() => ({ ...Object.fromEntries(fields.map(([key]) => [key, config[key] ?? (key === "handoverSeconds" ? 120 : 0)])) as Pick<DispatchConfig, typeof fields[number][0]>, branchAutoSelect: config.branchAutoSelect || false, batchPriority: config.batchPriority || "nearest_pickup", strategy: config.strategy || "SMART", autoDispatch: config.autoDispatch || false, allowedVehicles: config.allowedVehicles || ["motorcycle", "bicycle", "car"] }));
  const action = useCommerceAction(), { can } = useCommerce();
  return <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void action.run("/delivery-settings", { ...form, revision: config.revision }, reload, "PUT"); }}>
    <fieldset disabled={!config.routingEnabled || !can("commerce.delivery.manage") || action.busy} className="grid gap-3 sm:grid-cols-2">
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.branchAutoSelect} onChange={(e) => setForm({ ...form, branchAutoSelect: e.target.checked })} />Automatically select nearest eligible branch after customer location confirmation</label>
      <label>Batch assignment priority<select className={fieldClass} value={form.batchPriority} onChange={(e) => setForm({ ...form, batchPriority: e.target.value })}><option value="nearest_pickup">Nearest restaurant pickup first</option><option value="existing_batch">Fill compatible loading trips first</option></select></label>
      <label>Dispatch strategy<select className={fieldClass} value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value, ...(e.target.value === "MANUAL" ? { autoDispatch: false } : {}) })}><option value="SMART">SMART (recommended)</option><option value="NEAREST_PICKUP">Nearest Pickup</option><option value="NEAREST_CUSTOMER">Nearest Customer</option><option value="MANUAL">Manual</option></select></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.autoDispatch} disabled={!config.autoDispatchAvailable && !form.autoDispatch || form.strategy === "MANUAL"} onChange={(e) => setForm({ ...form, autoDispatch: e.target.checked })} />Auto Dispatch ON/OFF</label>
      <p className="text-sm sm:col-span-2">OFF: suggest riders for merchant confirmation. ON: offer to the best eligible rider; the rider must still accept. Manual takeover is always available. Existing offers remain valid when this switch is turned OFF.</p>
      <div className="sm:col-span-2">Allowed vehicles{["motorcycle", "bicycle", "car"].map((vehicle) => <label className="ml-3 inline-flex gap-1" key={vehicle}><input type="checkbox" checked={form.allowedVehicles.includes(vehicle)} onChange={(e) => setForm({ ...form, allowedVehicles: e.target.checked ? [...form.allowedVehicles, vehicle] : form.allowedVehicles.filter((v) => v !== vehicle) })} />{vehicle}</label>)}</div>
      {fields.map(([key, title, min, max]) => <Input key={key} label={title} required type="number" step={1} min={min} max={max} value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />)}</fieldset>
    {!config.autoDispatchAvailable && <p>Automatic dispatch is unavailable on this server. Manual dispatch remains available.</p>}
    <ErrorNotice message={action.error} retry={reload} />{config.routingEnabled && can("commerce.delivery.manage") && <Button type="submit" disabled={action.busy}>Save dispatch settings</Button>}
  </form>;
}
export function DispatchSettings() {
  const query = useCommerceQuery<DispatchConfig>("/delivery-settings");
  return <Panel title="Dispatch Settings"><QueryState {...query} />{query.data && <><p>{query.data.newDispatchEnabled ? "New offers enabled" : "New offers paused"}. Rider acceptance is always required.</p>
    <p>{query.data.routingEnabled ? "Routing assistance enabled. Changes apply to future offers and recommendations; existing offer expiry stays unchanged." : "Routing assistance is disabled. Phase 1 defaults remain active."}</p>
    <SettingsForm key={query.data.revision} config={query.data} reload={query.reload} /></>}</Panel>;
}
