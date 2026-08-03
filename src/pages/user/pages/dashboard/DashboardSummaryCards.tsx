import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  MousePointerClick,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card } from "@components/ui/Card";
import { cn } from "@shared/utils/cn";

type DashboardAnalytics = {
  overview?: {
    clicked?: number | string | null;
    converted?: number | string | null;
    revenue?: number | string | null;
    spend?: number | string | null;
    roi?: number | string | null;
  };
  rates?: {
    clickRatePct?: number | string | null;
    conversionRatePct?: number | string | null;
  };
  counts?: {
    campaigns?: number | string | null;
    templates?: number | string | null;
  };
};

type ContactsGrowth = {
  thisWeek?: number | string | null;
  pct?: number | string | null;
};

type DashboardSummaryCardsProps = {
  analytics?: DashboardAnalytics | null;
  readRatePct?: number;
  sent?: number;
  read?: number;
  contactsGrowth?: ContactsGrowth | null;
  contactsUp?: boolean;
};

type SummaryTone = "emerald" | "violet" | "amber";

type RevenueTone = "emerald" | "violet" | "sky";

export function DashboardSummaryCards({
  analytics,
  readRatePct = 0,
  sent = 0,
  read = 0,
  contactsGrowth,
  contactsUp = false,
}: DashboardSummaryCardsProps) {
  const clicked = toSafeNumber(analytics?.overview?.clicked);
  const converted = toSafeNumber(analytics?.overview?.converted);
  const revenue = toSafeNumber(analytics?.overview?.revenue);
  const spend = toSafeNumber(analytics?.overview?.spend);

  const clickRatePct = clampPercentage(
    toSafeNumber(analytics?.rates?.clickRatePct),
  );

  const safeReadRatePct = clampPercentage(readRatePct);

  const conversionRatePct = clampPercentage(
    toSafeNumber(analytics?.rates?.conversionRatePct),
  );

  const campaigns = toSafeNumber(analytics?.counts?.campaigns);
  const templates = toSafeNumber(analytics?.counts?.templates);

  const weeklyContacts = toSafeNumber(contactsGrowth?.thisWeek);
  const contactGrowthPct = Math.abs(toSafeNumber(contactsGrowth?.pct));

  const roi = getRoiPercentage(analytics?.overview?.roi);

  return (
    <section
      aria-label="Dashboard performance summary"
      className="space-y-4"
    >
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryMetricCard
          title="Click-through rate"
          value={`${clickRatePct.toFixed(1)}%`}
          helper={`${formatNumber(clicked)} of ${formatNumber(
            sent,
          )} messages clicked`}
          progress={clickRatePct}
          icon={<MousePointerClick size={19} />}
          tone="emerald"
        />

        <SummaryMetricCard
          title="Read rate"
          value={`${safeReadRatePct.toFixed(1)}%`}
          helper={`${formatNumber(read)} of ${formatNumber(
            sent,
          )} messages read`}
          progress={safeReadRatePct}
          icon={<Eye size={19} />}
          tone="violet"
        />

        <SummaryMetricCard
          title="Conversion rate"
          value={`${conversionRatePct.toFixed(1)}%`}
          helper={`${formatNumber(converted)} conversions from ${formatNumber(
            clicked,
          )} clicks`}
          progress={conversionRatePct}
          icon={
            converted > 0 ? (
              <TrendingUp size={19} />
            ) : (
              <TrendingDown size={19} />
            )
          }
          tone="amber"
          trend={converted > 0 ? "Positive outcome" : "No conversions yet"}
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[0.8fr_1.7fr]">
        <ContactGrowthCard
          weeklyContacts={weeklyContacts}
          growthPercentage={contactGrowthPct}
          contactsUp={contactsUp}
        />

        <RevenueAttributionCard
          revenue={revenue}
          spend={spend}
          roi={roi}
          campaigns={campaigns}
          templates={templates}
        />
      </div>
    </section>
  );
}

