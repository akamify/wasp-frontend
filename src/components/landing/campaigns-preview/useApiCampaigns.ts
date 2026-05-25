import { useEffect, useState } from "react";
import { fallbackApiCampaigns } from "./data";
import type { Campaign, CampaignSource } from "./types";

function normalizeApiCampaigns(payload: unknown): Campaign[] {
  const items: unknown[] = Array.isArray(payload) ? payload : (payload && typeof payload === "object" && Array.isArray((payload as any).items) ? (payload as any).items : []);
  return items.map((raw) => {
    if (!raw || typeof raw !== "object") return null;
    const obj: any = raw;
    const status = String(obj.status ?? "Running");
    return {
      id: String(obj.id ?? obj.campaignId ?? obj._id ?? `${obj.name}:${obj.template}`),
      name: String(obj.name ?? obj.title ?? "Untitled Campaign"),
      template: String(obj.template ?? obj.templateName ?? "Template"),
      statusLabel: status.length > 18 ? `${status.slice(0, 18)}...` : status,
      statusTone: /success|completed|delivered/i.test(status) ? "success" : /paused|scheduled|pending/i.test(status) ? "warning" : "info",
      audienceLabel: String(obj.audience ?? obj.audienceLabel ?? obj.recipients ?? "--"),
      deliveredLabel: String(obj.delivered ?? obj.deliveredLabel ?? obj.sent ?? "--"),
      updatedLabel: obj.updated || obj.updatedLabel || obj.updatedAt ? `Updated: ${String(obj.updated ?? obj.updatedLabel ?? obj.updatedAt)}` : "Updated just now",
    } as Campaign;
  }).filter(Boolean) as Campaign[];
}

export function useApiCampaigns(active: CampaignSource, apiUrl: string) {
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiCampaigns, setApiCampaigns] = useState<Campaign[]>([]);

  const runApiLoad = () => {
    setApiError(null);
    setApiLoading(true);
    const ctrl = new AbortController();
    const start = Date.now();
    const resolveWith = (campaigns: Campaign[], minDelay: number) => {
      const elapsed = Date.now() - start;
      const delay = Math.max(0, minDelay - elapsed);
      window.setTimeout(() => { if (!ctrl.signal.aborted) { setApiCampaigns(campaigns); setApiLoading(false); } }, delay);
    };

    if (!apiUrl) {
      resolveWith(fallbackApiCampaigns(), 650);
      return () => ctrl.abort();
    }

    (async () => {
      try {
        const res = await fetch(apiUrl, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const normalized = normalizeApiCampaigns(await res.json());
        if (!normalized.length) throw new Error("No campaigns found");
        resolveWith(normalized, 450);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load campaigns");
        setApiLoading(false);
      }
    })();

    return () => ctrl.abort();
  };

  useEffect(() => {
    if (active !== "api" || apiCampaigns.length) return;
    return runApiLoad();
  }, [active]);

  return { apiLoading, apiError, apiCampaigns, runApiLoad };
}
