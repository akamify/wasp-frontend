import { useRef } from "react";
import { motion, useInView } from "framer-motion";

import { formatCurrencySafe } from "@shared/config/currency";

const stats = [
  {
    label: "Messages Delivered",
    value: import.meta.env.VITE_STAT_MESSAGES_DELIVERED || "2.4B+",
    delta: import.meta.env.VITE_STAT_MESSAGES_DELIVERED_DELTA || "All time",
    color: "text-emerald-600"
  },
  {
    label: "Active Campaigns",
    value: import.meta.env.VITE_STAT_ACTIVE_CAMPAIGNS || "12,840",
    delta: import.meta.env.VITE_STAT_ACTIVE_CAMPAIGNS_DELTA || "Currently running",
    color: "text-blue-600"
  },
  {
    label: "Avg. Open Rate",
    value: import.meta.env.VITE_STAT_AVG_OPEN_RATE || "94.7%",
    delta: import.meta.env.VITE_STAT_AVG_OPEN_RATE_DELTA || "Last 30 days",
    color: "text-purple-600"
  },
  {
    label: "Revenue Attributed",
    value: (() => {
      const n = import.meta.env.VITE_STAT_REVENUE;
      const disp = import.meta.env.VITE_STAT_REVENUE_DISPLAY;
      if (n !== undefined && n !== null && String(n).trim() !== "") {
        const num = Number(n);
        if (!Number.isNaN(num)) return formatCurrencySafe(num);
      }
      return disp || "₹48M+";
    })(),
    delta: import.meta.env.VITE_STAT_REVENUE_DELTA || "Last 30 days",
    color: "text-brand-600"
  },
];

const activities = [
  { type: "sent", text: "Campaign \"Black Friday Flash\" sent to 45,000 contacts", time: "2m ago", color: "#25D366" },
  { type: "reply", text: "New reply from +91 98765 43210 - \"I'm interested!\"", time: "5m ago", color: "#06b6d4" },
  { type: "bot", text: "Chatbot qualified 340 leads from Webinar follow-up", time: "12m ago", color: "#7c3aed" },
  { type: "link", text: "Smart link 'product-launch' hit 1,200 clicks", time: "28m ago", color: "#f59e0b" },
  { type: "sent", text: "Drip sequence step 3 sent to 8,920 users", time: "1h ago", color: "#25D366" },
];

function renderQuotedActivityText(text: string) {
  const raw = String(text || "");
  const parts: Array<{ value: string; highlight: boolean }> = [];
  let last = 0;
  const re = /"([^"]+)"|'([^']+)'/g;
  for (let match = re.exec(raw); match; match = re.exec(raw)) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > last) parts.push({ value: raw.slice(last, start), highlight: false });
    parts.push({ value: match[0], highlight: true });
    last = end;
  }
  if (last < raw.length) parts.push({ value: raw.slice(last), highlight: false });

  return (
    <>
      {parts.map((p, idx) =>
        p.highlight ? (
          <span key={idx} className="text-ink-800/80">
            {p.value}
          </span>
        ) : (
          <span key={idx}>{p.value}</span>
        )
      )}
    </>
  );
}

// Parse per-day message volume from env (comma-separated numbers). Fallback to defaults.
const volumeValues: number[] = (() => {
  const raw = String(import.meta.env.VITE_STAT_VOLUME_DAYS || "60,80,45,95,70,88,100");
  const parsed = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
  return parsed.length ? parsed : [60, 80, 45, 95, 70, 88, 100];
})();

// Optional labels for each day (comma-separated). Pads or truncates to match `volumeValues` length.
const volumeLabels: string[] = (() => {
  const raw = String(import.meta.env.VITE_STAT_VOLUME_LABELS || "Mon,Tue,Wed,Thu,Fri,Sat,Sun");
  const parts = raw.split(",").map((s) => s.trim());
  if (parts.length >= volumeValues.length) return parts.slice(0, volumeValues.length);
  return [
    ...parts,
    ...Array.from({ length: Math.max(0, volumeValues.length - parts.length) }, (_, i) => `Day ${parts.length + i + 1}`),
  ];
})();

