import { useRef } from "react";
import { motion, useInView } from "framer-motion";

import { BRAND_NAME } from "@shared/config/brand";
import { usePlans } from "@modules/billing/hooks/usePlans";
import { useAuth } from "@shared/providers/AuthContext";
import { authAwareHref, authenticatedHome } from "@shared/utils/authNavigation";

function formatPlanPrice(plan: any) {
  const paise = plan?.pricing?.discountedPricePaise;
  if (paise == null) return "Custom";
  return `?${Math.round(Number(paise) / 100).toLocaleString("en-IN")}`;
}

const logos = ["Digital Adbird", "Maxify Global", "Think Sync", "Mahabali Education"];

export function CTASection() {
  const { token, user } = useAuth();
  const authenticatedHref = authenticatedHome(user?.role, token);
  const startHref = authAwareHref({ token, role: user?.role, guestHref: "/register" });
  const signInHref = authAwareHref({ token, role: user?.role, guestHref: "/login" });
  const { items } = usePlans();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const plans = (Array.isArray(items) ? items : []).slice(0, 3).map((plan: any) => ({
    name: plan.name,
    price: formatPlanPrice(plan),
    per: plan.planType === "custom" ? "" : "/month",
    desc: plan.description || "",
    features: Array.isArray(plan.displayFeatures) ? plan.displayFeatures.slice(0, 6) : [],
    cta: plan?.buttonText || "Buy Now",
    badgeText: String(plan?.badgeText || ""),
    featured: Boolean(plan?.recommended),
  }));

  return (
    <section
      id="cta"
      className="relative py-15 md:py-10 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f7f6f2 0%, #ffffff 100%)" }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#25D366]/8 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-extrabold text-ink-900 mb-4">
            Simple pricing,{" "}
            <span className="bg-gradient-to-r from-[#25D366] to-[#f59e0b] bg-clip-text text-transparent">
              no surprises
            </span>
          </h2>
          <p className="text-lg text-ink-900/65 max-w-xl mx-auto">
            Start free, scale as you grow. Cancel anytime with no lock-in contracts.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className={`relative rounded-3xl border p-8 flex flex-col gap-6 transition-all duration-300 ${plan.featured
                  ? "border-[#25D366]/30 bg-gradient-to-b from-[#25D366]/10 to-white shadow-2xl shadow-[#25D366]/12"
                  : "border-ink-900/10 bg-white hover:border-ink-900/16"
                }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white text-xs font-bold px-5 py-1.5 rounded-full">
                  {plan.badgeText || "Recommended"}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-ink-900/70 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-ink-900">{plan.price}</span>
                  <span className="text-ink-900/45">{plan.per}</span>
                </div>
                <p className="text-sm text-ink-900/65 mt-2 leading-relaxed">{plan.desc}</p>
              </div>
              <ul className="flex flex-col gap-3">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-ink-900/72">
                    <svg className="w-4 h-4 text-[#25D366] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <motion.a
                href={token ? authenticatedHref : "/login"}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className={`mt-auto text-center font-bold py-3.5 rounded-xl text-sm transition-all duration-300 ease-out ${plan.featured
                    ? "bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white shadow-2xl shadow-[#25D366]/20 hover:shadow-[#25D366]/50 hover:shadow-2xl"
                    : "border border-ink-900/12 text-ink-900 hover:bg-brand-50/60 hover:shadow-lg hover:shadow-ink-900/10"
                  }`}
              >
                {plan.cta}
              </motion.a>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-center font-semibold text-ink-900/60 -mt-16 mb-16">
          WhatsApp template messages charge are billed separately from wallet balance where applicable.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-center"
        >
          <p className="text-xs font-semibold text-ink-900/45 uppercase tracking-widest mb-8">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
            {logos.map((logo) => (
              <span key={logo} className="text-lg font-extrabold text-ink-900 tracking-tight">{logo}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-20 rounded-3xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #25D366 0%, #06b77e 50%, #059267 100%)" }}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImcyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNjAgMCBMIDAgMCAwIDYwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnMikiLz48L3N2Zz4=')] opacity-50" />
          <div className="relative p-12 text-center flex flex-col items-center gap-6">
            <h3 className="text-3xl lg:text-4xl font-extrabold text-white">
              Ready to grow your business<br />with WhatsApp?
            </h3>
            <p className="text-white/80 max-w-md">
              Join modern businesses using {BRAND_NAME} to send smarter messages and convert more customers.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                <motion.a
                href={startHref}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="bg-white text-[#059267] font-extrabold px-8 py-4 rounded-2xl transition-all duration-300 ease-out hover:shadow-2xl hover:brightness-110"
              >
                Start Free - No Credit Card
              </motion.a>
              <motion.a
                href={signInHref}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="border-2 border-white/40 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 ease-out hover:bg-white/10 hover:shadow-lg"
              >
                {token ? "Open Dashboard" : "Sign In"}
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
