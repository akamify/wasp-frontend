"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  Menu,
  Sparkles,
  X,
} from "lucide-react";

import { BRAND_NAME } from "@shared/config/brand";
import { useAuth } from "@shared/providers/AuthContext";
import { authenticatedHome } from "@shared/utils/authNavigation";

const navLinks = [
  {
    label: "Features",
    href: "/features",
    description: "Automation, AI workflows, analytics",
  },
  {
    label: "How it Works",
    href: "#how-it-works",
    description: "Setup your workspace in minutes",
  },
  {
    label: "Dashboard Preview",
    href: "#dashboard",
    description: "See the platform experience",
  },
  {
    label: "Pricing",
    href: "/pricing",
    description: "Simple plans for every team",
  },
  {
    label: "Docs",
    href: "https://docs.aiwizchat.com",
    description: "Simple plans for every team",
  },
];

const topVariants = {
  closed: { rotate: 0, y: 0 },
  open: { rotate: 45, y: 6 },
};

const middleVariants = {
  closed: { opacity: 1 },
  open: { opacity: 0 },
};

const bottomVariants = {
  closed: { rotate: 0, y: 0 },
  open: { rotate: -45, y: -6 },
};

export function LandingNavbar() {
  const { token, user } = useAuth();
  const authenticatedHref = authenticatedHome(user?.role, token);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      if (!navRef.current) return;

      if (event.target instanceof Node && !navRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <motion.header
      ref={navRef}
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-4"
    >
      <nav
        className={[
          "mx-auto flex h-[72px] max-w-8xl items-center justify-between rounded-2xl px-2 transition-all duration-300 sm:px-2 lg:px-3",
          scrolled
            ? "border border-slate-200/80 bg-white/82 shadow-[0_24px_90px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
            : "border border-white/60 bg-white/58 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl",
        ].join(" ")}
      >
        {/* Brand */}
        <a
          href="/"
          onClick={closeMenu}
          className="group flex min-w-0 items-center gap-3"
          aria-label={`${BRAND_NAME} home`}
        >
          <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-1 shadow-[0_12px_35px_rgba(16,185,129,0.18)] transition-all duration-300 group-hover:scale-[1.03]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(52,211,153,0.35),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.28),transparent_35%)]" />
            <img
              src="/logo.png"
              alt={BRAND_NAME}
              className="relative z-10 h-full w-full rounded-[1.05rem] object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[17px] font-black tracking-[-0.03em] text-slate-950">
              {BRAND_NAME}
            </span>

            <span className="mt-1 hidden items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:flex">
              <Sparkles className="h-3 w-3" />
              AI Workspace
            </span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 rounded-2xl border border-slate-200/70 bg-slate-950/[0.025] p-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-white hover:text-slate-950 hover:shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
            >
              <span className="relative z-10">{link.label}</span>

              <span className="pointer-events-none absolute inset-x-4 -bottom-px h-px scale-x-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {token ? (
            <motion.a
              href={authenticatedHref}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 24 }}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_16px_42px_rgba(16,185,129,0.34)] transition-all duration-300 hover:shadow-[0_22px_55px_rgba(16,185,129,0.44)]"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </motion.a>
          ) : (
            <>
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </a>

              <motion.a
                href="/register"
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 360, damping: 24 }}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_16px_42px_rgba(16,185,129,0.34)] transition-all duration-300 hover:shadow-[0_22px_55px_rgba(16,185,129,0.44)]"
              >
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </motion.a>
            </>
          )}
        </div>

        {/* Mobile Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.10)] transition-all duration-200 hover:bg-slate-50 md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>

          <span className="flex h-5 w-5 flex-col items-center justify-center gap-1.5">
            <motion.span
              variants={topVariants}
              animate={menuOpen ? "open" : "closed"}
              className="block h-0.5 w-5 rounded-full bg-slate-900"
            />
            <motion.span
              variants={middleVariants}
              animate={menuOpen ? "open" : "closed"}
              className="block h-0.5 w-5 rounded-full bg-slate-900"
            />
            <motion.span
              variants={bottomVariants}
              animate={menuOpen ? "open" : "closed"}
              className="block h-0.5 w-5 rounded-full bg-slate-900"
            />
          </span>
        </button>
      </nav>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 -z-10 bg-slate-950/20 backdrop-blur-sm md:hidden"
              onClick={closeMenu}
            />

            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mx-auto mt-3 max-w-7xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/94 shadow-[0_26px_90px_rgba(15,23,42,0.22)] backdrop-blur-2xl md:hidden"
            >
              <div className="p-3">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Bot className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-950">
                        AI-powered workspace platform
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-600">
                        Manage, automate and grow faster.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {navLinks.map((link, index) => (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      onClick={closeMenu}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="group flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-200 hover:bg-slate-50"
                    >
                      <span>
                        <span className="block text-sm font-black text-slate-900">
                          {link.label}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-slate-500">
                          {link.description}
                        </span>
                      </span>

                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-emerald-600" />
                    </motion.a>
                  ))}
                </div>

                <div className="mt-3 border-t border-slate-200 pt-3">
                  {token ? (
                    <a
                      href={authenticatedHref}
                      onClick={closeMenu}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-cyan-500 px-5 py-3.5 text-sm font-black text-white shadow-[0_16px_42px_rgba(16,185,129,0.32)]"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href="/login"
                        onClick={closeMenu}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
                      >
                        <LogIn className="h-4 w-4" />
                        Sign in
                      </a>

                      <a
                        href="/register"
                        onClick={closeMenu}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-cyan-500 px-4 py-3.5 text-sm font-black text-white shadow-[0_16px_42px_rgba(16,185,129,0.32)]"
                      >
                        Start Free
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
