import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Copy, Download, QrCode, Trash2, X } from "lucide-react";
import { API, getToken, getWorkspaceId } from "@api/api";
import { cn } from "@shared/utils/cn";
import { useToast } from "@shared/providers/ToastContext";
import type { AnalyticsPoint, TrackedLink } from "./shared";
import { bars } from "./shared";
import { copyToClipboard, downloadAuthed, trackedUrlFor } from "./utils";

export function TrackedLinkViewEditModal({ open, onClose, link, onUpdated, onDeleted }: { open: boolean; onClose: () => void; link: TrackedLink | null; onUpdated: (link: TrackedLink) => void; onDeleted: (id: string) => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [series, setSeries] = useState<AnalyticsPoint[]>([]);
  const [totals, setTotals] = useState<{ clicks: number; scans: number } | null>(null);
  const [qrSvgObjectUrl, setQrSvgObjectUrl] = useState<string>("");

  useEffect(() => {
    if (!open || !link) return;
    setBusy(false); setAnalyticsBusy(true); setQrBusy(true); setEditTitle(link.title || ""); setEditMessage(link.message || ""); setSeries([]); setTotals(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await API.links.tracked.analytics(link._id, { days: 14 });
        if (!cancelled) { setSeries(res.series || []); setTotals(res.totals || null); }
      } catch (e: any) {
        if (!cancelled) toast(e?.response?.data?.message || "Failed to load analytics", "error");
      } finally {
        if (!cancelled) setAnalyticsBusy(false);
      }
    })();
    (async () => {
      try {
        const token = getToken(); const workspaceId = getWorkspaceId();
        const res = await fetch(`/api/links/tracked/${link._id}/qr.svg`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(workspaceId ? { "x-workspace-id": workspaceId } : {}) } });
        if (!res.ok) throw new Error(`QR preview failed (${res.status})`);
        const objUrl = URL.createObjectURL(await res.blob());
        if (cancelled) return URL.revokeObjectURL(objUrl);
        setQrSvgObjectUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return objUrl; });
      } catch {
      } finally {
        if (!cancelled) setQrBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, link, toast]);

  useEffect(() => {
    if (!open) return;
    return () => setQrSvgObjectUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return ""; });
  }, [open]);

  const clickBars = useMemo(() => bars(series, "clicks"), [series]);
  const scanBars = useMemo(() => bars(series, "scans"), [series]);

  async function save() {
    if (!link) return;
    setBusy(true);
    try { const res = await API.links.tracked.update(link._id, { title: editTitle, message: editMessage }); toast("Link updated", "success"); onUpdated(res.link); }
    catch (e: any) { toast(e?.response?.data?.message || "Failed to update link", "error"); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!link || !confirm("Delete this tracked link?")) return;
    setBusy(true);
    try { await API.links.tracked.remove(link._id); toast("Link deleted", "success"); onDeleted(link._id); onClose(); }
    catch (e: any) { toast(e?.response?.data?.message || "Failed to delete link", "error"); }
    finally { setBusy(false); }
  }
  async function copyUrl() { if (!link) return; await copyToClipboard(trackedUrlFor(link)); toast("Copied", "success"); }
  async function downloadQr(type: "svg" | "png") {
    if (!link) return;
    try { await downloadAuthed(`/api/links/tracked/${link._id}/qr.${type}`, `${link.slug}.${type}`); toast(`QR ${type.toUpperCase()} downloaded`, "success"); }
    catch (e: any) { toast(e?.message || "Download failed", "error"); }
  }

  return createPortal(
    <AnimatePresence>
      {open && link ? (
        <motion.div className="fixed inset-0 z-[999] overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div className="w-full max-w-5xl overflow-hidden rounded-[5px] bg-white shadow-2xl border border-slate-100 relative" initial={{ y: 20, opacity: 0, scale: 0.985 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.985 }}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="min-w-0"><div className="flex items-center gap-2 min-w-0"><h3 className="truncate text-lg font-black tracking-tight text-slate-900">{link.title || "Tracked Link"}</h3></div><p className="mt-0.5 text-xs font-bold text-slate-400 uppercase tracking-widest truncate">Opens WhatsApp with your message and logs analytics before redirect.</p></div>
              <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={copyUrl}><Copy size={14} />Copy URL</Button><Button variant="outline" size="sm" onClick={onClose}><X size={20} /></Button></div>
            </div>
            <div className="max-h-[78vh] overflow-y-auto custom-scrollbar p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Card className="p-4 border-ink-900/5 shadow-xl shadow-ink-900/5"><div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Clicks (14d)</div><div className="mt-1 text-2xl font-black text-slate-900">{analyticsBusy ? "..." : (totals?.clicks ?? 0)}</div></Card><Card className="p-4 border-ink-900/5 shadow-xl shadow-ink-900/5"><div className="text-[11px] font-black uppercase tracking-widest text-slate-500">QR Scans (14d)</div><div className="mt-1 text-2xl font-black text-slate-900">{analyticsBusy ? "..." : (totals?.scans ?? 0)}</div></Card></div>
                  <Card className="p-5 border-ink-900/5 shadow-xl shadow-ink-900/5"><div className="flex items-center justify-between gap-3"><div className="text-sm font-black text-slate-900">Trends (last 14 days)</div><div className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-500" /> clicks</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> scans</span></div></div><div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"><div><div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Clicks</div><div className="mt-2 flex h-20 items-end gap-1 rounded-[5px] border border-slate-200 bg-white p-2">{clickBars.map((h, idx) => <div key={idx} className="w-2 rounded-sm bg-brand-500/80" style={{ height: `${Math.max(4, h)}%` }} title={series[idx]?.date} />)}</div></div><div><div className="text-[11px] font-black uppercase tracking-widest text-slate-500">QR Scans</div><div className="mt-2 flex h-20 items-end gap-1 rounded-[5px] border border-slate-200 bg-white p-2">{scanBars.map((h, idx) => <div key={idx} className="w-2 rounded-sm bg-emerald-500/80" style={{ height: `${Math.max(4, h)}%` }} title={series[idx]?.date} />)}</div></div></div></Card>
                  <Card className="p-5 border-ink-900/5 shadow-xl shadow-ink-900/5"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black text-slate-900">Edit</div><div className="mt-0.5 text-[11px] font-semibold text-slate-500">Update title/message. Tracked URL slug stays the same.</div></div></div><div className="mt-4 grid gap-4"><Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /><Textarea label="Message" value={editMessage} onChange={(e) => setEditMessage(e.target.value)} className="min-h-[120px]" /><div className="flex items-center justify-end gap-3"><Button variant="danger" onClick={remove} disabled={busy}><Trash2 size={14} /> Delete</Button><Button onClick={save} disabled={busy}>{busy ? "Saving..." : "Save Changes"}</Button></div></div></Card>
                </div>
                <div className="lg:sticky top-6 space-y-6"><Card className="p-5 border-ink-900/5 shadow-xl shadow-ink-900/5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><QrCode size={16} className="text-emerald-600" /><div className="text-sm font-black text-slate-900">QR Code</div></div><div className={cn("text-[11px] font-bold", qrBusy ? "text-slate-400" : "text-slate-500")}>{qrBusy ? "Loading..." : "Ready"}</div></div><div className="mt-4 rounded-[5px] border border-slate-200 bg-white p-4">{qrSvgObjectUrl ? <img src={qrSvgObjectUrl} alt="QR" className="mx-auto h-56 w-56" /> : <div className="h-56 w-full flex items-center justify-center text-sm font-bold text-slate-400">QR preview unavailable</div>}</div><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => downloadQr("svg")} disabled={busy}><Download size={14} /> SVG</Button><Button variant="outline" onClick={() => downloadQr("png")} disabled={busy}><Download size={14} /> PNG</Button></div><div className="mt-3 text-[11px] font-semibold text-slate-500 leading-relaxed">QR will open <span className="font-black">tracked URL</span> with <span className="font-black">source=qr</span> so scans are counted separately from normal clicks.</div></Card></div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
