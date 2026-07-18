import { LandingNavbar } from "@components/landing/LandingNavbar";
import { LandingFooter } from "@components/landing/LandingFooter";
import { Features } from "@components/landing/Features";
import { BrodcasSection } from "@components/landing/BroadcastSection";
import { AutomationFlow } from "@components/landing/Automationflow";
import { UniSection } from "@components/landing/UniSection";
import { Faqs } from "@components/landing/Faqs";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";

export default function FeaturesPage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.aiwizchat.com";
  const canonical = `${origin}/features`;

  return (
    <div className="landing-root overflow-x-hidden bg-white">
      <Seo
        title={`Features | ${BRAND_NAME}`}
        description={`${BRAND_NAME} features for WhatsApp campaigns, automation flows, templates, shared inbox, CRM, contact import, scheduling, and analytics.`}
        canonical={canonical}
        ogImage={`${origin}/logo.png`}
        ogImageAlt={`${BRAND_NAME} features`}
      />
      <LandingNavbar />
      <main>
        <section className="relative overflow-hidden bg-[#fbfdfb] px-4 pb-10 pt-32 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-120px] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-emerald-100/90 blur-[120px]" />
            <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(15,23,42,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
          </div>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex rounded-full border border-emerald-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
              Platform Features
            </div>
            <h1 className="text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-6xl">
              WhatsApp tools for every growth workflow.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-lg">
              Explore the core product sections already available in {BRAND_NAME}: campaigns, automation,
              shared inbox, templates, contact management, CRM workflows, and analytics.
            </p>
          </div>
        </section>
        <Features />
        <BrodcasSection />
        <AutomationFlow />
        <UniSection />
        <Faqs />
      </main>
      <LandingFooter />
    </div>
  );
}
