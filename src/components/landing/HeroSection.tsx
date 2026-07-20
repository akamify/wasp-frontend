"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import type { Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Check,
  MessageCircle,
  MousePointerClick,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { useAuth } from "@shared/providers/AuthContext";
import { authAwareHref } from "@shared/utils/authNavigation";

const YOUTUBE_VIDEO_ID = "Cpvd4yOePWM";

const YOUTUBE_THUMBNAIL_SRC =
  `https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`;

const getYoutubeEmbedSrc = () =>
  `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}` +
  "?rel=0&controls=1&playsinline=1&fs=0&autoplay=1";

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(6px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

type BenefitCardProps = {
  icon: ElementType;
  title: string;
  description: string;
};

function BenefitCard({
  icon: Icon,
  title,
  description,
}: BenefitCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="
        group flex min-w-0 items-center gap-3
        rounded-2xl border border-slate-200/80
        bg-white/85 p-3 text-left
        shadow-[0_8px_30px_rgba(15,23,42,0.05)]
        backdrop-blur-xl
        transition-all duration-300
        hover:-translate-y-1
        hover:border-emerald-200
        hover:shadow-[0_14px_40px_rgba(16,185,129,0.12)]
        sm:items-start sm:p-4
      "
    >
      <div
        className="
          flex h-10 w-10 shrink-0 items-center justify-center
          rounded-xl bg-emerald-50 text-emerald-600
          transition-colors duration-300
          group-hover:bg-emerald-600 group-hover:text-white
          sm:h-11 sm:w-11
        "
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-[13px] font-black text-slate-950 sm:text-sm">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-500 sm:mt-1 sm:text-xs sm:leading-5">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

function TrustItem({
  icon: Icon,
  children,
}: {
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Icon size={14} className="shrink-0 text-emerald-600" />
      {children}
    </span>
  );
}

function FloatingStat({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        flex items-center gap-3 rounded-2xl
        border border-white/90 bg-white/90 p-3
        shadow-[0_18px_50px_rgba(15,23,42,0.12)]
        backdrop-blur-xl
      "
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
        <Icon size={17} />
      </div>

      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
          {label}
        </p>

        <p className="text-sm font-black text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );
}

function HeroYoutubeVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <motion.div
      id="hero-demo-video"
      initial={{
        opacity: 0,
        y: 32,
        scale: 0.985,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        delay: 0.35,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        relative mx-auto mt-8
        w-full max-w-[1080px]
        sm:mt-12
        lg:mt-14
      "
    >
      <div
        className="
          pointer-events-none absolute
          inset-x-[10%] top-8 -z-10
          h-40 rounded-full
          bg-emerald-200/60 blur-[75px]
          sm:h-64 sm:blur-[110px]
        "
      />

      <div className="absolute -left-12 top-16 z-20 hidden xl:block">
        <FloatingStat
          icon={MessageCircle}
          label="Response speed"
          value="2.4x Faster"
        />
      </div>

      <div className="absolute -right-12 bottom-20 z-20 hidden xl:block">
        <FloatingStat
          icon={BarChart3}
          label="Campaign reach"
          value="98.4%"
        />
      </div>

      <div
        className="
          relative rounded-[22px]
          border border-white/90
          bg-white/80 p-1.5
          shadow-[0_24px_70px_rgba(15,23,42,0.14)]
          backdrop-blur-xl
          sm:rounded-[32px] sm:p-3
        "
      >
        <div className="overflow-hidden rounded-[17px] bg-slate-950 sm:rounded-[23px]">
          <div
            className="
              flex items-center justify-between
              border-b border-white/10
              bg-slate-950 px-3 py-2.5
              sm:px-5 sm:py-3.5
            "
          >
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 sm:h-2.5 sm:w-2.5" />
              <span className="h-2 w-2 rounded-full bg-amber-400 sm:h-2.5 sm:w-2.5" />
              <span className="h-2 w-2 rounded-full bg-emerald-400 sm:h-2.5 sm:w-2.5" />
            </div>

            <span
              className="
                hidden rounded-full border border-white/10
                bg-white/5 px-3 py-1
                text-[10px] font-bold text-white/70
                sm:inline-flex
              "
            >
              WhatsApp Automation Demo
            </span>

            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-300 sm:text-[10px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Product Preview
            </div>
          </div>

          <div className="relative aspect-video overflow-hidden bg-slate-950">
            {isPlaying ? (
              <iframe
                title="WhatsApp automation platform product demo"
                src={getYoutubeEmbedSrc()}
                className="absolute inset-0 h-full w-full"
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="
                  accelerometer;
                  autoplay;
                  clipboard-write;
                  encrypted-media;
                  gyroscope;
                  picture-in-picture;
                  web-share
                "
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                aria-label="Play WhatsApp automation product demo"
                className="
                  group absolute inset-0
                  block h-full w-full
                  overflow-hidden text-left
                "
              >
                <img
                  src={YOUTUBE_THUMBNAIL_SRC}
                  alt="WhatsApp automation dashboard product demo"
                  className="
                    h-full w-full select-none object-cover
                    transition-transform duration-700
                    group-hover:scale-[1.035]
                  "
                  alt="Akamify WhatsApp automation demo video thumbnail"
                  width={1280}
                  height={720}
                  className="h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  draggable={false}
                  fetchPriority="high"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.src =
                      `https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`;
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-emerald-950/15 to-slate-950/65" />

                <div
                  className="
                    absolute inset-0
                    bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_35%)]
                  "
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="
                      relative flex h-14 w-14 items-center justify-center
                      rounded-full bg-white text-emerald-600
                      shadow-[0_18px_50px_rgba(0,0,0,0.25)]
                      transition-all duration-300
                      group-hover:scale-110
                      group-hover:bg-emerald-600
                      group-hover:text-white
                      sm:h-20 sm:w-20
                    "
                  >
                    <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />

                    <Play
                      size={24}
                      fill="currentColor"
                      className="relative ml-1 sm:size-9"
                    />
                  </div>

                  <span
                    className="
                      mt-3 rounded-full border border-white/20
                      bg-slate-950/45 px-3 py-1.5
                      text-[10px] font-black text-white
                      backdrop-blur-md
                      sm:mt-4 sm:px-4 sm:py-2 sm:text-xs
                    "
                  >
                    Watch how it works
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className="
          mx-auto mt-3 grid grid-cols-3 gap-1.5
          px-1 sm:mt-4 sm:flex
          sm:items-center sm:justify-center sm:gap-2
        "
      >
        {[
          "Send Campaigns",
          "Build Automation",
          "Manage Chats",
        ].map((label) => (
          <span
            key={label}
            className="
              rounded-full border border-emerald-100
              bg-white/85 px-1.5 py-1.5
              text-center text-[8.5px] font-bold
              text-slate-600 shadow-sm backdrop-blur
              sm:px-4 sm:py-2 sm:text-[11px]
            "
          >
            {label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function HeroSection({ onBookDemo }: { onBookDemo?: () => void }) {
  const { token, user } = useAuth();

  const startHref = authAwareHref({
    token,
    role: user?.role,
    guestHref: "/register",
  });

  return (
    <section
      className="
        relative isolate overflow-hidden
        bg-[#fbfdfb]
        pb-8 pt-[88px]
        sm:pb-12 sm:pt-28
        lg:pt-[7.5rem]
      "
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="
            absolute left-1/2 top-[-170px]
            h-[420px] w-[420px]
            -translate-x-1/2 rounded-full
            bg-emerald-100/95 blur-[100px]
            sm:h-[600px] sm:w-[600px] sm:blur-[135px]
          "
        />

        <div
          className="
            absolute right-[-220px] top-40
            h-[360px] w-[360px]
            rounded-full bg-teal-100/70 blur-[110px]
            sm:h-[480px] sm:w-[480px]
          "
        />

        <div
          className="
            absolute left-[-230px] top-80
            h-[360px] w-[360px]
            rounded-full bg-lime-100/60 blur-[110px]
            sm:h-[450px] sm:w-[450px]
          "
        />

        <div
          className="
            absolute inset-0 opacity-[0.13]
            [background-image:radial-gradient(rgba(15,23,42,0.14)_1px,transparent_1px)]
            [background-size:24px_24px]
            [mask-image:radial-gradient(ellipse_90%_65%_at_50%_18%,#000_12%,transparent_100%)]
            sm:opacity-[0.18]
            sm:[background-size:28px_28px]
          "
        />

        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent sm:h-36" />
      </div>

      {/*
        Mobile:
        px-3 gives safe spacing without creating large empty space.

        Desktop:
        Standard container spacing remains intact.
      */}
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-6xl flex-col items-center text-center"
        >
          {/* Top badge */}
          <motion.div variants={fadeUp} className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-300 via-green-300 to-teal-300 opacity-35 blur-md" />

            <div
              className="
                relative inline-flex items-center gap-1.5
                rounded-full border border-emerald-200/90
                bg-white/95 px-2.5 py-1.5
                text-[8px] font-black uppercase
                tracking-[0.1em] text-emerald-800
                shadow-sm backdrop-blur-xl
                min-[370px]:text-[9px]
                sm:gap-2 sm:px-4 sm:py-2 sm:text-xs
              "
            >
              <span
                className="
                  flex h-5 w-5 shrink-0 items-center justify-center
                  rounded-full bg-emerald-600 text-white
                  sm:h-6 sm:w-6
                "
              >
                <Sparkles
                  size={11}
                  fill="currentColor"
                  className="sm:size-[13px]"
                />
              </span>

              <span>Built for WhatsApp Business API</span>

              <BadgeCheck
                size={13}
                className="shrink-0 fill-[#1d9bf0] text-white sm:size-[15px]"
              />
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={fadeUp}
            className="
              mt-5 w-full
              max-w-[390px]
              text-[clamp(2.75rem,13.6vw,3.7rem)]
              font-black
              leading-[0.91]
              tracking-[-0.067em]
              text-slate-950
              sm:mt-7 sm:max-w-[950px]
              sm:text-6xl sm:leading-[0.98]
              sm:tracking-[-0.055em]
              lg:text-[5rem]
              xl:text-[5.65rem]
            "
          >
            <span className="block sm:inline">
              Automate WhatsApp.
            </span>

            <span
              className="
                block bg-gradient-to-r
                from-[#16a34a] via-[#22c55e] to-[#059669]
                bg-clip-text text-transparent
              "
            >
              Grow Real Revenue.
            </span>
          </motion.h1>

          {/* Simple beginner-friendly description */}
          <motion.p
            variants={fadeUp}
            className="
              mt-4 max-w-[350px]
              text-[13px] font-medium
              leading-[1.65] text-slate-600
              sm:mt-6 sm:max-w-3xl
              sm:text-lg sm:leading-8
            "
          >
            Send WhatsApp campaigns, automate customer replies and manage every
            conversation from one simple dashboard—without complex coding.
          </motion.p>

          {/* Beginner value sentence */}
          <motion.div
            variants={fadeUp}
            className="
              mt-3 inline-flex items-center gap-2
              rounded-full border border-emerald-100
              bg-emerald-50/80 px-3 py-2
              text-[10px] font-bold text-emerald-800
              sm:mt-4 sm:px-4 sm:text-xs
            "
          >
            <Check
              size={14}
              strokeWidth={3}
              className="shrink-0 text-emerald-600"
            />

            Perfect for marketing, support and lead follow-up
          </motion.div>

          {/* Benefits */}
          <motion.div
            variants={staggerContainer}
            className="
              mt-6 grid w-full max-w-[390px]
              grid-cols-1 gap-2
              sm:mt-8 sm:max-w-4xl
              sm:grid-cols-3 sm:gap-3
            "
          >
            <BenefitCard
              icon={Send}
              title="Send Bulk Campaigns"
              description="Reach customers with approved WhatsApp templates."
            />

            <BenefitCard
              icon={Bot}
              title="Automate Replies"
              description="Build chatbot and follow-up flows without coding."
            />

            <BenefitCard
              icon={Users}
              title="Manage Every Chat"
              description="Handle leads and support from one shared team inbox."
            />
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="
              mt-6 flex w-full max-w-[390px]
              flex-col items-center justify-center gap-2.5
              sm:mt-8 sm:max-w-none
              sm:flex-row sm:gap-3
            "
          >
            <motion.a
              href={startHref}
              whileHover={{
                y: -2,
                scale: 1.015,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="
                group inline-flex h-13 w-full
                items-center justify-center gap-2
                rounded-2xl bg-emerald-600
                px-6 text-sm font-black text-white
                shadow-[0_14px_35px_rgba(16,185,129,0.28)]
                transition-all duration-300
                hover:bg-slate-950
                hover:shadow-[0_16px_40px_rgba(15,23,42,0.22)]
                sm:h-14 sm:w-auto sm:min-w-[190px]
              "
            >
              Start Free Trial

              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </motion.a>

            <motion.a
              href={demoHref}
              whileHover={{
                y: -2,
                scale: 1.015,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="
                group inline-flex h-12 w-full
                items-center justify-center gap-2.5
                rounded-2xl border border-slate-200
                bg-white/90 px-6
                text-sm font-black text-slate-950
                shadow-sm backdrop-blur-xl
                transition-all duration-300
                hover:border-emerald-200
                hover:bg-emerald-50
                sm:h-14 sm:w-auto sm:min-w-[180px]
              "
            <motion.button
              type="button"
              onClick={onBookDemo}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white/90 px-6 text-sm font-black text-slate-950 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50 sm:h-14 sm:w-auto sm:gap-3 sm:px-7"
            >
              <span
                className="
                  flex h-7 w-7 items-center justify-center
                  rounded-full bg-slate-950 text-white
                  transition-colors duration-300
                  group-hover:bg-emerald-600
                "
              >
                <Play size={11} fill="currentColor" />
              </span>

              Book Live Demo
            </motion.button>
          </motion.div>

          {/* Trust information */}
          <motion.div
            variants={fadeUp}
            className="
              mt-4 flex max-w-[370px]
              flex-wrap items-center justify-center
              gap-x-3 gap-y-2
              text-[10px] font-bold text-slate-500
              sm:mt-5 sm:max-w-none sm:text-xs
            "
          >
            <TrustItem icon={ShieldCheck}>
              Official API
            </TrustItem>

            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

            <TrustItem icon={Zap}>
              Quick setup
            </TrustItem>

            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

            <TrustItem icon={MousePointerClick}>
              No-code automation
            </TrustItem>
          </motion.div>
        </motion.div>

        <HeroYoutubeVideo />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" />
    </section>
  );
}