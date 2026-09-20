import { useEffect, useRef, useState } from "react";
import { Button } from "@components/ui/Button";
import type { DeliveryLocation } from "./types";
import { Check, ErrorNotice } from "./ui";
let mapsPromise: Promise<void> | undefined;
type Point = { lat: number; lng: number };
type MapView = { panTo: (point: Point) => void; addListener: (name: string, fn: (e: { latLng?: { lat: () => number; lng: () => number } }) => void) => { remove: () => void } };
type Pin = { setCenter: (point: Point) => void; setMap: (map: MapView | null) => void };
export function loadGoogleMaps() {
  if (!mapsPromise) mapsPromise = new Promise<void>((resolve, reject) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) { reject(new Error("Map selection is not configured. Use current location or ask your merchant to confirm the destination.")); return; }
    const script = document.createElement("script"); script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=quarterly`;
    const timer = window.setTimeout(() => { script.remove(); reject(new Error("Map loading timed out. Close the map and retry.")); }, 15000);
    script.async = true; script.onload = () => { clearTimeout(timer); resolve(); }; script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error("Map could not load. Check your connection.")); }; document.head.appendChild(script);
  }).catch((e) => { mapsPromise = undefined; throw e; });
  return mapsPromise;
}
export default function LocationPicker({ value, onChange }: { value?: DeliveryLocation; onChange: (v: DeliveryLocation) => void }) {
  const container = useRef<HTMLDivElement>(null), change = useRef(onChange), [show, setShow] = useState(false), [error, setError] = useState(""), [locating, setLocating] = useState(false);
  const mounted = useRef(true); change.current = onChange;
  const selection = useRef(value); selection.current = value;
  const mapRef = useRef<MapView | null>(null), pinRef = useRef<Pin | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!show) return; let active = true; let listener: { remove: () => void } | undefined;
    loadGoogleMaps().then(() => {
      if (!active || !container.current) return;
      const google = (window as unknown as { google: { maps: { Map: new (el: HTMLElement, opts: unknown) => MapView; Circle: new (opts: unknown) => Pin } } }).google;
      const selected = selection.current;
      const point = selected ? { lat: selected.latitude, lng: selected.longitude } : { lat: 22.5, lng: 79 };
      const map = new google.maps.Map(container.current, { center: point, zoom: selected ? 16 : 5 }); mapRef.current = map;
      pinRef.current = new google.maps.Circle({ map: selected ? map : null, center: point, radius: 12, fillColor: "#16a34a", fillOpacity: 0.8, strokeColor: "#14532d", strokeWeight: 2, clickable: false });
      listener = map.addListener("click", (e) => { if (e.latLng) change.current({ latitude: e.latLng.lat(), longitude: e.latLng.lng(), source: "map", accuracy: null, confirmed: false }); });
    }).catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; listener?.remove(); pinRef.current?.setMap(null); pinRef.current = null; mapRef.current = null; };
  }, [show]);
  useEffect(() => {
    if (!value || !mapRef.current || !pinRef.current) return;
    const point = { lat: value.latitude, lng: value.longitude };
    pinRef.current.setCenter(point); pinRef.current.setMap(mapRef.current); mapRef.current.panTo(point);
  }, [value?.latitude, value?.longitude]);
  return <div className="space-y-3 sm:col-span-2"><p className="text-sm">Choose the delivery destination, then confirm it. Your current position may be different from the delivery address.</p>
    <div className="flex gap-2"><Button type="button" variant="outline" disabled={locating} onClick={() => {
      setError(""); if (!navigator.geolocation) { setError("Location is unavailable on this device."); return; } setLocating(true);
      navigator.geolocation.getCurrentPosition((p) => { if (mounted.current) { setLocating(false); onChange({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy, source: "gps", confirmed: false }); } }, () => { if (mounted.current) { setLocating(false); setError("Location permission denied or unavailable. Choose the destination on the map."); } }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    }}>{locating ? "Finding location…" : "Use current location"}</Button><Button type="button" variant="outline" onClick={() => setShow((v) => !v)}>Choose on map</Button></div>
    {show && <><p className="text-sm">Click the exact delivery point on the map. The selected coordinates appear below.</p><div ref={container} className="h-64 rounded border" aria-label="Delivery location map" /></>}
    <ErrorNotice message={error} />{value && <><p className="text-sm">Selected: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}{value.accuracy != null ? ` · accuracy ${Math.round(value.accuracy)} m` : ""}</p>
      <Check label="I confirm this is the delivery destination." checked={value.confirmed} onChange={(confirmed) => onChange({ ...value, confirmed })} /></>}
  </div>;
}
