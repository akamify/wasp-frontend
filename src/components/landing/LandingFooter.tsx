"use client";

import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { BRAND_LEGAL_NAME, BRAND_NAME } from "@shared/config/brand";
import { setCurrencySymbolOverride } from "@shared/config/currency";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FOOTER_DESCRIPTION =
  import.meta.env.VITE_FOOTER_DESCRIPTION ||
  "The WhatsApp marketing platform built for modern businesses. Send smarter. Convert faster.";

const fallbackSocialLinks = {
  twitter: import.meta.env.VITE_FOOTER_SOCIAL_TWITTER || "",
  linkedin: import.meta.env.VITE_FOOTER_SOCIAL_LINKEDIN || "",
  facebook: import.meta.env.VITE_FOOTER_SOCIAL_FACEBOOK || "",
  youtube: import.meta.env.VITE_FOOTER_SOCIAL_YOUTUBE || "",
};

const footerLinks: Record<
  string,
  { label: string; to: string; external?: boolean }[]
> = {
  Company: [
    { label: "About", to: "/about" },
    { label: "Features", to: "/features" },
    { label: "Pricing", to: "/pricing" },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms of Service", to: "/terms-of-service" },
    { label: "Cookie Policy", to: "/cookie-policy" },
    { label: "Data Deletion", to: "/data-deletion" },
  ],
  Resources: [
    { label: "Help Center", to: "/help-center" },
    { label: "Careers", to: "/careers" },
  ],
};

function buildSocials(links: typeof fallbackSocialLinks) {
  return [
    {
      name: "Twitter",
      href: links.twitter,
      icon: (
        <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: links.linkedin,
      icon: (
        <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: links.facebook,
      icon: (
        <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.675 0h-21.35C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.326 24h11.495v-9.294H9.692v-3.622h3.129V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12V24h6.113C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.675 0z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: links.youtube,
      icon: (
        <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.016 3.016 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.121 2.136c1.872.505 9.377.505 9.377.505s7.505 0 9.376-.505a3.016 3.016 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];
}

function FooterLink({
  link,
}: {
  link: { label: string; to: string; external?: boolean };
}) {
  const className =
    "group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:text-emerald-700";

  if (link.external) {
    return (
      <a
        href={link.to}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {link.label}

        <ArrowRight
          size={13}
          className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      </a>
    );
  }

  return (
    <Link to={link.to} className={className}>
      {link.label}

      <ArrowRight
        size={13}
        className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
      />
    </Link>
  );
}

export function LandingFooter() {
  const [socialLinks, setSocialLinks] = useState(fallbackSocialLinks);

  const socials = useMemo(
    () => buildSocials(socialLinks),
    [socialLinks]
  );

  useEffect(() => {
    let active = true;

    API.public
      .platformBrandGet()
      .then((res: any) => {
        if (!active) return;

        const next = res?.settings?.socialLinks || {};

        setCurrencySymbolOverride(res?.settings?.currencySymbol);

        setSocialLinks({
          twitter: String(
            next.twitter || fallbackSocialLinks.twitter || ""
          ),
          linkedin: String(
            next.linkedin || fallbackSocialLinks.linkedin || ""
          ),
          facebook: String(
            next.facebook || fallbackSocialLinks.facebook || ""
          ),
          youtube: String(
            next.youtube || fallbackSocialLinks.youtube || ""
          ),
        });
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-[#fbfdfb] px-4 pb-6 pt-14 sm:px-6 lg:px-8 lg:pt-16">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-emerald-100/80 blur-[120px]" />

        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-lime-100/80 blur-[120px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#16a34a_1px,transparent_0)] bg-[size:34px_34px] opacity-[0.045]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Top CTA Strip */}
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 shadow-2xl shadow-emerald-100/70 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                <Sparkles size={12} />
                WhatsApp Growth Platform
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                Start converting chats into customers.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                Bulk campaigns, chatbot, drag & drop automation, team inbox,
                and analytics in one clean dashboard.
              </p>
            </div>

            <Link
              to="/register"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-black text-white shadow-xl shadow-emerald-950/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
            >
              Get Started

              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        {/* Main Footer */}
        <div className="grid gap-10 rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl sm:p-7 lg:grid-cols-[1.25fr_1fr_1fr_1fr] lg:p-8">
          {/* Brand */}
          <div className="lg:pr-8">
            <a href="/" className="group flex w-fit items-center gap-3">
              <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-1 shadow-[0_12px_35px_rgba(16,185,129,0.18)] transition-all duration-300 group-hover:scale-[1.03]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(52,211,153,0.35),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.28),transparent_35%)]" />

                <img
                  src="/logo.png"
                  alt={BRAND_NAME}
                  className="relative z-10 h-full w-full rounded-[1.05rem] object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div>
                <span className="block text-lg font-black tracking-tight text-slate-950">
                  {BRAND_NAME}
                </span>

                <span className="text-xs font-bold text-emerald-700">
                  WhatsApp Marketing Platform
                </span>
              </div>
            </a>

            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">
              {FOOTER_DESCRIPTION}
            </p>

            {/* Social Links */}
            <div className="mt-5 flex items-center gap-2">
              {socials
                .filter(
                  (social) =>
                    !!social.href && social.href !== "#"
                )
                .map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-lg hover:shadow-emerald-100"
                  >
                    {social.icon}
                  </a>
                ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-950">
                {section}
              </p>

              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Row */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              <ShieldCheck size={17} className="text-emerald-600" />
              Official API Ready
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Built for scalable WhatsApp business messaging.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              <BadgeCheck size={17} className="text-emerald-600" />
              Verified Workflows
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Campaigns, chatbot, automation, and forms.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              <Mail size={17} className="text-emerald-600" />
              Support Friendly
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Get help for setup, campaigns, and automation.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-center md:flex-row md:text-left">
          <p className="text-xs font-semibold text-slate-500">
            © {new Date().getFullYear()} {BRAND_LEGAL_NAME}. All rights
            reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-500">
            <span>
              Developed with <b className="text-slate-950">Akamify</b>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}