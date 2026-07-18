"use client";

import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { BRAND_LEGAL_NAME, BRAND_NAME } from "@shared/config/brand";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FOOTER_DESCRIPTION =
  import.meta.env.VITE_FOOTER_DESCRIPTION ||
  "The WhatsApp marketing platform built for modern businesses. Send smarter. Convert faster.";

const fallbackSocialLinks = {
  twitter: import.meta.env.VITE_FOOTER_SOCIAL_TWITTER || "",
  linkedin: import.meta.env.VITE_FOOTER_SOCIAL_LINKEDIN || "",
  whatsapp: import.meta.env.VITE_FOOTER_SOCIAL_WHATSAPP || "",
  facebook: import.meta.env.VITE_FOOTER_SOCIAL_FACEBOOK || "",
  instagram: import.meta.env.VITE_FOOTER_SOCIAL_INSTAGRAM || "",
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
    name: "Instagram",
    href: links.instagram,
    icon: (
      <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.848s-.011 3.584-.069 4.849c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.646.07-4.85.07s-3.584-.012-4.849-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.645-.07-4.848s.012-3.584.07-4.849C2.381 3.928 3.897 2.38 7.151 2.232 8.416 2.175 8.796 2.163 12 2.163M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.074-1.688.074-4.947s-.015-3.667-.074-4.947c-.197-4.354-2.617-6.78-6.979-6.98C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
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
  {
    name: "WhatsApp",
    href: links.whatsapp,
    icon: (
      <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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
  const socials = useMemo(() => buildSocials(socialLinks), [socialLinks]);

  useEffect(() => {
    let active = true;
    API.public
      .platformBrandGet()
      .then((res: any) => {
        if (!active) return;
        const next = res?.settings?.socialLinks || {};
        setSocialLinks({
          twitter: String(next.twitter || fallbackSocialLinks.twitter || ""),
          linkedin: String(next.linkedin || fallbackSocialLinks.linkedin || ""),
          whatsapp: String(next.whatsapp || fallbackSocialLinks.whatsapp || ""),
          facebook: String(next.facebook || fallbackSocialLinks.facebook || ""),
          instagram: String(next.instagram || fallbackSocialLinks.instagram || ""),
          youtube: String(next.youtube || fallbackSocialLinks.youtube || ""),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-[#fbfdfb] px-4 pt-14 pb-6 sm:px-6 lg:px-8 lg:pt-16">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-emerald-100/80 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-lime-100/80 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#16a34a_1px,transparent_0)] bg-[size:34px_34px] opacity-[0.045]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Top CTA strip */}
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

            {/* Meta Business Partner */}
            {/* <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100">
              <img
                src="/mbp.avif"
                alt="Meta Business Partner"
                className="h-10 w-auto object-contain"
              />
              <div className="hidden border-l border-slate-200 pl-3 sm:block">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Official
                </p>
                <p className="text-xs font-black text-slate-950">
                  Meta Business Partner
                </p>
              </div>
            </div> */}

            <div className="mt-5 flex items-center gap-2">
              {socials
                .filter((social) => !!social.href && social.href !== "#")
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

        {/* Trust row */}
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
          

            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

            <span>
              Parent <b className="text-slate-950">Akamify</b>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
