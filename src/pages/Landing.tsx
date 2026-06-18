import { useEffect, useRef } from "react";
import { LandingNavbar } from "@components/landing/LandingNavbar";
import { HeroSection } from "@components/landing/HeroSection";
import { FeaturesSection } from "@components/landing/FeaturesSection";
import { HowItWorksSection } from "@components/landing/HowItWorksSection";
import { DashboardPreview } from "@components/landing/DashboardPreview";
import { CTASection } from "@components/landing/CTASection";
import { LandingFooter } from "@components/landing/LandingFooter";
import { Seo } from "@shared/components/Seo";

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
        title="WaspAkamify | WhatsApp Marketing Platform"
        description="Automate WhatsApp campaigns, manage conversations, and scale customer engagement from one workspace."
        canonical={window.location.origin + "/"}
      />
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      {/* <CampaignsSection /> */}
      <DashboardPreview />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
