import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCheck,
  ChevronLeft,
  Image,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Smile,
  Video,
} from "lucide-react";
import { useAuth } from "@shared/providers/AuthContext";
import { authAwareHref } from "@shared/utils/authNavigation";

function BusinessChatPreview() {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-[560px] items-center justify-center">
      <div className="absolute left-0 top-[18%] h-36 w-36 rounded-full bg-[#25D366]/20 blur-3xl" />
      <div className="absolute bottom-[12%] right-0 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24, rotate: 1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_35px_90px_-28px_rgba(15,23,42,0.38)]"
      >
        <div className="flex h-9 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <ShieldCheck size={12} className="text-emerald-500" />
            Secure business conversation
          </div>
          <div className="w-11" />
        </div>

        <div className="flex items-center gap-3 border-b border-slate-200 bg-[#f0f2f5] px-3 py-3 sm:px-4">
          <button type="button" aria-label="Back" className="text-slate-500 sm:hidden"><ChevronLeft size={20} /></button>
          <div className="relative shrink-0">
            <ArrowLeft size={20} className="absolute left-0 top-1/2 -translate-y-1/2 text-black" />
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#111827] to-[#374151] ml-8 text-sm font-black text-white ring-2 ring-white">
              AM
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#f0f2f5] bg-[#25D366]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-sm font-black text-slate-900">Akamify Store</div>
              <BadgeCheck size={14} className="shrink-0 fill-[#1d9bf0] text-white" />
            </div>
            <div className="text-[11px] font-medium text-slate-500">Business account · typing...</div>
          </div>
          <div className="flex items-center gap-0.5 text-slate-600">
            <HeaderAction label="Video call"><Video size={17} /></HeaderAction>
            <HeaderAction label="Call"><Phone size={16} /></HeaderAction>
            <HeaderAction label="More options"><MoreVertical size={18} /></HeaderAction>
          </div>
        </div>

        <div className="relative h-[390px] overflow-hidden bg-[#efeae2] sm:h-[430px]">
          <div className="absolute inset-0 opacity-[0.055] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative flex h-full flex-col px-3 py-3 sm:px-5">
            <div className="mx-auto rounded-[7px] bg-white/80 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
              Today
            </div>

            <div className="mt-4 max-w-[78%] self-start rounded-[10px] rounded-tl-[3px] bg-white px-3 py-2.5 shadow-sm">
              <p className="text-[12px] font-medium leading-5 text-slate-800 sm:text-[13px]">
                Hi! I saw the summer collection. Is the blue linen shirt available in size M?
              </p>
              <MessageMeta time="10:24 AM" />
            </div>

            <div className="mt-2 max-w-[82%] self-end rounded-[10px] rounded-tr-[3px] bg-[#d9fdd3] px-3 py-2.5 shadow-sm">
              <p className="text-[12px] font-medium leading-5 text-slate-800 sm:text-[13px]">
                Hi Riya! Yes, it is available. I have shared the product below.
              </p>
              <MessageMeta time="10:24 AM" outbound />
            </div>

            <div className="mt-2 w-[82%] self-end overflow-hidden rounded-[10px] rounded-tr-[3px] bg-[#d9fdd3] shadow-sm">
              <div className="flex items-center gap-3 bg-white/70 p-2.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-sky-100 to-blue-200 text-blue-700">
                  <ShoppingBag size={23} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-black text-slate-900">Premium Linen Shirt</div>
                  <div className="mt-0.5 text-[10px] font-semibold text-slate-500">Sky Blue · Size M</div>
                  <div className="mt-1 text-[12px] font-black text-emerald-700">₹1,499</div>
                </div>
              </div>
              <button type="button" className="flex w-full items-center justify-center border-t border-emerald-900/10 py-2 text-[11px] font-black text-[#008069]">
                View product
              </button>
              <div className="px-2.5 pb-1.5"><MessageMeta time="10:25 AM" outbound /></div>
            </div>

            <div className="mt-2 max-w-[72%] self-start rounded-[10px] rounded-tl-[3px] bg-white px-3 py-2.5 shadow-sm">
              <p className="text-[12px] font-medium leading-5 text-slate-800 sm:text-[13px]">Perfect. Can you deliver it by Friday?</p>
              <MessageMeta time="10:26 AM" />
            </div>

            <div className="mt-2 flex items-center gap-1.5 self-start rounded-full bg-white/75 px-2 py-2 shadow-sm">
              <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400" />
              {/* <span className="ml-1 text-[9px] font-bold text-slate-400">Akamify Store is typing</span> */}
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 border-t border-slate-200 bg-[#f0f2f5] px-3 py-3">
          <div className="flex min-h-11 flex-1 items-center gap-2 rounded-[22px] bg-white px-3 shadow-sm">
            <Smile size={19} className="shrink-0 text-slate-500" />
            <div className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-400 sm:text-[13px]">Type a message</div>
            <button type="button" aria-label="Attach file" className="text-slate-500"><Paperclip size={18} /></button>
            <button type="button" aria-label="Add image" className="hidden text-slate-500 sm:block"><Image size={18} /></button>
          </div>
          <button type="button" aria-label="Voice message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-md shadow-emerald-700/20">
            <Mic size={18} />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.65, duration: 0.45 }}
        className="absolute -right-5 bottom-20 hidden items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 shadow-xl sm:flex"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Send size={14} /></div>
        <div><div className="text-[10px] font-black text-slate-900">Reply sent</div><div className="text-[9px] font-semibold text-slate-400">in 8 seconds</div></div>
      </motion.div>
    </div>
  );
}

