"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Zap,
  MessageSquareText,
  MousePointerClick,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "@shared/providers/AuthContext";
import { authAwareHref } from "@shared/utils/authNavigation";

// Minimalist animation variants
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function FeaturePoint({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      variants={item}
      className="flex gap-3 items-start p-3 rounded-xl hover:bg-emerald-50/50 transition-colors"
    >
      <div className="mt-1 p-2 rounded-lg bg-emerald-100 text-emerald-600">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
}

export function BrodcasSection() {
  const { token, user } = useAuth();
  const startHref = authAwareHref({
    token,
    role: user?.role,
    guestHref: "/register",
  });

  return (
    <section className="relative py-12 px-4 overflow-hidden bg-white h-screen max-h-[800px] flex items-center justify-center">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[120px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center"
      >
        {/* Text Content */}
        <div className="space-y-6">
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wider uppercase"
          >
            <Zap size={12} fill="currentColor" /> Powered by WhatsApp API
          </motion.div>

          <motion.h2
            variants={item}
            className="text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.1]"
          >
            Turn Broadcasts into{" "}
            <span className="text-emerald-600">Revenue</span>
          </motion.h2>

          <motion.div variants={item} className="space-y-1">
            <FeaturePoint
              icon={MessageSquareText}
              title="Official Reach"
              text="Deliver campaigns directly to WhatsApp inboxes."
            />
            <FeaturePoint
              icon={MousePointerClick}
              title="High-Conversion CTAs"
              text="Add interactive buttons for instant action."
            />
            <FeaturePoint
              icon={CalendarClock}
              title="Smart Scheduling"
              text="Set-and-forget your seasonal marketing."
            />
          </motion.div>

          <motion.div variants={item}>
            <a
              href={startHref}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-200"
            >
              Start Free Trial <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>

        {/* Visual Showcase */}
        <motion.div
          variants={item}
          className="relative hidden lg:flex justify-center"
        >
          <div className="relative w-full max-w-[460px] rounded-3xl bg-slate-100 p-2 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
            <img
              src="/broadcast.png"
              alt="WhatsApp broadcast campaign analytics dashboard"
              className="rounded-2xl w-full shadow-inner object-contain"
            />

            <div className="absolute -bottom-5 -left-5 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 w-40">
              <div className="text-[9px] font-bold text-slate-400">
                CAMPAIGN REACH
              </div>
              <div className="text-lg font-black text-slate-900">98.4%</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
