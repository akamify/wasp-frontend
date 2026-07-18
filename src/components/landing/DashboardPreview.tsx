import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Check,
  Eye,
  FileText,
  Megaphone,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { formatCurrencySafe } from "@shared/config/currency";

const metrics = [
  { label: "Contacts", value: "12,840", trend: "+18.4%", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Messages", value: "48,290", trend: "+24.8%", icon: MessageCircle, color: "text-orange-600", bg: "bg-orange-50" },
  { label: "Sent", value: "46,870", trend: "Total", icon: Send, color: "text-cyan-600", bg: "bg-cyan-50" },
  { label: "Delivered", value: "44,216", trend: "Good", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
] as const;

const graphData = [
  { label: "Mon", sent: 4200, delivered: 3780 },
  { label: "Tue", sent: 5800, delivered: 5340 },
  { label: "Wed", sent: 4700, delivered: 4380 },
  { label: "Thu", sent: 7200, delivered: 6710 },
  { label: "Fri", sent: 6500, delivered: 6120 },
  { label: "Sat", sent: 8100, delivered: 7620 },
  { label: "Sun", sent: 7600, delivered: 7240 },
] as const;

function getChartPath(key: "sent" | "delivered") {
  const width = 800;
  const height = 250;
  const maxValue = Math.max(...graphData.map((point) => point[key]), 1);
  const points = graphData.map((point, index) => ({
    x: (index / (graphData.length - 1)) * width,
    y: height - (point[key] / maxValue) * (height * 0.82),
  }));

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x},${point.y}`;
    const previous = points[index - 1];
    const controlX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${controlX},${previous.y} ${controlX},${point.y} ${point.x},${point.y}`;
  }, "");
}

function MetricCard({ metric, index, inView }: {
  metric: (typeof metrics)[number];
  index: number;
  inView: boolean;
}) {
  const Icon = metric.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.32 + index * 0.07, duration: 0.4 }}
      className="flex items-center justify-between rounded-[5px] border border-slate-200 bg-white p-3 shadow-sm md:p-4"
    >
      <div className="min-w-0">
        <div className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-500 md:text-[10px]">{metric.label}</div>
        <div className="mt-1 text-lg font-black tracking-tight text-slate-900 md:text-2xl">{metric.value}</div>
        <div className={`mt-1 inline-flex rounded-[4px] px-1.5 py-0.5 text-[9px] font-black ${metric.bg} ${metric.color}`}>
          {metric.trend}
        </div>
      </div>
      <div className={`ml-2 rounded-[5px] p-2.5 ${metric.bg} ${metric.color}`}>
        <Icon size={19} />
      </div>
    </motion.div>
  );
}

