import type { ReactNode } from "react";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { useCommerce } from "./commerceContext";
export const money = (paise: number | null | undefined) => paise == null ? "Not specified" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
export const date = (value?: string | null) => value ? new Date(value).toLocaleString() : "—";
export const label = (value: string) => value.replaceAll("_", " ");
export const fieldClass = "w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50";
export function Status({ value }: { value: string }) {
  const tone = ["captured", "confirmed", "completed", "synced", "connected", "verified", "processed", "sent"].includes(value) ? "good"
    : ["error", "failed", "revoked", "dead_letter"].includes(value) ? "bad" : ["awaiting_manual_assignment", "requires_attention", "unknown", "blocked", "pending", "needs_setup"].includes(value) ? "warn" : "neutral";
  return <Badge tone={tone}>{label(value)}</Badge>;
}
export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="font-bold text-slate-900">{title}</h2>{action}</div>{children}</section>;
}
export function ErrorNotice({ message, retry }: { message?: string; retry?: () => void }) {
  return message ? <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{message}{retry && <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>}</div> : null;
}
export function QueryState({ loading, error, reload, empty }: { loading: boolean; error: string; reload: () => void; empty?: boolean }) {
  if (loading) return <p role="status" className="py-8 text-sm text-slate-500">Loading…</p>;
  if (error) return <ErrorNotice message={error} retry={reload} />;
  return empty ? <p className="py-8 text-sm text-slate-500">No records to show.</p> : null;
}
export function EnvironmentPicker() {
  const { environment, setEnvironment } = useCommerce();
  return <label className="flex items-center gap-2 text-sm font-medium">Environment<select aria-label="Environment" className={fieldClass} value={environment} onChange={(e) => setEnvironment(e.target.value as "test" | "live")}><option value="live">Live</option><option value="test">Test</option></select></label>;
}
export function Check({ label: text, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return <label className="flex items-start gap-2 text-sm text-slate-700"><input className="mt-1 accent-brand-600" type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />{text}</label>;
}
export function Pager({ next, back, onNext }: { next?: string | null; back?: () => void; onNext: () => void }) {
  return <div className="flex justify-end gap-2 pt-3"><Button variant="outline" size="sm" disabled={!back} onClick={back}>Previous</Button><Button variant="outline" size="sm" disabled={!next} onClick={onNext}>Next</Button></div>;
}
export function DisabledFeature({ name }: { name: string }) { return <Panel title={`${name} is not enabled`}><p className="text-sm text-slate-500">Contact your administrator to complete Commerce setup.</p></Panel>; }
