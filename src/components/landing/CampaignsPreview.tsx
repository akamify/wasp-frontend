import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cloud, FileSpreadsheet, Megaphone, RefreshCcw, ShieldCheck, Sparkles, Timer } from "lucide-react";

type CampaignSource = "broadcast" | "csv" | "api";

type Campaign = {
  id: string;
  name: string;
  template: string;
  audienceLabel: string;
  deliveredLabel: string;
  statusLabel: string;
  statusTone: "success" | "warning" | "info";
  updatedLabel: string;
};

function toneClasses(tone: Campaign["statusTone"]) {
  switch (tone) {
    case "success":
      return "bg-[#25D366]/12 text-[#0b6b2f] border-[#25D366]/25";
    case "warning":
      return "bg-[#f59e0b]/12 text-[#92400e] border-[#f59e0b]/25";
    case "info":
    default:
      return "bg-[#06b6d4]/12 text-[#075985] border-[#06b6d4]/25";
  }
}

function SkeletonCampaignCard() {
  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="skeleton-bar h-3 w-32" />
          <div className="mt-2 skeleton-bar h-2.5 w-44 opacity-90" />
        </div>
        <div className="skeleton-bar h-6 w-16 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="skeleton-bar h-2.5 w-16 opacity-80" />
          <div className="mt-1.5 skeleton-bar h-3 w-24" />
        </div>
        <div>
          <div className="skeleton-bar h-2.5 w-16 opacity-80" />
          <div className="mt-1.5 skeleton-bar h-3 w-24" />
        </div>
      </div>
      <div className="mt-4 skeleton-bar h-2.5 w-28 opacity-80" />
    </div>
  );
}