function CampaignChart({ inView }: { inView: boolean }) {
  const sentPath = getChartPath("sent");
  const deliveredPath = getChartPath("delivered");

  return (
    <div className="rounded-[5px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-black text-slate-900 md:text-lg">Campaign Activity</h3>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500 md:text-xs">Real-time message delivery tracking</p>
        </div>
        <div className="flex self-start rounded-[5px] bg-slate-100 p-1">
          {["Today", "Last 7 Days", "30 Days"].map((filter) => (
            <span
              key={filter}
              className={`rounded-[5px] px-2.5 py-1 text-[9px] font-bold md:px-3 md:text-[10px] ${
                filter === "Last 7 Days" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {filter}
            </span>
          ))}
        </div>
      </div>

      <div className="relative h-[170px] md:h-[220px]">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-30">
          {[0, 1, 2, 3, 4].map((line) => <div key={line} className="border-t border-slate-300" />)}
        </div>
        <svg viewBox="0 0 800 250" preserveAspectRatio="none" className="relative z-10 h-full w-full overflow-visible">
          <path d={`${deliveredPath} L 800,250 L 0,250 Z`} className="fill-brand-500/10" />
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ delay: 0.45, duration: 1 }}
            d={sentPath}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ delay: 0.55, duration: 1.1 }}
            d={deliveredPath}
            fill="none"
            stroke="#16a34a"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="mt-4 grid grid-cols-7 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
        {graphData.map((point) => <span key={point.label}>{point.label}</span>)}
      </div>
      <div className="mt-4 flex items-center justify-end gap-4 text-[9px] font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-slate-500"><i className="h-2 w-2 rounded-full bg-slate-300" /> Sent</span>
        <span className="flex items-center gap-1.5 text-brand-700"><i className="h-2 w-2 rounded-full bg-brand-600" /> Delivered</span>
      </div>
    </div>
  );
}

function AccountSidebar() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[5px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[5px] bg-gradient-to-br from-brand-500 to-emerald-700 text-sm font-black text-white">AS</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-slate-900">Akamify Store</div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-500">+91 98765 43210</div>
          </div>
        </div>
        <div className="mt-4 grid grid-rows-2 gap-2">
          <div className="rounded-[5px] bg-slate-50 p-2.5">
            <div className="text-[9px] font-bold uppercase text-slate-400">Phone Number</div>
            <div className="mt-1 text-xs font-black text-slate-800">+91 12345 67891</div>
          </div>
          <div className="rounded-[5px] bg-slate-50 p-2.5">
            <div className="text-[9px] font-bold uppercase text-slate-400">Category</div>
            <div className="mt-1 text-xs font-black text-slate-800">Others</div>
          </div>
        </div>
      </div>

      <div className="rounded-[5px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Wallet Balance</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{formatCurrencySafe(8420.5, "INR")}</div>
          </div>
          <div className="rounded-[5px] bg-brand-50 p-2.5 text-brand-700"><Wallet size={20} /></div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[68%] rounded-full bg-brand-600" />
        </div>
        <div className="mt-2 text-[9px] font-semibold text-slate-400">Enough for approximately 32,000 messages</div>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="dashboard" className="relative overflow-hidden bg-gradient-to-b from-white to-[#f7f6f2] py-12 md:py-16">
      <div className="pointer-events-none absolute -right-40 -top-60 h-[500px] w-[500px] rounded-full bg-[#25D366]/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="mb-12 text-center"
        >
          <h2 className="text-4xl font-extrabold text-ink-900 lg:text-5xl">
            Your command center for{" "}
            <span className="bg-gradient-to-r from-[#06b6d4] to-[#25D366] bg-clip-text text-transparent">WhatsApp growth</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-900/65">
            A real dashboard-style preview of campaigns, contacts, delivery performance and account health.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 44 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[12px] border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-900/10"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <div className="hidden gap-1.5 sm:flex">
                <i className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <i className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400 md:text-xs">wasp.akamify.com/app</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-[10px] font-black text-emerald-600 sm:flex"><i className="h-2 w-2 rounded-full bg-emerald-500" /> WABA Status</span>
              <span className="flex items-center gap-1.5 rounded-[5px] bg-brand-600 px-2.5 py-1.5 text-[10px] font-black text-white"><Plus size={12} /> New Campaign</span>
            </div>
          </div>

          <div className="p-3 md:p-6">
            <div className="mb-4 flex flex-col gap-3 rounded-[5px] border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-black text-slate-900 md:text-sm">Complete your account setup</div>
                <div className="mt-1 text-[10px] font-medium text-slate-500">4 of 5 steps completed</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Meta Account", "Template", "Contacts", "Wallet"].map((step) => (
                  <span key={step} className="flex items-center gap-1 rounded-[5px] bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                    <Check size={10} /> {step}
                  </span>
                ))}
                <span className="rounded-[5px] bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">Create Campaign</span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((metric, index) => <MetricCard key={metric.label} metric={metric} index={index} inView={inView} />)}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Delivery Rate", value: "94.3%", icon: Send, tone: "text-emerald-700 bg-emerald-50" },
                    { label: "Read Rate", value: "82.7%", icon: Eye, tone: "text-violet-700 bg-violet-50" },
                    { label: "Campaigns", value: "28", icon: Megaphone, tone: "text-fuchsia-700 bg-fuchsia-50" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[5px] border border-slate-200 bg-white p-3 shadow-sm">
                      <div className={`inline-flex rounded-[5px] p-2 ${item.tone}`}><item.icon size={16} /></div>
                      <div className="mt-3 text-lg font-black text-slate-900 md:text-2xl">{item.value}</div>
                      <div className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wider text-slate-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <AccountSidebar />
            </div>

            <div className="mt-4">
              <CampaignChart inView={inView} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { text: "Summer Sale campaign sent to 4,820 contacts", time: "2 min ago", icon: Megaphone },
                { text: "Order update template approved by Meta", time: "18 min ago", icon: FileText },
                { text: "1,240 contacts imported successfully", time: "42 min ago", icon: Users },
              ].map((activity) => (
                <div key={activity.text} className="flex items-start gap-3 rounded-[5px] border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="rounded-[5px] bg-brand-50 p-2 text-brand-700"><activity.icon size={14} /></div>
                  <div>
                    <div className="text-[10px] font-bold leading-relaxed text-slate-700">{activity.text}</div>
                    <div className="mt-1 text-[9px] font-medium text-slate-400">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
