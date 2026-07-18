import { Cookie, ExternalLink, FileText, Lock, ShieldCheck } from "lucide-react";
import { PublicShell } from "@pages/public/PublicShell";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";

const effectiveDate = "July 4, 2026";

const officialLinks = [
  {
    label: "WATI Privacy Policy",
    href: "https://www.wati.io/privacy-policy/",
  },
  {
    label: "ICO Cookies Guidance",
    href: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/",
  },
];

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    icon: FileText,
    paragraphs: [
      `${BRAND_NAME} uses cookies, local storage, SDK-related storage, and similar browser technologies to operate our website and web application.`,
      `This Cookie Policy explains what these technologies are, why we use them, and what choices may be available to users of our platform.`,
    ],
  },
  {
    id: "what-we-use",
    title: "2. What We Use on Our Platform",
    icon: Cookie,
    paragraphs: [
      `Our platform currently relies heavily on browser storage and similar technologies used by the application itself. Depending on the feature, this can include local storage entries, session-related browser storage, and third-party SDK storage.`,
    ],
    bullets: [
      "Authentication and session state, including login token continuity for authorized users.",
      "Workspace continuity, so the correct workspace context stays active while the user is signed in.",
      "User interface preferences, such as sidebar state, builder preferences, cached emoji data, and template draft continuity.",
      "Meta SDK or related embedded business onboarding flows that may use cookies or similar browser storage when those flows are initiated.",
    ],
  },
  {
    id: "why-we-use",
    title: "3. Why We Use These Technologies",
    icon: ShieldCheck,
    paragraphs: [
      `We use these technologies to keep the platform secure, maintain account state, preserve usability, and support requested functionality inside the app.`,
    ],
    bullets: [
      "To keep users signed in and protect authenticated routes.",
      "To remember selected workspace and app state between page loads.",
      "To maintain essential UI settings and draft work so users do not lose progress unnecessarily.",
      "To support embedded Meta and WhatsApp-related business setup workflows where browser storage may be required for that requested flow.",
    ],
  },
  {
    id: "essential",
    title: "4. Essential vs Optional Technologies",
    icon: Lock,
    paragraphs: [
      `Some storage technologies are strictly necessary to provide the service requested by the user, such as maintaining login state, security, workspace routing, and core app continuity.`,
      `If we add non-essential analytics, advertising, remarketing, or behavioral tracking technologies in the future, we may provide additional notice, controls, or consent collection as required by applicable law.`,
    ],
  },
  {
    id: "controls",
    title: "5. Your Choices",
    icon: Cookie,
    paragraphs: [
      `Most browsers allow users to block or clear cookies and other stored website data. You may also clear local storage and related site data from your browser settings.`,
      `Please note that disabling essential storage may cause login failures, broken workspace switching, lost drafts, or other functionality issues within ${BRAND_NAME}.`,
    ],
  },
  {
    id: "updates",
    title: "6. Changes to This Policy",
    icon: FileText,
    paragraphs: [
      `We may update this Cookie Policy if our storage practices, product features, or legal obligations change. The updated version becomes effective when published unless another date is stated.`,
    ],
  },
];

function SectionCard({
  id,
  title,
  icon: Icon,
  paragraphs,
  bullets,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<React.ComponentProps<typeof FileText>>;
  paragraphs: string[];
  bullets?: string[];
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-xl sm:p-7">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {bullets?.length ? (
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function CookiePolicyPage() {
  return (
    <PublicShell>
      <Seo
        title={`Cookie Policy | ${BRAND_NAME}`}
        description={`${BRAND_NAME} Cookie Policy covering cookies, local storage, SDK storage, and essential browser technologies used by the platform.`}
        canonical={window.location.href}
      />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-cyan-50/60 p-6 shadow-[0_18px_60px_rgba(16,185,129,0.10)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
            <Cookie className="h-3.5 w-3.5" />
            Cookie Policy
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            How {BRAND_NAME} uses cookies, local storage, and similar browser technologies.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            This page is written for the actual behavior of our platform, including authenticated
            workspace access, UI preferences, saved drafts, and Meta-connected business setup flows.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              Effective date: {effectiveDate}
            </span>
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              Essential platform storage
            </span>
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              Browser storage and SDK storage
            </span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-1">

          <div className="rounded-3xl border border-sky-200 bg-sky-50/90 p-6 shadow-sm">
            <h2 className="text-lg font-black text-sky-950">Platform-specific note</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-sky-900">
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <span>The platform uses essential browser storage for auth and workspace continuity.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <span>Some Meta-connected setup flows may involve SDK-related cookies or similar storage when the user opens those flows.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <span>If non-essential analytics or tracking tools are added later, additional consent controls may be required.</span>
              </li>
            </ul>
          </div>
        </section>

        <div className="space-y-5">
          {sections.map((section) => (
            <SectionCard key={section.id} {...section} />
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