function HeaderAction({ children, label }: { children: React.ReactNode; label: string }) {
  return <button type="button" aria-label={label} className="rounded-full p-2 transition-colors hover:bg-slate-200">{children}</button>;
}

function MessageMeta({ outbound, time }: { outbound?: boolean; time: string }) {
  return (
    <div className="mt-1 flex items-center justify-end gap-1 text-[8px] font-semibold text-slate-500">
      <span>{time}</span>
      {outbound ? <CheckCheck size={13} className="text-[#53bdeb]" /> : null}
    </div>
  );
}

function Stat({ val, label }: { val: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-extrabold text-ink-900">{val}</span>
      <span className="text-xs font-medium text-ink-900/55">{label}</span>
    </div>
  );
}

export function HeroSection() {
  const { token, user } = useAuth();
  const startHref = authAwareHref({ token, role: user?.role, guestHref: "/register" });

  return (
    <section className="relative overflow-hidden pt-15 lg:pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(37,211,102,0.16),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(6,182,212,0.12),transparent_48%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl bg-white/60 px-6 backdrop-blur lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              <span className="block">Send Smarter.</span>
              <span className="block bg-gradient-to-r from-[#25D366] via-[#11d593] to-[#06b6d4] bg-clip-text text-transparent">
                Convert Faster.
              </span>
              <span className="block text-ink-900/70">Scale Bigger.</span>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-900/70">
              The all-in-one WhatsApp Business API platform. Automate campaigns, manage contacts, and turn every customer conversation into real revenue.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <a href={startHref} className="group relative flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#06b77e] px-8 py-4 text-base font-bold text-white shadow-2xl shadow-[#25D366]/30 transition-all duration-300 hover:scale-105 hover:shadow-[#25D366]/50">
                Start Free Trial
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>

            <div className="mt-10 flex items-center gap-8">
              <Stat val="50K+" label="Active Users" />
              <Stat val="2B+" label="Messages Sent" />
              <Stat val="99.9%" label="Uptime SLA" />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
            className="relative h-[570px] sm:h-[640px] lg:h-[680px]"
          >
            <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_50%_50%,rgba(37,211,102,0.09),transparent_70%)]" />
            <div className="relative h-full py-5 lg:py-8">
              <BusinessChatPreview />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
