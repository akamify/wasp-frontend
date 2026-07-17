"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Users,
  ShieldCheck,
  MessageCircle,
  Zap,
  MousePointerClick,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@shared/providers/AuthContext";
import { authAwareHref } from "@shared/utils/authNavigation";

const YOUTUBE_VIDEO_ID = "Cpvd4yOePWM";

const YOUTUBE_THUMBNAIL_SRC = `https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`;

const getYoutubeEmbedSrc = () =>
  `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&controls=1&playsinline=1&fs=0&autoplay=1`;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 95,
      damping: 20,
    },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

function MiniPill({
  icon: Icon,
  children,
}: {
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-emerald-100 bg-white/95 px-2 py-1.5 text-[10px] font-black text-slate-600 shadow-sm shadow-emerald-100/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 sm:w-auto sm:justify-start sm:gap-2 sm:border-slate-200/80 sm:bg-white/80 sm:px-3.5 sm:py-2 sm:text-xs"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white sm:h-6 sm:w-6">
        <Icon size={11} className="sm:size-[13px]" />
      </span>
      <span className="truncate">{children}</span>
    </motion.div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group flex items-center gap-3 rounded-2xl border border-white/80 bg-white/75 p-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-emerald-100"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition-all duration-300 group-hover:bg-emerald-600">
        <Icon size={17} />
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="text-base font-black text-slate-950">{value}</p>
      </div>
    </motion.div>
  );
}

function HeroYoutubeVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <motion.div
      id="hero-demo-video"
      initial={{ opacity: 0, y: 34, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.35,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mx-auto mt-8 w-full max-w-[1060px] px-0 sm:mt-12 sm:px-5 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-x-0 top-8 -z-10 mx-auto h-52 max-w-5xl rounded-full bg-emerald-200/60 blur-[90px] sm:h-72 sm:blur-[110px]" />

      <div className="absolute -left-2 top-10 z-20 hidden lg:block">
        <HeroStat icon={MessageCircle} label="Replies" value="2.4x Faster" />
      </div>

      <div className="absolute -right-2 bottom-20 z-20 hidden lg:block">
        <HeroStat icon={BarChart3} label="Campaign Reach" value="98.4%" />
      </div>

      <div className="relative rounded-[1.25rem] border border-white/80 bg-white/75 p-1.5 shadow-xl shadow-slate-200/80 backdrop-blur-xl sm:rounded-[2.2rem] sm:p-3 sm:shadow-2xl">
        <div className="relative overflow-hidden rounded-[1rem] bg-slate-950 sm:rounded-[1.7rem]">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400 sm:h-2.5 sm:w-2.5" />
              <span className="h-2 w-2 rounded-full bg-yellow-400 sm:h-2.5 sm:w-2.5" />
              <span className="h-2 w-2 rounded-full bg-emerald-400 sm:h-2.5 sm:w-2.5" />
            </div>

            <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-white/70 sm:block">
              WhatsApp Automation Demo
            </div>

            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-300 sm:text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live Preview
            </div>
          </div>

          <div className="relative aspect-video overflow-hidden bg-slate-950">
            {isPlaying ? (
              <iframe
                title="Akamify WhatsApp automation product demo"
                src={getYoutubeEmbedSrc()}
                className="absolute inset-0 h-full w-full"
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                aria-label="Play Akamify product demo video"
                className="group absolute inset-0 block h-full w-full overflow-hidden text-left"
              >
                <img
                  src={YOUTUBE_THUMBNAIL_SRC}
                  alt="Akamify WhatsApp automation demo video thumbnail"
                  className="h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  draggable={false}
                  onError={(event) => {
                    event.currentTarget.src = `https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`;
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-emerald-950/20 to-slate-950/55" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.26),transparent_34%)]" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-emerald-600 shadow-2xl shadow-emerald-950/20 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white sm:h-20 sm:w-20">
                    <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
                    <span className="absolute inset-0 rounded-full border border-white/70" />

                    <Play
                      size={25}
                      fill="currentColor"
                      className="relative ml-1 sm:size-9"
                    />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-3 grid w-full grid-cols-3 gap-1.5 px-1 text-center sm:mt-4 sm:flex sm:max-w-3xl sm:flex-wrap sm:items-center sm:justify-center sm:gap-2 sm:px-0">
        {["Dashboard Flow", "Automation Setup", "Sales Recovery"].map(
          (label) => (
            <span
              key={label}
              className="rounded-full border border-emerald-100 bg-white/80 px-2 py-1 text-[9px] font-bold text-slate-600 shadow-sm backdrop-blur sm:px-3 sm:py-1.5 sm:text-[11px]"
            >
              {label}
            </span>
          )
        )}
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  const { token, user } = useAuth();

  const startHref = authAwareHref({
    token,
    role: user?.role,
    guestHref: "/register",
  });

  const demoHref = authAwareHref({
    token,
    role: user?.role,
    guestHref: "/login",
  });

  return (
    <section className="relative isolate overflow-hidden bg-[#fbfdfb] pt-24 sm:pt-24 lg:pt-[7.25rem]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-140px] h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-emerald-100/95 blur-[105px] sm:h-[560px] sm:w-[560px] sm:blur-[130px]" />
        <div className="absolute right-[-210px] top-28 h-[360px] w-[360px] rounded-full bg-teal-100/80 blur-[110px] sm:right-[-180px] sm:top-36 sm:h-[440px] sm:w-[440px] sm:blur-[130px]" />
        <div className="absolute left-[-210px] top-72 h-[360px] w-[360px] rounded-full bg-lime-100/70 blur-[110px] sm:left-[-190px] sm:h-[430px] sm:w-[430px] sm:blur-[130px]" />

        <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(15,23,42,0.12)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_90%_70%_at_50%_24%,#000_15%,transparent_100%)] sm:opacity-[0.2] sm:[background-size:28px_28px]" />

        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white to-transparent sm:h-36" />
      </div>

      {/* IMPORTANT: mobile px is very small, desktop remains same */}
      <div className="mx-auto max-w-7xl px-1 sm:px-1 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-6xl flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="relative max-w-full">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-300 via-green-300 to-teal-300 opacity-40 blur-md" />

            <div className="relative inline-flex max-w-[98vw] items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/95 px-2.5 py-1.5 text-[8.5px] font-black uppercase tracking-[0.12em] text-emerald-800 shadow-sm backdrop-blur-xl min-[380px]:text-[9px] sm:gap-2 sm:px-4 sm:py-2 sm:text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white sm:h-6 sm:w-6">
                <Sparkles
                  size={11}
                  fill="currentColor"
                  className="sm:size-[13px]"
                />
              </span>

              <span className="truncate">Built for WhatsApp Business API</span>

              <BadgeCheck
                size={13}
                className="shrink-0 fill-[#1d9bf0] text-white sm:size-[15px]"
              />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            className="mt-5 w-full max-w-none text-balance text-[3rem] font-black leading-[0.92] tracking-[-0.075em] text-slate-950 min-[380px]:text-[3.25rem] sm:mt-6 sm:max-w-[1040px] sm:text-6xl sm:leading-[1.02] sm:tracking-[-0.055em] lg:text-[5rem] xl:text-[5.6rem]"
          >
            Automate WhatsApp.
            <span className="block bg-gradient-to-r from-[#16a34a] via-[#22c55e] to-[#059669] bg-clip-text text-transparent">
              Grow Real Revenue.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="mt-4 w-full max-w-none px-3 text-balance text-[13px] font-semibold leading-6 text-slate-600 sm:mt-5 sm:max-w-3xl sm:px-1 sm:text-lg sm:font-medium sm:leading-8"
          >
            Send bulk campaigns, build drag & drop automation flows, reply with
            smart bots, recover leads, and manage every customer chat from one
            clean WhatsApp dashboard.
          </motion.p>

          {/* Pills */}
          <motion.div
            variants={staggerContainer}
            className="mt-6 grid w-full grid-cols-2 gap-2 px-2 sm:mt-7 sm:flex sm:max-w-4xl sm:flex-wrap sm:items-center sm:justify-center sm:gap-2.5 sm:px-0"
          >
            <MiniPill icon={Send}>Bulk campaigns</MiniPill>
            <MiniPill icon={MousePointerClick}>Click-to-WhatsApp ads</MiniPill>
            <MiniPill icon={Bot}>Smart chatbot</MiniPill>
            <MiniPill icon={RotateCcw}>Lead recovery</MiniPill>

            <div className="col-span-2 flex justify-center sm:col-span-1">
              <MiniPill icon={Users}>Team inbox</MiniPill>
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            variants={fadeUp}
            className="mt-7 flex w-full flex-col items-center justify-center gap-2.5 px-2 sm:mt-8 sm:max-w-none sm:flex-row sm:gap-3 sm:px-0"
          >
            <motion.a
              href={startHref}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white shadow-xl shadow-emerald-200 transition-all duration-300 hover:bg-slate-950 hover:shadow-slate-300 sm:h-14 sm:w-auto sm:px-7"
            >
              Start Free Trial
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </motion.a>

            <motion.a
              href={demoHref}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white/90 px-6 text-sm font-black text-slate-950 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50 sm:h-14 sm:w-auto sm:gap-3 sm:px-7"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white transition-colors group-hover:bg-emerald-600">
                <Play size={12} fill="currentColor" />
              </span>
              Book Live Demo
            </motion.a>
          </motion.div>

          {/* Trust Line */}
          <motion.div
            variants={fadeUp}
            className="mt-4 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1.5 px-2 text-[11px] font-bold text-slate-500 sm:mt-5 sm:max-w-none sm:gap-3 sm:px-0 sm:text-sm"
          >
            <span className="inline-flex items-center gap-1">
              <ShieldCheck
                size={13}
                className="text-emerald-600 sm:size-[15px]"
              />
              Official API
            </span>

            <span className="h-1 w-1 rounded-full bg-slate-300" />

            <span className="inline-flex items-center gap-1">
              <Zap size={13} className="text-emerald-600 sm:size-[15px]" />
              Fast setup
            </span>

            <span className="h-1 w-1 rounded-full bg-slate-300" />

            <span className="inline-flex items-center gap-1">
              <BadgeCheck
                size={13}
                className="text-emerald-600 sm:size-[15px]"
              />
              No-code
            </span>
          </motion.div>
        </motion.div>

        <HeroYoutubeVideo />
      </div>

      <div className="mt-10 h-10 bg-gradient-to-b from-transparent to-white sm:mt-14 sm:h-12" />
    </section>
  );
}
