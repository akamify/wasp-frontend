import { useEffect, useRef, useState } from "react";
import { api } from "@api/api";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import type { Courier, Delivery } from "./DeliveryManagement";
import { errorMessage } from "./commerceContext";
import { useDeliverySocket } from "./deliverySocket";
import { date, ErrorNotice, label, Status } from "./ui";
type State = { courier: Courier; delivery: Delivery | null; deliveries?: Delivery[]; trip?: { id: string; status: string; revision: number } | null; gpsIntervalSeconds: number };
export default function RiderPage() {
  const [state, setState] = useState<State | null>(null), [error, setError] = useState(""), [pollError, setPollError] = useState(""), [gpsError, setGpsError] = useState(""), [busy, setBusy] = useState(false), [pin, setPin] = useState(""), [reason, setReason] = useState("");
  const mounted = useRef(true), lock = useRef(false), refresh = useRef<() => void>(() => {});
  useDeliverySocket(null, () => refresh.current());
  useEffect(() => {
    mounted.current = true; let timer: number; let pending: AbortController | undefined;
    const poll = async () => { if (pending || document.hidden) return; pending = new AbortController();
      try { const { data } = await api.get<State>("/commerce/rider/me", { signal: pending.signal }); if (mounted.current) { setState(data); setPollError(""); } }
      catch (e) { if (mounted.current) { setPollError(errorMessage(e)); setState(null); } }
      finally { pending = undefined; } };
    refresh.current = () => { void poll(); }; void poll(); timer = window.setInterval(() => void poll(), 5000); window.addEventListener("online", refresh.current); document.addEventListener("visibilitychange", refresh.current);
    const manifest = document.createElement("link"); manifest.rel = "manifest"; manifest.href = "/rider.webmanifest"; document.head.appendChild(manifest);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/rider-sw.js", { scope: "/rider" }).catch(() => {});
    return () => { mounted.current = false; pending?.abort(); clearInterval(timer); window.removeEventListener("online", refresh.current); document.removeEventListener("visibilitychange", refresh.current); manifest.remove(); };
  }, []);
  useEffect(() => {
    if (!state?.courier.online) return; let cancelled = false, pending = false; const controller = new AbortController();
    const send = () => { if (document.hidden || !navigator.onLine || pending || !navigator.geolocation) return; pending = true;
      navigator.geolocation.getCurrentPosition((p) => {
        if (cancelled) return;
        void api.post("/commerce/rider/location", { latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy, capturedAt: new Date(p.timestamp).toISOString() }, { signal: controller.signal })
          .then(() => { if (!cancelled) setGpsError(""); }).catch(() => { if (!cancelled) setGpsError("Location update failed. Keep this app open and check GPS/network access."); }).finally(() => { pending = false; });
      }, () => { pending = false; if (!cancelled) setGpsError("Location permission is needed to receive delivery offers. Enable it in browser settings."); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }; send(); const timer = window.setInterval(send, (state.gpsIntervalSeconds || 15) * 1000);
    return () => { cancelled = true; controller.abort(); clearInterval(timer); };
  }, [state?.courier.online, state?.gpsIntervalSeconds]);
  async function run(path: string, payload: unknown) {
    if (lock.current) return; lock.current = true; setBusy(true); setError("");
    try { await api.post(`/commerce/rider${path}`, payload); if (mounted.current) { setPin(""); refresh.current(); } }
    catch (e) { if (mounted.current) { setError(errorMessage(e)); refresh.current(); } }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const delivery = state?.deliveries?.find((r) => r.id === selectedDelivery) || state?.deliveries?.[0] || state?.delivery;
  const act = (action: string) => delivery && run(`/deliveries/${delivery.id}/action`, { revision: delivery.revision, action, ...(action === "delivered" ? { pin } : {}), ...(action === "exception" ? { reason } : {}) });
  const navigation = (latitude: number, longitude: number) => `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  return <main className="mx-auto max-w-xl space-y-5 p-5"><h1 className="text-2xl font-bold">AIWizChat Rider</h1><ErrorNotice message={error} /><ErrorNotice message={pollError} retry={() => refresh.current()} /><ErrorNotice message={gpsError} />
    {!state ? <p role="status">Loading rider access… Sign in with the account registered by your merchant.</p> : <><p>{state.courier.name} · {state.courier.online ? "Online" : "Offline"} · {(state.courier.currentDeliveryId || state.courier.currentTripId) ? "Busy" : "Available"}</p>
      <Button disabled={busy} onClick={() => run("/availability", { revision: state.courier.revision, online: !state.courier.online })}>{state.courier.online ? "Go offline" : "Go online"}</Button>
      <p className="text-sm">Keep this app open while online. Background GPS is not guaranteed. Last GPS: {date(state.courier.location?.receivedAt)}.</p>
      {state.trip && state.deliveries?.some((r) => r.status === "offer_sent") && <Button disabled={busy} onClick={() => run(`/trips/${state.trip!.id}/accept`, { revision: state.trip!.revision })}>Accept all pending trip offers</Button>}
      {!!state.deliveries?.length && <label className="block">Trip orders ({state.deliveries.length}/{state.courier.batchCapacity || 1})<select className="block w-full rounded border p-3" value={delivery?.id || ""} onChange={(e) => { setSelectedDelivery(e.target.value); setPin(""); }} >{state.deliveries.map((r, i) => <option key={r.id} value={r.id}>Stop {i + 1} - {label(r.status)} - {r.destination?.name || "New offer"}</option>)}</select><p className="text-sm">Accept each order. Collect all orders before starting delivery, then follow the stop sequence.</p></label>}
      {!delivery ? <p>No current delivery offer.</p> : <section className="space-y-4 rounded-lg border p-4"><Status value={delivery.status} /><p>Preparation: {label(delivery.preparationStatus)}</p><p>{delivery.pickup?.name} · {delivery.pickup?.address}</p>
        {delivery.pickup && <a className="block underline" href={navigation(delivery.pickup.latitude, delivery.pickup.longitude)} target="_blank" rel="noreferrer">Navigate to pickup</a>}
        {delivery.status === "offer_sent" && <><p>Respond before {date(delivery.offerExpiresAt)}</p><div className="flex gap-3"><Button disabled={busy || Date.parse(delivery.offerExpiresAt) <= Date.now()} onClick={() => act("accept")}>Accept</Button><Button variant="outline" disabled={busy} onClick={() => act("decline")}>Decline</Button></div></>}
        {delivery.destination && <><p>{delivery.destination.name} · {delivery.destination.phone}</p><p>{delivery.destination.line1} {delivery.destination.line2}, {delivery.destination.city}</p><a className="block underline" href={navigation(delivery.destination.location.latitude, delivery.destination.location.longitude)} target="_blank" rel="noreferrer">Navigate to customer</a></>}
        {delivery.status === "assigned" && <Button disabled={busy} onClick={() => act("arrived_at_pickup")}>Arrived at pickup</Button>}
        {delivery.status === "arrived_at_pickup" && <Button disabled={busy || delivery.preparationStatus !== "ready"} onClick={() => act("picked_up")}>Confirm pickup</Button>}
        {delivery.status === "picked_up" && <Button disabled={busy} onClick={() => act("out_for_delivery")}>Start delivery</Button>}
        {delivery.status === "out_for_delivery" && <><Input label="Customer delivery PIN" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} /><Button disabled={busy || !/^\d{6}$/.test(pin)} onClick={() => act("delivered")}>Complete delivery</Button></>}
        {["assigned", "arrived_at_pickup", "picked_up", "out_for_delivery"].includes(delivery.status) && <><Input label="Delivery issue" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /><Button variant="outline" disabled={busy || reason.trim().length < 5} onClick={() => act("exception")}>Report issue</Button></>}
      </section>}
    </>}
  </main>;
}
