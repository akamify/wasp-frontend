import { useEffect, useMemo, useRef, useState } from "react";
import { LandingNavbar } from "@components/landing/LandingNavbar";
import { HeroSection } from "@components/landing/HeroSection";
import { FeaturesSection } from "@components/landing/FeaturesSection";
import { HowItWorksSection } from "@components/landing/HowItWorksSection";
import { DashboardPreview } from "@components/landing/DashboardPreview";
import { CTASection } from "@components/landing/CTASection";
import { LandingFooter } from "@components/landing/LandingFooter";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";
import { BrodcasSection } from "@components/landing/BroadcastSection";
import { UniSection } from "@components/landing/UniSection";
import { AutomationFlow } from "@components/landing/Automationflow";
import { Partner } from "@components/landing/Pratner";
import { Features } from "@components/landing/Features";
import { Faqs, landingFaqs } from "@components/landing/Faqs";
import { LiveDemoBookingModal } from "@components/landing/LiveDemoBookingModal";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://aiwizchat.com";
  const canonicalUrl = `${origin}/`;
  const ogImage = `${origin}/logo.png`;

  const structuredData = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: BRAND_NAME,
        url: canonicalUrl,
        logo: ogImage,
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: BRAND_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: canonicalUrl,
        description:
          "WhatsApp Business API platform for campaigns, automation flows, shared inbox, CRM, templates, contacts, and analytics.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: landingFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
    [canonicalUrl, ogImage]
  );

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div ref={containerRef} className="landing-root overflow-x-hidden">
      <Seo
        title={`${BRAND_NAME} | WhatsApp Business API, Campaigns & Automation`}
        description="AiWizChat helps teams send WhatsApp campaigns, build automation flows, manage shared inbox conversations, sync templates, and track customer engagement."
        canonical={canonicalUrl}
        ogImage={ogImage}
        ogImageAlt={`${BRAND_NAME} WhatsApp marketing platform`}
        structuredData={structuredData}
      />
      <LandingNavbar />
      <HeroSection onBookDemo={() => setDemoOpen(true)} />
      <BrodcasSection />
      <Partner />
      <AutomationFlow />
      <Features />
      <UniSection />
      <Faqs />
      <LandingFooter />
      <LiveDemoBookingModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
