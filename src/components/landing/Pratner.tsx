"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  Handshake,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";

const partners = [
  "Digital Adbird",
  "Maxify Global",
  "Think Sync",
  "Mahabali Education",
  "Hindustan Hotel",
  "GoLive",
  "ThinkSync Vendor",
  "Apex Logistics",
  "Cloud Nine",
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function Partner() {
  return (
    <section className="relative overflow-hidden bg-[#fafafa] px-4 py-14 sm:px-0 sm:py-16">
      {/* Soft Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-emerald-100/80 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-[260px] w-[260px] rounded-full bg-lime-100/80 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#16a34a_1px,transparent_0)] bg-[size:34px_34px] opacity-[0.05]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="relative mx-auto max-w-7xl"
      >
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <motion.div
              variants={item}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-sm"
            >
              <Handshake size={13} />
              Trusted by Industry Leaders
            </motion.div>

            <motion.h2
              variants={item}
              className="text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl"
            >
              A network built for
              <span className="block bg-gradient-to-r from-emerald-600 via-green-500 to-lime-500 bg-clip-text text-transparent">
                scale & growth.
              </span>
            </motion.h2>
          </div>

          <motion.div
            variants={item}
            className="max-w-md rounded-3xl border border-white/80 bg-white/70 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-sm font-black text-slate-950">
                  Partner ecosystem
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Agencies, educators, hotels, vendors, and service brands
                  growing with automation.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Slider Wrapper */}
        <motion.div variants={item} className="relative">
          {/* Left/Right Fade */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#fafafa] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#fafafa] to-transparent" />

          <Swiper
            modules={[Autoplay, FreeMode]}
            spaceBetween={18}
            slidesPerView={1.25}
            loop
            freeMode
            speed={4200}
            autoplay={{
              delay: 0,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              480: { slidesPerView: 1.8 },
              640: { slidesPerView: 2.6 },
              768: { slidesPerView: 3.2 },
              1024: { slidesPerView: 4.3 },
              1280: { slidesPerView: 5.2 },
            }}
            className="!overflow-visible px-4"
          >
            {partners.map((partner, index) => (
              <SwiperSlide key={`${partner}-${index}`}>
                <div className="group relative min-h-[92px] cursor-grab overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/70 active:cursor-grabbing">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-50 transition-all duration-300 group-hover:scale-125 group-hover:bg-emerald-100" />

                  <div className="relative flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-200 transition-all duration-300 group-hover:rotate-3 group-hover:bg-emerald-600 group-hover:shadow-emerald-200">
                      <Building2 size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black tracking-tight text-slate-950">
                        {partner}
                      </h3>

                      <p className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                        <BadgeCheck size={11} />
                        Verified Partner
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold text-slate-400">
                      WhatsApp Growth Partner
                    </span>

                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white">
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </motion.div>
    </section>
  );
}