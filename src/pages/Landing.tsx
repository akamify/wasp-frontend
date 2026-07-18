import { useEffect, useRef } from "react";
import { LandingNavbar } from "@components/landing/LandingNavbar";
import { HeroSection } from "@components/landing/HeroSection";

import { LandingFooter } from "@components/landing/LandingFooter";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";
import { BrodcasSection } from "@components/landing/BroadcastSection";
import { UniSection } from "@components/landing/UniSection";
import { AutomationFlow } from "@components/landing/Automationflow";
import { Partner } from "@components/landing/Pratner";
import { Features } from "@components/landing/Features";
import { Faqs } from "@components/landing/Faqs";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div ref={containerRef} className="landing-root overflow-x-hidden">
      <Seo
        title={`${BRAND_NAME} | WhatsApp Marketing Platform`}
        description="Automate WhatsApp campaigns, manage conversations, and scale customer engagement from one workspace."
        canonical={window.location.origin + "/"}
      />
      <LandingNavbar />
      <HeroSection />
      <BrodcasSection />
      <Partner />
      <AutomationFlow />
      <Features />
      <UniSection />
      <Faqs />
      <LandingFooter />
    </div>
  );
}
