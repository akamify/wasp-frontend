import { useRef } from "react";
import { motion, useInView } from "framer-motion";

import { CampaignsPreview } from "./CampaignsPreview";

export function CampaignsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="campaigns"
      className="relative py-12 md:py-10 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7f6f2 100%)" }}
    >
      <div className="absolute -top-40 left-0 w-96 h-96 rounded-full bg-[#06b6d4]/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-0 w-96 h-96 rounded-full bg-[#25D366]/8 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-extrabold text-ink-900 mb-4">
            Campaigns for every{" "}
            <span className="bg-gradient-to-r from-[#25D366] to-[#06b6d4] bg-clip-text text-transparent">
              workflow
            </span>
          </h2>
          <p className="text-lg text-ink-900/65 max-w-2xl mx-auto">
            Broadcast and CSV campaigns use static data fill. API campaigns sync dynamically — with a proper grid and skeleton loader.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-ink-900/10 bg-white shadow-2xl shadow-black/10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-ink-900/10 bg-slate-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Campaigns preview</p>
            <p className="text-xs text-ink-900/55">Templates • Variables • Scheduling</p>
          </div>
          <div className="p-6">
            <CampaignsPreview inView={inView} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

