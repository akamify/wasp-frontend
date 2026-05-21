import { useCallback, useEffect, useMemo, useState } from "react";

type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function useAdminList<T>({
  fetcher,
  initialLimit = 25,
  initialQuery = "",
  initialFilter = "all",
  initialSort = "recent",
}: {
  fetcher: (params: { page: number; limit: number; q: string; filter?: string; sort?: string }) => Promise<ListResponse<T>>;
  initialLimit?: number;
  initialQuery?: string;
  initialFilter?: string;
  initialSort?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState(initialSort);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ListResponse<T>>({ items: [], total: 0, page: 1, limit: initialLimit, totalPages: 1 });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const params = useMemo(() => ({ 
    page, 
    limit, 
    q: query.trim(),
    search: query.trim(),
    filter,
    sort
  }), [page, limit, query, filter, sort]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcher(params)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetcher, params, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [query, limit, filter, sort]);

  return {
    query,
    setQuery,
    page: data.page || page,
    setPage,
    limit: data.limit || limit,
    setLimit,
    filter,
    setFilter,
    sort,
    setSort,
    items: data.items || [],
    total: data.total || 0,
    totalPages: data.totalPages || 1,
    loading,
    error,
    refresh,
  };
}

