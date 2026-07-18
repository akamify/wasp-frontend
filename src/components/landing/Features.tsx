"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bot,
  GitBranch,
  MessageSquareText,
  Megaphone,
  MousePointerClick,
  Send,
  Sparkles,
  Zap,
  CalendarClock,
  UsersRound,
  BarChart3,
} from "lucide-react";

const features = [
  {
    title: "Bulk Campaigns",
    text: "Send WhatsApp campaigns to imported contacts with approved templates.",
    icon: Megaphone,
    tag: "Marketing",
  },
  {
    title: "Drag & Drop Flow",
    text: "Build automation journeys visually without writing code.",
    icon: GitBranch,
    tag: "No-Code",
  },
  {
    title: "Smart Chat Bot",
    text: "Reply instantly, qualify leads, and guide users automatically.",
    icon: Bot,
    tag: "Automation",
  },
  {
    title: "Template Messaging",
    text: "Use approved templates for offers, reminders, updates, and follow-ups.",
    icon: MessageSquareText,
    tag: "WhatsApp API",
  },
  {
    title: "CTA Buttons",
    text: "Add quick reply, call, website, and form buttons to increase actions.",
    icon: MousePointerClick,
    tag: "Conversion",
  },
  {
    title: "Campaign Scheduling",
    text: "Schedule seasonal, festival, and reminder campaigns in advance.",
    icon: CalendarClock,
    tag: "Planning",
  },
  {
    title: "Contact Import",
    text: "Upload contacts, segment users, and launch targeted broadcasts.",
    icon: UsersRound,
    tag: "Audience",
  },
  {
    title: "Analytics Tracking",
    text: "Track campaign reach, replies, clicks, and customer engagement.",
    icon: BarChart3,
    tag: "Reports",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function Features() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-emerald-100/80 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-[280px] w-[280px] rounded-full bg-lime-100/80 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#16a34a_1px,transparent_0)] bg-[size:34px_34px] opacity-[0.05]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto w-full max-w-7xl"
      >
        {/* Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <motion.div
            variants={item}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700"
          >
            <Sparkles size={13} />
            Highlighted Features
          </motion.div>

          <motion.h2
            variants={item}
            className="text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl"
          >
            Everything you need to
            <span className="block bg-gradient-to-r from-emerald-600 via-green-500 to-lime-500 bg-clip-text text-transparent">
              grow on WhatsApp.
            </span>
          </motion.h2>

          <motion.p
            variants={item}
            className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base"
          >
            Bulk campaigns, automation flows, chat bot, templates, scheduling,
            and analytics inside one clean platform.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <motion.div
          variants={container}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHighlighted = index === 0 || index === 1 || index === 2;

            return (
              <motion.div
                key={feature.title}
                variants={item}
                className={`group relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 ${
                  isHighlighted
                    ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50 shadow-emerald-100/70 hover:shadow-xl hover:shadow-emerald-100"
                    : "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200/70"
                }`}
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100/70 transition-all duration-300 group-hover:scale-125" />

                <div className="relative">
                  <div className="mb-5 flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 group-hover:rotate-3 ${
                        isHighlighted
                          ? "bg-emerald-600 text-white shadow-emerald-200"
                          : "bg-slate-950 text-white shadow-slate-200 group-hover:bg-emerald-600 group-hover:shadow-emerald-200"
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 shadow-sm">
                      <BadgeCheck size={11} />
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-black tracking-tight text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-2 min-h-[42px] text-xs leading-5 text-slate-500">
                    {feature.text}
                  </p>
{/*
                  <div className="mt-5 flex items-center gap-2 text-xs font-black text-emerald-700 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    Learn more
                    <Send size={13} />
                  </div> */}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Mini Strip */}
        <motion.div
          variants={item}
          className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur-xl"
        >
          {["Official API", "Fast Setup", "No-Code Builder", "Smart Reports"].map(
            (label) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
              >
                <Zap size={13} className="text-emerald-600" />
                {label}
              </span>
            )
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