export function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="dashboard"
      className="relative py-12 md:py-10 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7f6f2 100%)" }}
    >
      <div className="absolute -top-60 right-0 w-[500px] h-[500px] rounded-full bg-[#25D366]/8 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          {/* <span className="inline-block text-xs font-bold tracking-widest uppercase text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/20 rounded-full px-4 py-1.5 mb-4">
            Dashboard
          </span> */}
          <h2 className="text-4xl lg:text-5xl font-extrabold text-ink-900 mb-4">
            Your command center for{" "}
            <span className="bg-gradient-to-r from-[#06b6d4] to-[#25D366] bg-clip-text text-transparent">
              WhatsApp growth
            </span>
          </h2>
          <p className="text-lg text-ink-900/65 max-w-xl mx-auto">
            A real-time overview of every metric that matters - campaigns, contacts, revenue and more.
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-ink-900/10 bg-white shadow-2xl shadow-black/10 overflow-hidden"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink-900/10 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs text-ink-900/45 font-mono">{`whasp.akamify.com/app`}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              <span className="text-xs text-[#25D366]">Live</span>
            </div>
          </div>

          <div className="p-6 grid lg:grid-cols-3 gap-6">
            {/* Left: Stats */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                    className="p-6 border border-ink-900/5 bg-[#fbfcfc] shadow-none rounded-[12px] hover:border-brand-300/30 transition-colors group"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-800/50">{stat.label}</div>
                    <div className="mt-2 text-3xl font-black text-ink-900 tracking-tight">{stat.value}</div>
                    <div className={`text-[11px] font-medium ${stat.color} mt-2`}>{stat.delta}</div>
                  </motion.div>
                ))}
              </div>

              {/* Line Chart mockup */}
              <div className="p-6 border border-ink-900/5 bg-[#fbfcfc] shadow-none rounded-[12px] flex flex-col min-h-[340px] w-full">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-[15px] text-ink-900 tracking-tight">Message Volume</h3>
                  <div className="flex bg-white ring-1 ring-ink-900/10 rounded-[5px] p-0.5">
                    {["Weekly", "Monthly", "Yearly"].map(f => (
                      <div 
                        key={f}
                        className={`px-3 py-1 text-[11px] font-bold rounded-[3px] transition-colors ${f === "Weekly" ? "bg-ink-900 text-white shadow-sm" : "text-ink-800/60"}`}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CSS Line Chart with Multi-lines */}
                <div className="flex-1 flex flex-col justify-end relative mt-2 pb-6">
                  {/* Legend */}
                  <div className="absolute top-0 right-0 flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 text-[#0ea5e9]"><span className="w-2 h-2 rounded-full bg-[#0ea5e9]" /> Sent</div>
                    <div className="flex items-center gap-1.5 text-[#22c55e]"><span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Delivered</div>
                    <div className="flex items-center gap-1.5 text-[#8b5cf6]"><span className="w-2 h-2 rounded-full bg-[#8b5cf6]" /> Read</div>
                  </div>

                  <div className="relative w-full h-[200px] mt-8 mb-6">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                      {/* Grid lines */}
                      <line x1="0" y1="0" x2="100" y2="0" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
                      <line x1="0" y1="100" x2="100" y2="100" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />

                      {(() => {
                        const sentData = volumeValues;
                        const delData = volumeValues.map(v => v * 0.92);
                        const readData = volumeValues.map(v => v * 0.85);
                        
                        const maxVal = Math.max(...sentData, 1);
                        
                        const getPath = (dataArr: number[]) => {
                          return dataArr.map((v, i) => {
                            const x = (i / (volumeValues.length - 1)) * 100;
                            const y = 100 - (v / maxVal) * 100;
                            return `${x},${y}`;
                          }).join(" ");
                        };

                        return (
                          <>
                            <motion.polyline 
                              initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, ease: "easeOut" }} 
                              fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={getPath(sentData)} vectorEffect="non-scaling-stroke" 
                            />
                            <motion.polyline 
                              initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} 
                              fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={getPath(delData)} vectorEffect="non-scaling-stroke" 
                            />
                            <motion.polyline 
                              initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }} 
                              fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={getPath(readData)} vectorEffect="non-scaling-stroke" 
                            />
                          </>
                        );
                      })()}
                    </svg>
                    
                    {/* Overlay labels */}
                    <div className="absolute -bottom-8 left-0 right-0 h-4">
                      {volumeLabels.map((lbl, i) => {
                        const leftPos = (i / (volumeLabels.length - 1)) * 100;
                        let translate = "-translate-x-1/2";
                        if (i === 0) translate = "translate-x-0";
                        if (i === volumeLabels.length - 1) translate = "-translate-x-full";
                        
                        return (
                          <div 
                            key={lbl} 
                            className={`absolute text-[10px] font-bold text-ink-800/40 uppercase tracking-wider ${translate}`}
                            style={{ left: `${leftPos}%` }}
                          >
                            {lbl}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Activity feed */}
            <div className="rounded-[12px] bg-[#fbfcfc] border border-ink-900/5 p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[15px] text-ink-900 tracking-tight">Live Activity</h3>
                <div className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
              </div>
              <div className="flex flex-col gap-6">
                {activities.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="mt-1.5 w-[6px] h-[6px] rounded-full shrink-0" style={{ background: a.color }} />
                    <div>
                      <p className="text-[13px] font-medium text-ink-900 leading-snug">{renderQuotedActivityText(a.text)}</p>
                      <p className="text-[11px] text-ink-800/40 mt-1">{a.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
