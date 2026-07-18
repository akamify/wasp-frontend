"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  GitBranch,
  MessageCircle,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "@shared/providers/AuthContext";
import { authAwareHref } from "@shared/utils/authNavigation";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function MiniFeature({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="group flex gap-3 items-start">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-[13px] font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{text}</p>
      </div>
    </div>
  );
}

export function AutomationFlow() {
  const { token, user } = useAuth();

  const startHref = authAwareHref({
    token,
    role: user?.role,
    guestHref: "/register",
  });

  return (
    <section className="relative overflow-hidden bg-[#fafafa] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      {/* Sleek Minimalist Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 right-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/3 rounded-full bg-emerald-200/40 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/3 rounded-full bg-lime-200/40 blur-[100px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.15] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]"
      >
        {/* Left Text Content */}
        <div className="max-w-xl">
          <motion.div
            variants={item}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm"
          >
            <GitBranch size={12} className="text-emerald-500" />
            Visual Flow Builder
          </motion.div>

          <motion.h2
            variants={item}
            className="text-4xl font-black tracking-tighter text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]"
          >
            Build workflows. <br />
            <span className="bg-gradient-to-br from-emerald-600 to-lime-500 bg-clip-text text-transparent">
              Zero coding required.
            </span>
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-5 text-[14px] leading-relaxed text-slate-500 max-w-md"
          >
            Design complex WhatsApp automation visually. Map out welcome sequences, conditional replies, and lead routing in a seamless drag-and-drop canvas.
          </motion.p>

          <motion.div variants={item} className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6">
            <MiniFeature icon={MousePointerClick} title="Drag & Drop" text="Connect nodes visually." />
            <MiniFeature icon={MessageCircle} title="Smart Replies" text="Trigger on keywords." />
            <MiniFeature icon={Bot} title="Auto-Routing" text="Send leads to sales." />
            <MiniFeature icon={BadgeCheck} title="Analytics" text="Track drop-off rates." />
          </motion.div>

          <motion.div
            variants={item}
            className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <a
              href={startHref}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-[13px] font-bold text-white shadow-xl shadow-slate-200 transition-all duration-300 hover:bg-emerald-600 hover:shadow-emerald-200"
            >
              Start Building
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              Official API Partner
            </div>
          </motion.div>
        </div>

        {/* Right Visual Element */}
        <motion.div variants={item} className="relative mx-auto w-full">
          {/* Main Mockup Window */}
          <div className="relative z-10 rounded-[2rem] border border-slate-200/60 bg-white/40 p-2 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl">
            <div className="rounded-[1.6rem] border border-white bg-slate-50/50 overflow-hidden">
              <img
                src="/automationflow.jpg"
                alt="WhatsApp automation flow builder dashboard"
                width={1448}
                height={1086}
                loading="lazy"
                decoding="async"
                className="w-full object-cover"
              />
            </div>
          </div>

          {/* Floating UI Element - Simulating a workflow node */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute -left-8 top-1/4 z-20 hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-emerald-100/50 backdrop-blur-xl lg:block w-48"
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Trigger</p>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Zap size={14} fill="currentColor" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-900">Cart Abandoned</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Fires immediately</p>
              </div>
            </div>
          </motion.div>
          
          {/* Subtle connecting line effect behind mockup */}
          <div className="absolute top-1/2 -left-12 -right-12 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-50 z-0" />
          <div className="absolute left-1/2 -top-12 -bottom-12 w-px bg-gradient-to-b from-transparent via-emerald-300 to-transparent opacity-50 z-0" />
        </motion.div>
      </motion.div>
    </section>
  );
}
