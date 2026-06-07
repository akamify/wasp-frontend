import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useAuth } from "@shared/providers/AuthContext";
import { authAwareHref } from "@shared/utils/authNavigation";

const steps = [
  {
    num: "01",
    title: "Connect Your WhatsApp",
    desc: "Link your WhatsApp Business API account in minutes. No technical skills needed — just scan a QR code and you're live.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: "#25D366",
  },
  {
    num: "02",
    title: "Create Template",
    desc: "Create you first template. Our intuitive editor makes it easy to design rich messages with images, buttons, and dynamic variables.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    color: "#b1cc13",
  },
  {
    num: "03",
    title: "Add Your Contacts",
    desc: "Upload CSV files, sync from your CRM, or capture leads via forms. Smart deduplication keeps your list clean.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "#7c3aed",
  },
  {
    num: "04",
    title: "Add Wallet Balance",
    desc: "Recharge your wallet with our secure payment gateway. We support multiple currencies and offer transparent pricing with no hidden fees.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5C3 3.89543 3.89543 3 5 3H17C18.1046 3 19 3.89543 19 5V7H20C21.1046 7 22 7.89543 22 9V17C22 18.1046 21.1046 19 20 19H5C3.89543 19 3 18.1046 3 17V5ZM17 5H5V17H17V15H15C13.8954 15 13 14.1046 13 13V11C13 9.89543 13.8954 9 15 9H17V5ZM19 9H15V13H19V9ZM17 11H16V12H17V11Z" />
      </svg>
    ),
    color: "#06b6d4",
  },
  {
    num: "05",
    title: "Build Your Campaign",
    desc: "Design rich message templates with images, buttons, and CTAs. Our visual editor makes it drag-and-drop simple.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: "#d01433",
  },
  {
    num: "06",
    title: "Launch & Watch It Convert",
    desc: "Schedule or send instantly. Track real-time delivery, open rates, and replies from your live analytics dashboard.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: "#f59e0b",
  },
];

export function HowItWorksSection() {
  const { token, user } = useAuth();
  const startHref = authAwareHref({ token, role: user?.role, guestHref: "/register" });
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="how-it-works"
      className="relative py-15 md:py-10 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f7f6f2 0%, #ffffff 100%)" }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#25D366]/8 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          {/* <span className="inline-block text-xs font-bold tracking-widest uppercase text-plum-500 bg-white border border-ink-900/10 rounded-full px-4 py-1.5 mb-4">
            How It Works
          </span> */}
          <h2 className="text-4xl lg:text-5xl font-extrabold text-ink-900 mb-4">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-[#7c3aed] to-[#25D366] bg-clip-text text-transparent">
              under 10 minutes
            </span>
          </h2>
          <p className="text-lg text-ink-900/65 max-w-xl mx-auto">
            Four simple steps to launch your first WhatsApp campaign and start generating revenue.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ink-900/10 to-transparent" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Step circle */}
                <div className="relative mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 group-hover:shadow-2xl"
                    style={{
                      borderColor: `${step.color}40`,
                      background: `${step.color}15`,
                      boxShadow: `0 0 0 0 ${step.color}40`,
                    }}
                  >
                    <span style={{ color: step.color }}>{step.icon}</span>
                  </motion.div>
                  {/* Step number badge */}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-extrabold flex items-center justify-center"
                    style={{ background: step.color, color: "#0b1020" }}>
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-ink-900 mb-2">{step.title}</h3>
                <p className="text-sm text-ink-900/65 leading-relaxed">{step.desc}</p>

                {/* Arrow connector (mobile/tablet) */}
                {i < steps.length - 1 && (
                  <div className="lg:hidden mt-6 text-ink-900/25">
                    <svg className="w-6 h-6 mx-auto rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="mt-20 rounded-3xl border border-ink-900/10 bg-gradient-to-r from-[#25D366]/10 via-white to-[#7c3aed]/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <p className="text-sm text-[#25D366] font-semibold mb-1">🎉 No credit card required</p>
            <p className="text-xl font-extrabold text-ink-900">Start your free trial today</p>
          </div>
          <a href={startHref}
            className="shrink-0 bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white font-bold px-8 py-3.5 rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-[#25D366]/30 transition-all duration-200">
            Get Started Free →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
