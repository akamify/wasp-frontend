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
      <main className="mt-12 sm:mt-10">
        <Features  />
        <BrodcasSection />
        <AutomationFlow />
        <UniSection />
      </main>
      <LandingFooter />
    </div>
  );
}
