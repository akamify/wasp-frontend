import { useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../context/ToastContext";
import { Copy, Eye, Plus, QrCode, Trash2 } from "lucide-react";
import {
  CreateTrackedLinkModal,
  TrackedLinkViewEditModal,
  type TrackedLink,
} from "../components/links/TrackedLinkModals";

export default function LinksPage() {
  const { toast } = useToast();
  const [links, setLinks] = useState<TrackedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<TrackedLink | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await API.links.tracked.list();
      setLinks(res.links || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load tracked links");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteLink(link: TrackedLink) {
    if (!confirm("Delete this tracked link?")) return;
    try {
      await API.links.tracked.remove(link._id);
      toast("Link deleted", "success");
      setLinks((prev) => prev.filter((l) => l._id !== link._id));
      if (active?._id === link._id) setActive(null);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to delete link", "error");
    }
  }

  function trackedUrlFor(link: TrackedLink) {
    return link.trackedUrl || `${window.location.origin}/t/${link.slug}`;
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast("Copied", "success");
  }

  const totals = useMemo(() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const totalScans = links.reduce((sum, l) => sum + (l.scans || 0), 0);
    return { totalClicks, totalScans, totalLinks: links.length };
  }, [links]);

  return (
    <div className="space-y-6 p-2 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tracked Links</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create WhatsApp tracked links with QR codes and per-link analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create Tracked Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 border-ink-900/5 shadow-xl shadow-ink-900/5">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Total Links</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{totals.totalLinks}</div>
        </Card>
        <Card className="p-4 border-ink-900/5 shadow-xl shadow-ink-900/5">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Total Clicks</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{totals.totalClicks}</div>
        </Card>
        <Card className="p-4 border-ink-900/5 shadow-xl shadow-ink-900/5">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Total QR Scans</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{totals.totalScans}</div>
        </Card>
      </div>

      <Card className="border-ink-900/5 shadow-xl shadow-ink-900/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900">All Links</h3>
            <Badge tone="brand">{links.length}</Badge>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-4 text-sm font-bold text-rose-600 bg-rose-50 border-b border-rose-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="px-6 py-8 text-sm text-slate-500">Loading…</div>
        ) : links.length === 0 ? (
          <div className="px-6 py-10">
            <div className="flex items-start gap-4 rounded-[5px] border border-slate-100 bg-slate-50 p-6">
              <div className="mt-0.5 text-slate-400">
                <QrCode size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900">No tracked links yet</div>
                <div className="mt-1 text-xs font-semibold text-slate-600">
                  Click <span className="font-black">Create Tracked Link</span> to generate your first WhatsApp redirect URL with QR and analytics.
                </div>
                <div className="mt-4">
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus size={16} /> Create Tracked Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[minmax(180px,1.6fr)_minmax(260px,1fr)_120px_120px_250px] gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-slate-50">
                <div>Link</div>
                <div>Tracked URL</div>
                <div>Clicks</div>
                <div>Scans</div>
                <div className="text-right">Actions</div>
              </div>

              {links.map((link) => (
                <div
                  key={link._id}
                  className="flex items-center grid grid-cols-[minmax(180px,1.6fr)_minmax(260px,1fr)_120px_120px_250px] gap-2 px-6 py-4 border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="truncate text-sm font-black text-slate-900">{link.title || "Untitled"}</div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-700">{trackedUrlFor(link)}</div>
                  </div>

                  <div className="flex items-center text-sm font-black text-slate-900">{link.clicks || 0}</div>
                  <div className="flex items-center text-sm font-black text-slate-900">{link.scans || 0}</div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActive(link);
                        setViewOpen(true);
                      }}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copy(trackedUrlFor(link))}>
                      <Copy size={14} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => deleteLink(link)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <CreateTrackedLinkModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(link) => setLinks((prev) => [link, ...prev])}
      />

      <TrackedLinkViewEditModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        link={active}
        onUpdated={(updated) => {
          setLinks((prev) => prev.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)));
          setActive(updated);
        }}
        onDeleted={(id) => {
          setLinks((prev) => prev.filter((l) => l._id !== id));
          if (active?._id === id) setActive(null);
        }}
      />
    </div>
  );
}