function SummaryMetricCard({
  title,
  value,
  helper,
  progress,
  icon,
  tone,
  trend,
}: {
  title: string;
  value: string;
  helper: string;
  progress: number;
  icon: ReactNode;
  tone: SummaryTone;
  trend?: string;
}) {
  const toneMap: Record<
    SummaryTone,
    {
      icon: string;
      progress: string;
      soft: string;
    }
  > = {
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      progress: "bg-emerald-500",
      soft: "from-emerald-500/[0.08] to-transparent",
    },
    violet: {
      icon: "bg-violet-50 text-violet-700",
      progress: "bg-violet-500",
      soft: "from-violet-500/[0.08] to-transparent",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      progress: "bg-amber-500",
      soft: "from-amber-500/[0.08] to-transparent",
    },
  };

  const currentTone = toneMap[tone];

  return (
    <Card
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-[2px]",
        "border border-slate-200/90 bg-white p-5",
        "shadow-[0_18px_50px_-40px_rgba(15,23,42,0.55)]",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-slate-300",
        "hover:shadow-[0_24px_62px_-42px_rgba(15,23,42,0.65)]",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b opacity-80",
          currentTone.soft,
        )}
      />

      <div className="relative">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Performance metric
            </p>

            <h3 className="mt-1.5 truncate text-[15px] font-black tracking-tight text-slate-900">
              {title}
            </h3>
          </div>

          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-[2px]",
              currentTone.icon,
            )}
          >
            {icon}
          </div>
        </div>

        <div className="mt-6 text-[34px] font-black leading-none tracking-[-0.035em] text-slate-950 sm:text-[38px]">
          {value}
        </div>

        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label={title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700 ease-out",
              currentTone.progress,
            )}
            style={{
              width: `${clampPercentage(progress)}%`,
            }}
          />
        </div>

        <p className="mt-4 min-h-10 text-[13px] font-medium leading-5 text-slate-500">
          {helper}
        </p>

        {trend ? (
          <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {trend}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function ContactGrowthCard({
  weeklyContacts,
  growthPercentage,
  contactsUp,
}: {
  weeklyContacts: number;
  growthPercentage: number;
  contactsUp: boolean;
}) {
  return (
    <Card
      className={cn(
        "group min-w-0 overflow-hidden rounded-[2px]",
        "border border-slate-200/90 bg-white p-5",
        "shadow-[0_18px_50px_-40px_rgba(15,23,42,0.55)]",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-slate-300",
        "hover:shadow-[0_24px_62px_-42px_rgba(15,23,42,0.65)]",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[2px] bg-blue-50 text-blue-700">
            <Users size={19} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-black tracking-tight text-slate-900">
              Contact growth
            </h3>

            <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              This week
            </p>
          </div>
        </div>

        <GrowthBadge
          value={growthPercentage}
          positive={contactsUp}
        />
      </div>

      <div className="mt-7">
        <div className="text-[40px] font-black leading-none tracking-[-0.04em] text-slate-950 sm:text-[44px]">
          {formatNumber(weeklyContacts)}
        </div>

        <p className="mt-2 text-xs font-semibold text-slate-500">
          Contacts added to your audience
        </p>
      </div>

      <div className="mt-6 rounded-[2px] border border-slate-200 bg-slate-50/80 px-4 py-3.5">
        <p className="text-[12px] font-medium leading-5 text-slate-500">
          Grow your audience through contact imports, lead forms and inbound
          WhatsApp conversations.
        </p>
      </div>
    </Card>
  );
}

function GrowthBadge({
  value,
  positive,
}: {
  value: number;
  positive: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-[2px] px-2.5 py-1.5",
        "text-[11px] font-black",
        positive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700",
      )}
    >
      {positive ? (
        <ArrowUpRight size={14} />
      ) : (
        <ArrowDownRight size={14} />
      )}

      {value.toFixed(1)}%
    </div>
  );
}

function RevenueAttributionCard({
  revenue,
  spend,
  roi,
  campaigns,
  templates,
}: {
  revenue: number;
  spend: number;
  roi: number | null;
  campaigns: number;
  templates: number;
}) {
  return (
    <Card
      className={cn(
        "group min-w-0 overflow-hidden rounded-[2px]",
        "border border-slate-200/90 bg-white p-5",
        "shadow-[0_18px_50px_-40px_rgba(15,23,42,0.55)]",
        "transition-all duration-200",
        "hover:border-slate-300",
        "hover:shadow-[0_24px_62px_-42px_rgba(15,23,42,0.65)]",
        "sm:p-6",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[2px] bg-fuchsia-50 text-fuchsia-700">
          <LayoutDashboard size={19} />
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-black tracking-tight text-slate-900">
            Revenue attribution
          </h3>

          <p className="mt-1 max-w-2xl text-[13px] font-medium leading-5 text-slate-500">
            Track WhatsApp revenue against campaign spend, message activity and
            template usage.
          </p>
        </div>
      </div>

      <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <RevenueStat
          title="Revenue"
          value={formatCurrency(revenue)}
          icon={<IndianRupee size={18} />}
          tone="emerald"
        />

        <RevenueStat
          title="Spend"
          value={formatCurrency(spend)}
          icon={<Megaphone size={18} />}
          tone="violet"
        />

        <RevenueStat
          title="ROI"
          value={roi === null ? "--" : `${roi.toFixed(0)}%`}
          icon={
            roi !== null && roi >= 0 ? (
              <TrendingUp size={18} />
            ) : (
              <TrendingDown size={18} />
            )
          }
          tone="sky"
        />
      </div>

      <div className="mt-6 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">
        <RevenueFootStat
          title="Campaigns"
          value={formatNumber(campaigns)}
          icon={<Megaphone size={18} />}
        />

        <RevenueFootStat
          title="Templates"
          value={formatNumber(templates)}
          icon={<FileText size={18} />}
        />
      </div>
    </Card>
  );
}

function RevenueStat({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: RevenueTone;
}) {
  const toneMap: Record<RevenueTone, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <div className="min-w-0 rounded-[2px] border border-slate-200 bg-slate-50/70 p-4 transition-colors duration-200 hover:border-slate-300 hover:bg-white">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[2px]",
            toneMap[tone],
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">
            {title}
          </p>

          <p className="mt-1 truncate text-lg font-black tracking-tight text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function RevenueFootStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-[2px] border border-slate-200 bg-slate-50/60 px-4 py-4 transition-colors duration-200 hover:border-slate-300 hover:bg-white">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[2px] bg-slate-100 text-slate-700">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="truncate text-2xl font-black leading-none tracking-tight text-slate-950">
          {value}
        </div>

        <div className="mt-1 text-xs font-semibold text-slate-500">
          {title}
        </div>
      </div>
    </div>
  );
}

function toSafeNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, toSafeNumber(value)));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(toSafeNumber(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toSafeNumber(value));
}

function getRoiPercentage(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  /*
   * Backend ROI is currently treated as a ratio:
   * 0.4 becomes 40%.
   */
  return parsed * 100;
}