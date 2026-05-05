import { useRef } from "react";
import { motion, useInView } from "framer-motion";

import { BRAND_SLUG } from "../../config/brand";

const stats = [
  { label: "Messages Delivered", value: "2.4B+", delta: "+18% this month" },
  { label: "Active Campaigns", value: "12,840", delta: "Across 50+ countries" },
  { label: "Avg. Open Rate", value: "94.7%", delta: "vs 21% for email" },
  { label: "Revenue Attributed", value: "$48M+", delta: "Last 30 days" },
];

const activities = [
  { type: "sent", text: "Campaign \"Black Friday Flash\" sent to 45,000 contacts", time: "2m ago", color: "#25D366" },
  { type: "reply", text: "New reply from +91 98765 43210 - \"I'm interested!\"", time: "5m ago", color: "#06b6d4" },
  { type: "bot", text: "Chatbot qualified 340 leads from Webinar follow-up", time: "12m ago", color: "#7c3aed" },
  { type: "link", text: "Smart link 'product-launch' hit 1,200 clicks", time: "28m ago", color: "#f59e0b" },
  { type: "sent", text: "Drip sequence step 3 sent to 8,920 users", time: "1h ago", color: "#25D366" },
];

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
              <span className="text-xs text-ink-900/45 font-mono">{`app.${BRAND_SLUG || "brand"}.com/dashboard`}</span>
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
                    className="rounded-2xl bg-slate-50 border border-ink-900/10 p-4 hover:border-brand-300/40 transition-colors group"
                  >
                    <p className="text-xs text-ink-900/55 mb-1">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-ink-900">{stat.value}</p>
                    <p className="text-xs text-[#25D366] mt-1">{stat.delta}</p>
                  </motion.div>
                ))}
              </div>

              {/* Bar chart mockup */}
              <div className="rounded-2xl bg-slate-50 border border-ink-900/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-ink-900">Message Volume</p>
                  <span className="text-xs text-ink-900/55">Last 7 days</span>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {[60, 80, 45, 95, 70, 88, 100].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={inView ? { scaleY: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                      style={{ originY: 1 }}
                      className="flex-1 rounded-t-lg"
                      title={`Day ${i + 1}`}
                    >
                      <div
                        className="w-full rounded-t-lg"
                        style={{
                          height: `${h}%`,
                          background: i === 6 ? "linear-gradient(to top, #25D366, #11d593)" : "rgba(37,211,102,0.25)"
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d} className="text-[10px] text-ink-900/45 flex-1 text-center">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Activity feed */}
            <div className="rounded-2xl bg-slate-50 border border-ink-900/10 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Live Activity</p>
                <div className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
              </div>
              <div className="flex flex-col gap-3">
                {activities.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                    className="flex gap-3 items-start"
                  >
                    <div className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
                    <div>
                      <p className="text-xs text-ink-900/72 leading-snug">{a.text}</p>
                      <p className="text-[10px] text-ink-900/45 mt-0.5">{a.time}</p>
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

