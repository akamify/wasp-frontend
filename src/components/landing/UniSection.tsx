"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, UsersRound, MessageCircle, FileText, TrendingUp } from "lucide-react";
import { useAuth } from "@shared/providers/AuthContext";
import { authAwareHref } from "@shared/utils/authNavigation";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function UniFeature({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-[12px] text-slate-500 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export function UniSection() {
  const { token, user } = useAuth();
  const startHref = authAwareHref({ token, role: user?.role, guestHref: "/register" });

  return (
    <section className="relative overflow-hidden bg-white py-20 px-6">
      {/* Abstract Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[140px] -z-10" />

      <motion.div variants={container} initial="hidden" whileInView="show" className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <div className="space-y-8">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-bold tracking-widest uppercase">
            <Sparkles size={12} className="text-emerald-400" /> Higher Ed Admissions
          </motion.div>

          <motion.h2 variants={item} className="text-5xl font-black text-slate-950 tracking-tighter leading-[1.05]">
            Turn Every Click <br />Into an <span className="text-emerald-600">Enrollment.</span>
          </motion.h2>

          <motion.p variants={item} className="text-lg text-slate-600 max-w-md">
            Stop losing leads to dead-end forms. Move your student conversations to WhatsApp and automate the path to admission.
          </motion.p>

          <motion.div variants={item} className="grid sm:grid-cols-2 gap-6">
            <UniFeature icon={UsersRound} title="Capture" text="Instagram/FB leads sync instantly." />
            <UniFeature icon={MessageCircle} title="Engage" text="Automated WhatsApp chat flows." />
            <UniFeature icon={FileText} title="Qualify" text="Collect docs & data in-chat." />
            <UniFeature icon={TrendingUp} title="Convert" text="Reminders that seal the deal." />
          </motion.div>

          <motion.div variants={item} className="flex items-center gap-4 pt-2">
            <a href={startHref} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1">
              Start Campaign <ArrowRight size={18} />
            </a>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <ShieldCheck size={16} className="text-emerald-500" /> Official API
            </div>
          </motion.div>
        </div>

        {/* Right Visual */}
        <motion.div variants={item} className="relative">
          <div className="relative rounded-[2rem] bg-slate-950 p-2 shadow-2xl">
            <img
              src="/university.jpg"
              alt="Education WhatsApp automation dashboard"
              width={1448}
              height={1086}
              loading="lazy"
              decoding="async"
              className="rounded-[1.8rem] w-full"
            />
            
            {/* Floating Stats Card */}
            <div className="absolute hidden lg:flex -left-10 top-1/4 bg-white p-5 rounded-3xl shadow-2xl border border-slate-100 w-48">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Conversion Rate</p>
              <p className="text-3xl font-black text-slate-950">+42%</p>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}
