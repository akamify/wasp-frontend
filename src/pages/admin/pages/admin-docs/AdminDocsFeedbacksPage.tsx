import { useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ThumbsDown, ThumbsUp } from "lucide-react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useToast } from "@shared/providers/ToastContext";

const PAGE_SIZE = 25;

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function valueOrDash(value: unknown) {
  const text = String(value || "").trim();
  return text || "-";
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3">
      <div className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</div>
      <div className="break-words text-sm font-semibold text-slate-900">{valueOrDash(value)}</div>
    </div>
  );
}

export default function AdminDocsFeedbacksPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith("/super-admin");
  const docsBasePath = isSuperAdminPath ? "/super-admin/docs" : "/admin/docs";
  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const loadingRef = useRef(false);

  async function loadPage(cursor = "", append = false) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError("");
    }
    try {
      const params: any = { limit: PAGE_SIZE };
      if (cursor) params.cursor = cursor;
      const res: any = await API.admin.docsFeedbacks(params);
      const nextItems = Array.isArray(res?.items) ? res.items : [];
      setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
      setNextCursor(String(res?.nextCursor || ""));
      setHasMore(!!res?.hasMore);
    } catch (e: any) {
      const message = e?.response?.data?.message || "Failed to load docs feedbacks";
      if (append) toast(message, "error");
      else setError(message);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const res: any = await API.admin.docsFeedbackGet(id);
      setSelected(res?.feedback || null);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load feedback", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 160;
    if (nearBottom && hasMore && nextCursor && !loadingMore && !loadingRef.current) {
      void loadPage(nextCursor, true);
    }
  }

  const filtered = query.trim()
    ? items.filter((item) => {
        const q = query.trim().toLowerCase();
        return (
          String(item.slug || "").toLowerCase().includes(q) ||
          String(item.docTitle || "").toLowerCase().includes(q) ||
          String(item.pagePath || "").toLowerCase().includes(q) ||
          String(item.visitorId || "").toLowerCase().includes(q)
        );
      })
    : items;

  return (
    <div className="flex h-[calc(100vh-4px)] flex-col p-6">
      <AdminToolbar
        title="Docs Feedbacks"
        subtitle="Review docs votes with page, visitor, and request context."
        query={query}
        setQuery={setQuery}
        onRefresh={() => loadPage()}
        isSyncing={loading}
        right={<Button variant="outline" onClick={() => navigate(docsBasePath)}><ArrowLeft className="mr-2 h-4 w-4" /> Docs</Button>}
      />
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-[5px] border border-slate-200 bg-white" onScroll={handleScroll}>
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">
            <div>Doc</div>
            <div>Feedback</div>
            <div>Slug</div>
            <div>Visitor</div>
            <div>Submitted</div>
          </div>
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className="grid w-full grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] items-center border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
              onClick={() => openDetail(item.id)}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-slate-900">{item.docTitle || item.slug || "Untitled doc"}</div>
                <div className="truncate text-xs text-slate-500">{item.pagePath || "-"}</div>
              </div>
              <div>
                <span className={`inline-flex items-center rounded-[5px] px-2 py-1 text-xs font-black ${item.helpful ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {item.helpful ? <ThumbsUp className="mr-1 h-3.5 w-3.5" /> : <ThumbsDown className="mr-1 h-3.5 w-3.5" />}
                  {item.helpful ? "Helpful" : "Not helpful"}
                </span>
              </div>
              <div className="truncate text-xs font-semibold text-slate-700">{item.slug || "-"}</div>
              <div className="truncate text-xs text-slate-600">{item.visitorId || "-"}</div>
              <div className="text-xs text-slate-600">{formatDate(item.createdAt)}</div>
            </button>
          ))}
          {!filtered.length ? <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500">No docs feedback found.</div> : null}
          {loadingMore ? <div className="px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">Loading more...</div> : null}
          {!hasMore && items.length ? <div className="px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">End of feedbacks</div> : null}
        </div>
      )}
      <Modal isOpen={detailLoading || !!selected} onClose={() => setSelected(null)} title="Feedback Details" className="max-w-4xl">
        {detailLoading ? (
          <TableSkeleton rows={4} cols={2} />
        ) : selected ? (
          <div className="space-y-4">
            <div className={`inline-flex items-center rounded-[5px] px-3 py-2 text-sm font-black ${selected.helpful ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {selected.helpful ? <ThumbsUp className="mr-2 h-4 w-4" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
              {selected.helpful ? "Helpful" : "Not helpful"}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailRow label="Doc Title" value={selected.docTitle} />
              <DetailRow label="Slug" value={selected.slug} />
              <DetailRow label="Page Path" value={selected.pagePath} />
              <DetailRow label="Visitor ID" value={selected.visitorId} />
              <DetailRow label="IP Address" value={selected.ipAddress} />
              <DetailRow label="Source" value={selected.source} />
              <DetailRow label="Created At" value={formatDate(selected.createdAt)} />
              <DetailRow label="Updated At" value={formatDate(selected.updatedAt)} />
            </div>
            <DetailRow label="User Agent" value={selected.userAgent} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
