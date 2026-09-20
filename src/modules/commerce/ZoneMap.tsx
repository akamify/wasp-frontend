import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./LocationPicker";
import { ErrorNotice } from "./ui";
import { Button } from "@components/ui/Button";
type Point = { latitude: number; longitude: number; radiusMetres: number };
type Listener = { remove(): void };
type LatLng = { lat(): number; lng(): number };
type MapView = { panTo(p: { lat: number; lng: number }): void; addListener(name: string, fn: (e: { latLng?: LatLng }) => void): Listener };
type Circle = { getCenter(): LatLng; getRadius(): number; setCenter(p: { lat: number; lng: number }): void; setRadius(r: number): void; setMap(m: MapView | null): void; addListener(n: string, fn: () => void): Listener };
type Maps = { Map: new (el: HTMLElement, options: unknown) => MapView; Circle: new (options: unknown) => Circle; Geocoder: new () => { geocode(input: { address: string }, callback: (results: { geometry: { location: LatLng } }[] | null, status: string) => void): void } };
export default function ZoneMap({ value, onChange }: { value: Point; onChange(p: Point): void }) {
  const container = useRef<HTMLDivElement>(null), state = useRef(value), change = useRef(onChange), circle = useRef<Circle | null>(null), map = useRef<MapView | null>(null);
  const [error, setError] = useState(""), [search, setSearch] = useState(""), [busy, setBusy] = useState(false), [attempt, setAttempt] = useState(0);
  const mounted = useRef(false); state.current = value; change.current = onChange;
  useEffect(() => {
    mounted.current = true; let active = true; const listeners: Listener[] = [];
    void loadGoogleMaps().then(() => {
      if (!active || !container.current) return;
      const g = (window as unknown as { google: { maps: Maps } }).google.maps, p = state.current;
      map.current = new g.Map(container.current, { center: { lat: p.latitude, lng: p.longitude }, zoom: 12 });
      circle.current = new g.Circle({ map: map.current, center: { lat: p.latitude, lng: p.longitude }, radius: p.radiusMetres, editable: true, draggable: true, fillColor: "#16a34a", fillOpacity: 0.12, strokeColor: "#15803d" });
      const update = () => { const c = circle.current; if (!c) return; const point = c.getCenter(), radius = Math.max(100, Math.min(50000, Math.round(c.getRadius()))); if (point.lat() !== state.current.latitude || point.lng() !== state.current.longitude || radius !== state.current.radiusMetres) change.current({ latitude: point.lat(), longitude: point.lng(), radiusMetres: radius }); };
      listeners.push(circle.current.addListener("center_changed", update), circle.current.addListener("radius_changed", update), map.current.addListener("click", (e) => { if (e.latLng) change.current({ ...state.current, latitude: e.latLng.lat(), longitude: e.latLng.lng() }); }));
    }).catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; mounted.current = false; listeners.forEach((l) => l.remove()); circle.current?.setMap(null); circle.current = null; map.current = null; };
  }, [attempt]);
  useEffect(() => { const c = circle.current; if (!c) return; const p = c.getCenter(); if (p.lat() !== value.latitude || p.lng() !== value.longitude) { c.setCenter({ lat: value.latitude, lng: value.longitude }); map.current?.panTo({ lat: value.latitude, lng: value.longitude }); } if (c.getRadius() !== value.radiusMetres) c.setRadius(value.radiusMetres); }, [value.latitude, value.longitude, value.radiusMetres]);
  return <div className="space-y-2"><div className="flex gap-2"><input aria-label="Search delivery zone location" className="w-full rounded border p-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Hazratganj, Lucknow" /><Button type="button" variant="outline" disabled={busy || !search.trim()} onClick={() => {
    setBusy(true); setError(""); void loadGoogleMaps().then(() => { const g = (window as unknown as { google: { maps: Maps } }).google.maps; new g.Geocoder().geocode({ address: search }, (rows, status) => { if (!mounted.current) return; setBusy(false); if (status !== "OK" || !rows?.[0]) { setError("Location was not found. Choose the centre on the map or enter coordinates."); return; } const p = rows[0].geometry.location; change.current({ ...state.current, latitude: p.lat(), longitude: p.lng() }); }); }).catch((e: Error) => { if (mounted.current) { setBusy(false); setError(e.message); } });
  }}>Search</Button></div><div ref={container} className="h-72 rounded border" aria-label="Delivery zone radius map" /><p className="text-sm">Drag the circle or click to move its centre. Resize its edge or enter a radius below. This circle covers customer destinations.</p><ErrorNotice message={error} retry={() => { setError(""); setAttempt((n) => n + 1); }} /></div>;
}
