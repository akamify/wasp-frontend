import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import AddressFields, { emptyAddress } from "./AddressFields";
import { cancelled, errorMessage } from "./commerceContext";
import { ErrorNotice, fieldClass } from "./ui";
type Details = { orderNumber: string; pickupEnabled: boolean; deliveryEnabled: boolean; pickupInstructions: string; expiresAt: string; locationRequired?: boolean };
export default function FulfillmentPage() {
  const [token, setToken] = useState(() => window.location.hash.slice(1)), [details, setDetails] = useState<Details | null>(null);
  const [method, setMethod] = useState(""), [address, setAddress] = useState(emptyAddress), [error, setError] = useState(""), [busy, setBusy] = useState(false), [complete, setComplete] = useState(false), [retry, setRetry] = useState(0);
  const pending = useRef<AbortController | null>(null), lock = useRef(false);
  useEffect(() => { window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`); return () => pending.current?.abort(); }, []);
  useEffect(() => {
    if (complete) return;
    if (!/^[a-f0-9]{64}$/.test(token)) { setError("This link is invalid. Ask the merchant for a new customer details link."); return; }
    const controller = new AbortController(); setError("");
    // Public session credentials must never go through workspace/auth interceptors.
    axios.get<{ fulfillment: Details }>(`${String(API.baseUrl).replace(/\/$/, "")}/commerce/fulfillment`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: false, timeout: 20000, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) { setDetails(data.fulfillment); setMethod(data.fulfillment.pickupEnabled ? "pickup" : "delivery"); } })
      .catch((e) => { if (!controller.signal.aborted && !cancelled(e)) setError(errorMessage(e)); });
    return () => controller.abort();
  }, [token, retry, complete]);
  return <main className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 space-y-5"><p className="text-sm font-bold text-brand-700">AIWizChat</p><h1 className="text-2xl font-bold">{complete ? "Details received" : "Your order details"}</h1>
    {complete ? <p>Your merchant will review your details and send a payment request on WhatsApp.</p> : <><ErrorNotice message={error} retry={!details && /^[a-f0-9]{64}$/.test(token) ? () => setRetry((v) => v + 1) : undefined} />
      {!details && !error && <p role="status">Loading order details…</p>}{details && <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError("");
        const controller = new AbortController(); pending.current = controller;
        try { await axios.post(`${String(API.baseUrl).replace(/\/$/, "")}/commerce/fulfillment`, { fulfillmentMethod: method, ...(method === "delivery" ? { address } : {}) }, { headers: { Authorization: `Bearer ${token}` }, withCredentials: false, timeout: 20000, signal: controller.signal });
          if (!controller.signal.aborted) { setComplete(true); setToken(""); setAddress(emptyAddress); setDetails(null); }
        } catch (e) { if (!controller.signal.aborted && !cancelled(e)) setError(errorMessage(e)); }
        finally { lock.current = false; if (!controller.signal.aborted) setBusy(false); }
      }}><p className="text-sm">Order {details.orderNumber}</p><fieldset disabled={busy} className="space-y-4"><label className="block text-sm">How would you like to receive your order?<select className={fieldClass} required value={method} onChange={(e) => setMethod(e.target.value)}>{details.pickupEnabled && <option value="pickup">Pickup</option>}{details.deliveryEnabled && <option value="delivery">Delivery</option>}</select></label>
        {method === "delivery" ? <AddressFields value={address} onChange={setAddress} locationRequired={details.locationRequired} /> : <p className="text-sm whitespace-pre-wrap">{details.pickupInstructions}</p>}
        <Button type="submit" disabled={busy || !method}>{busy ? "Submitting…" : "Submit details"}</Button></fieldset></form>}</>}
  </div></main>;
}
