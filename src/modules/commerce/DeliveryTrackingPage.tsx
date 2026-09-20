import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@api/api";
import { date, ErrorNotice, label } from "./ui";
export default function DeliveryTrackingPage() {
  const [token] = useState(() => window.location.hash.slice(1)), [data, setData] = useState<{ status: string; preparationStatus: string; readyAt: string; pin: string }>(), [error, setError] = useState("");
  useEffect(() => { window.history.replaceState(null, "", window.location.pathname); let alive = true, pending = false; const controller = new AbortController();
    const load = async () => { if (pending || document.hidden) return; if (!/^[a-f0-9]{64}$/.test(token)) { setError("Invalid tracking link. Ask the restaurant for a new link."); return; } pending = true;
      try { const response = await axios.get(`${String(API.baseUrl).replace(/\/$/, "")}/commerce/delivery-tracking`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: false, timeout: 15000, signal: controller.signal }); if (alive) { setData(response.data.tracking); setError(""); } }
      catch { if (alive) { setData(undefined); setError("Tracking unavailable, link expired or delivery closed. Contact the restaurant if needed."); } } finally { pending = false; } };
    void load(); const timer = window.setInterval(() => void load(), 10000); return () => { alive = false; controller.abort(); clearInterval(timer); };
  }, [token]);
  return <main className="mx-auto max-w-lg space-y-5 p-6"><h1 className="text-2xl font-bold">Your delivery</h1><ErrorNotice message={error} />{data && <><p>{label(data.status)}</p><p>Preparation: {label(data.preparationStatus)} · Expected ready {date(data.readyAt)}</p><p>Share this PIN with your rider only after receiving your order.</p><p className="text-3xl font-bold tracking-widest">{data.pin}</p></>}</main>;
}
