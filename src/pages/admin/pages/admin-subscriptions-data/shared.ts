import { useCallback, useState } from "react";
import { formatCurrencyFromPaise } from "@shared/config/currency";

export type TabKey = "overview" | "payment-links" | "history";

export function inr(paise?: number | null) {
  if (paise == null) return "-";
  return formatCurrencyFromPaise(paise, "₹");
}

export function toIst(value?: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
}

export function useScrollList(fetcher: (page: number) => Promise<any>) {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(async () => {
    setItems([]); setPage(1); setTotalPages(1); setError(""); setLoading(true);
    try { const out = await fetcher(1); setItems(Array.isArray(out.items) ? out.items : []); setTotalPages(Number(out.totalPages || 1)); setPage(1); }
    catch (e: any) { setError(e?.response?.data?.message || "Failed to load data"); }
    finally { setLoading(false); }
  }, [fetcher]);

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    try {
      const next = page + 1;
      const out = await fetcher(next);
      setItems((prev) => [...prev, ...(Array.isArray(out.items) ? out.items : [])]);
      setTotalPages(Number(out.totalPages || totalPages));
      setPage(next);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load more");
    } finally {
      setLoading(false);
    }
  }, [fetcher, loading, page, totalPages]);

  return { items, loading, error, reset, loadMore, page, totalPages };
}