function CampaignCard({ campaign, index, inView }: { campaign: Campaign; index: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.45 }}
      className="rounded-2xl border border-ink-900/10 bg-white p-4 hover:border-brand-300/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-900 truncate">{campaign.name}</p>
          <p className="mt-1 text-xs text-ink-900/55 truncate">Template: {campaign.template}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${toneClasses(campaign.statusTone)}`}>
          {campaign.statusLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-900/45">Audience</p>
          <p className="mt-1 text-xs font-semibold text-ink-900">{campaign.audienceLabel}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-900/45">Delivered</p>
          <p className="mt-1 text-xs font-semibold text-ink-900">{campaign.deliveredLabel}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-[11px] text-ink-900/55">{campaign.updatedLabel}</p>
        <div className="flex items-center gap-2 text-[11px] text-ink-900/55">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Verified</span>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ title, desc, onRetry }: { title: string; desc: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-ink-900/10 bg-white p-5">
      <p className="text-sm font-bold text-ink-900">{title}</p>
      <p className="mt-1 text-xs text-ink-900/60">{desc}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-slate-50 px-3 py-2 text-xs font-semibold text-ink-900 hover:border-brand-300/40 hover:bg-brand-50 transition-colors"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry
        </button>
      ) : null}
    </div>
  );
}

function normalizeApiCampaigns(payload: unknown): Campaign[] {
  const items: unknown[] =
    Array.isArray(payload) ? payload : (payload && typeof payload === "object" && Array.isArray((payload as any).items) ? (payload as any).items : []);

  const safe = items
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const obj: any = raw;
      const id = String(obj.id ?? obj.campaignId ?? obj._id ?? "");
      const name = String(obj.name ?? obj.title ?? "Untitled Campaign");
      const template = String(obj.template ?? obj.templateName ?? "Template");
      const status = String(obj.status ?? "Running");
      const audience = String(obj.audience ?? obj.audienceLabel ?? obj.recipients ?? "—");
      const delivered = String(obj.delivered ?? obj.deliveredLabel ?? obj.sent ?? "—");
      const updated = String(obj.updated ?? obj.updatedLabel ?? obj.updatedAt ?? "");

      const statusLabel = status.length > 18 ? `${status.slice(0, 18)}…` : status;
      const tone: Campaign["statusTone"] =
        /success|completed|delivered/i.test(status) ? "success" : /paused|scheduled|pending/i.test(status) ? "warning" : "info";

      return {
        id: id || `${name}:${template}`,
        name,
        template,
        statusLabel,
        statusTone: tone,
        audienceLabel: audience,
        deliveredLabel: delivered,
        updatedLabel: updated ? `Updated: ${updated}` : "Updated just now",
      } satisfies Campaign;
    })
    .filter(Boolean) as Campaign[];

  return safe;
}

export function CampaignsPreview({ inView }: { inView: boolean }) {
  const [active, setActive] = useState<CampaignSource>("broadcast");

  const broadcastCampaigns: Campaign[] = useMemo(
    () => [
      {
        id: "b1",
        name: "Flash Sale Broadcast",
        template: "Promo + Coupon",
        audienceLabel: "Segment: High intent",
        deliveredLabel: "44,980 / 45,000",
        statusLabel: "Sending",
        statusTone: "info",
        updatedLabel: "Updated: 2m ago",
      },
      {
        id: "b2",
        name: "Store Pickup Reminder",
        template: "Order Update",
        audienceLabel: "1,240 buyers",
        deliveredLabel: "1,240 / 1,240",
        statusLabel: "Delivered",
        statusTone: "success",
        updatedLabel: "Updated: 18m ago",
      },
      {
        id: "b3",
        name: "Winback 7-Day",
        template: "Offer + CTA",
        audienceLabel: "3 segments",
        deliveredLabel: "8,680 / 9,120",
        statusLabel: "Scheduled",
        statusTone: "warning",
        updatedLabel: "Updated: in 35m",
      },
    ],
    [],
  );

  const csvCampaigns: Campaign[] = useMemo(
    () => [
      {
        id: "c1",
        name: "Festive List Upload",
        template: "New Launch",
        audienceLabel: "CSV: 12,400 rows",
        deliveredLabel: "12,084 / 12,400",
        statusLabel: "Running",
        statusTone: "info",
        updatedLabel: "Updated: 6m ago",
      },
      {
        id: "c2",
        name: "Renewal Reminder",
        template: "Subscription",
        audienceLabel: "CSV: 3,100 rows",
        deliveredLabel: "3,100 / 3,100",
        statusLabel: "Completed",
        statusTone: "success",
        updatedLabel: "Updated: 42m ago",
      },
      {
        id: "c3",
        name: "Event RSVP",
        template: "Invite + QR",
        audienceLabel: "CSV: 980 rows",
        deliveredLabel: "870 / 980",
        statusLabel: "Paused",
        statusTone: "warning",
        updatedLabel: "Updated: 1h ago",
      },
    ],
    [],
  );

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiCampaigns, setApiCampaigns] = useState<Campaign[]>([]);

  const apiUrl = String(import.meta.env.VITE_CAMPAIGNS_API_URL || "").trim();

  const runApiLoad = () => {
    setApiError(null);
    setApiLoading(true);

    const ctrl = new AbortController();
    const start = Date.now();

    const fallback = () => {
      // Simulated dynamic response (for landing preview) — delayed to demonstrate skeleton binding.
      const simulated: Campaign[] = [
        {
          id: "a1",
          name: "Abandoned Cart (API)",
          template: "Cart Recovery",
          audienceLabel: "Dynamic: event stream",
          deliveredLabel: "Auto-scaling",
          statusLabel: "Live",
          statusTone: "info",
          updatedLabel: "Updated: just now",
        },
        {
          id: "a2",
          name: "Post-Purchase Upsell",
          template: "Product Recommendation",
          audienceLabel: "Dynamic: customers",
          deliveredLabel: "Rules-based",
          statusLabel: "Delivered",
          statusTone: "success",
          updatedLabel: "Updated: 9m ago",
        },
        {
          id: "a3",
          name: "Lead Qualification Bot",
          template: "Questions + Tags",
          audienceLabel: "Dynamic: inbound",
          deliveredLabel: "24/7 routing",
          statusLabel: "Running",
          statusTone: "info",
          updatedLabel: "Updated: 1m ago",
        },
      ];

      const elapsed = Date.now() - start;
      const minDelay = 650;
      const delay = Math.max(0, minDelay - elapsed);

      window.setTimeout(() => {
        if (ctrl.signal.aborted) return;
        setApiCampaigns(simulated);
        setApiLoading(false);
      }, delay);
    };

    if (!apiUrl) {
      fallback();
      return () => ctrl.abort();
    }

    (async () => {
      try {
        const res = await fetch(apiUrl, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        const normalized = normalizeApiCampaigns(data);
        if (!normalized.length) throw new Error("No campaigns found");

        const elapsed = Date.now() - start;
        const minDelay = 450;
        const delay = Math.max(0, minDelay - elapsed);

        window.setTimeout(() => {
          if (ctrl.signal.aborted) return;
          setApiCampaigns(normalized);
          setApiLoading(false);
        }, delay);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setApiError(e instanceof Error ? e.message : "Failed to load campaigns");
        setApiLoading(false);
      }
    })();

    return () => ctrl.abort();
  };

  useEffect(() => {
    if (active !== "api") return;
    if (apiCampaigns.length) return;
    return runApiLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const campaigns = active === "broadcast" ? broadcastCampaigns : active === "csv" ? csvCampaigns : apiCampaigns;

  return (
    <div className="rounded-2xl bg-slate-50 border border-ink-900/10 p-5 overflow-hidden w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-ink-900/10">
            {active === "broadcast" ? (
              <Megaphone className="h-4 w-4 text-[#25D366]" />
            ) : active === "csv" ? (
              <FileSpreadsheet className="h-4 w-4 text-[#06b6d4]" />
            ) : (
              <Cloud className="h-4 w-4 text-[#7c3aed]" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">Campaigns</p>
            <p className="text-xs text-ink-900/55">
              {active === "broadcast" ? "Broadcast to segments using templates" : active === "csv" ? "Upload CSV and map template fields" : "Sync campaigns dynamically via API"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-2xl border border-ink-900/10 bg-white p-1">
            {([
              { key: "broadcast", label: "Broadcast", icon: <Megaphone className="h-4 w-4" /> },
              { key: "csv", label: "CSV", icon: <FileSpreadsheet className="h-4 w-4" /> },
              { key: "api", label: "API", icon: <Cloud className="h-4 w-4" /> },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                  active === t.key ? "bg-brand-50 text-ink-900 border border-brand-300/40" : "text-ink-900/60 hover:text-ink-900 hover:bg-slate-50",
                ].join(" ")}
              >
                <span className={active === t.key ? "text-brand-700" : ""}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-ink-900/55">
            <Sparkles className="h-4 w-4" />
            <span>Template-ready</span>
            <span className="mx-1 h-1 w-1 rounded-full bg-ink-900/20" />
            <Timer className="h-4 w-4" />
            <span>Fast scheduling</span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {active === "api" && apiError ? (
          <EmptyState title="Couldn’t load API campaigns" desc={apiError} onRetry={() => runApiLoad()} />
        ) : null}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {active === "api" && apiLoading ? (
            Array.from({ length: 6 }, (_, i) => <SkeletonCampaignCard key={i} />)
          ) : campaigns.length ? (
            campaigns.map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} inView={inView} />)
          ) : (
            <EmptyState
              title="No campaigns yet"
              desc={active === "api" ? "Connect your API to start syncing campaign data automatically." : "Create a campaign using templates to see it here."}
            />
          )}
        </div>

        {active === "csv" ? (
          <div className="mt-4 rounded-2xl border border-ink-900/10 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#06b6d4]">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">CSV mapping</p>
                  <p className="text-xs text-ink-900/55">Static data fill: name, orderId, coupon, link</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-900/55">
                <span className="rounded-full border border-ink-900/10 bg-slate-50 px-2.5 py-1">contacts_may.csv</span>
                <span className="rounded-full border border-ink-900/10 bg-slate-50 px-2.5 py-1">4 fields mapped</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { k: "phone", v: "+91 98xxxxxxx" },
                { k: "name", v: "Aisha" },
                { k: "orderId", v: "OD-18421" },
                { k: "coupon", v: "MAY10" },
              ].map((r) => (
                <div key={r.k} className="rounded-xl border border-ink-900/10 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-900/45">{r.k}</p>
                  <p className="mt-1 text-xs font-semibold text-ink-900 truncate">{r.v}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {active === "broadcast" ? (
          <div className="mt-4 rounded-2xl border border-ink-900/10 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366]">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Broadcast template</p>
                  <p className="text-xs text-ink-900/55">Static fill: segments + template variables</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-900/55">
                <span className="rounded-full border border-ink-900/10 bg-slate-50 px-2.5 py-1">Segment: High intent</span>
                <span className="rounded-full border border-ink-900/10 bg-slate-50 px-2.5 py-1">Schedule: 6:30 PM</span>
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-3 gap-3">
              {[
                { label: "Template", value: "Promo + Coupon" },
                { label: "Personalize", value: "{name}, {coupon}" },
                { label: "CTA", value: "Shop now → short link" },
              ].map((x) => (
                <div key={x.label} className="rounded-xl border border-ink-900/10 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-900/45">{x.label}</p>
                  <p className="mt-1 text-xs font-semibold text-ink-900">{x.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {active === "api" ? (
          <div className="mt-4 rounded-2xl border border-ink-900/10 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-[#7c3aed]">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">API sync</p>
                  <p className="text-xs text-ink-900/55">Dynamic data: events → campaigns → delivery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => runApiLoad()}
                className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-slate-50 px-3 py-2 text-xs font-semibold text-ink-900 hover:border-brand-300/40 hover:bg-brand-50 transition-colors"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            <div className="mt-4 grid md:grid-cols-3 gap-3">
              {[
                { label: "Endpoint", value: apiUrl ? "Connected" : "Demo mode" },
                { label: "Mode", value: "Pull JSON + normalize" },
                { label: "Binding", value: apiLoading ? "Skeleton → grid" : "Grid → metrics" },
              ].map((x) => (
                <div key={x.label} className="rounded-xl border border-ink-900/10 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-900/45">{x.label}</p>
                  <p className="mt-1 text-xs font-semibold text-ink-900">{x.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
