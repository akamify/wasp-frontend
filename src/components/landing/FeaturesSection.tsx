import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BarChart, Link, Lock, Megaphone, MessageCircle, Bot } from "lucide-react";

const features = [
  {
    icon: <Megaphone className="w-7 h-7" />,
    title: "Bulk Broadcasting",
    desc: "Send personalized messages to thousands of contacts in seconds. Segment by behavior, demographics, or custom tags.",
    gradient: "from-[#25D366]/20 to-[#06b77e]/5",
    border: "border-[#25D366]/20",
    glow: "shadow-[#25D366]/10",
  },
  {
    icon: <Bot className="w-7 h-7" />,
    title: "Smart Automation",
    desc: "Build no-code chatbots and drip sequences that respond, qualify, and convert leads 24/7 without human intervention.",
    gradient: "from-[#7c3aed]/20 to-[#6d28d9]/5",
    border: "border-[#7c3aed]/20",
    glow: "shadow-[#7c3aed]/10",
  },
  {
    icon: <BarChart className="w-7 h-7" />,
    title: "Real-time Analytics",
    desc: "Track opens, clicks, replies, and conversions per campaign. Beautiful dashboards that tell the full story.",
    gradient: "from-[#06b6d4]/20 to-[#0891b2]/5",
    border: "border-[#06b6d4]/20",
    glow: "shadow-[#06b6d4]/10",
  },
  {
    icon: <MessageCircle className="w-7 h-7" />,
    title: "Shared Team Inbox",
    desc: "Collaborate on customer conversations with your whole team. Assign, tag, and resolve chats at lightning speed.",
    gradient: "from-[#f59e0b]/20 to-[#d97706]/5",
    border: "border-[#f59e0b]/20",
    glow: "shadow-[#f59e0b]/10",
  },
  {
    icon: <Link className="w-7 h-7" />,
    title: "Smart Link Tracking",
    desc: "Create trackable short links with UTM auto-injection. Know exactly which messages drive your highest revenue.",
    gradient: "from-[#ef4444]/20 to-[#dc2626]/5",
    border: "border-[#ef4444]/20",
    glow: "shadow-[#ef4444]/10",
  },
  {
    icon: <Lock className="w-7 h-7" />,
    title: "Enterprise Security",
    desc: "End-to-end encryption, GDPR compliance, role-based access and audit logs — security built for scale.",
    gradient: "from-[#25D366]/20 to-[#7c3aed]/5",
    border: "border-ink-900/10",
    glow: "shadow-black/5",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative group rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.gradient} p-6 shadow-xl ${feature.glow} cursor-default overflow-hidden`}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(37,211,102,0.06) 0%, transparent 70%)" }} />

      <div className="text-3xl mb-4">{feature.icon}</div>
      <h3 className="text-lg font-bold text-ink-900 mb-2">{feature.title}</h3>
      <p className="text-sm text-ink-900/70 leading-relaxed">{feature.desc}</p>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-20 group-hover:opacity-40 transition-opacity">
        <div className="w-full h-full rounded-bl-full bg-gradient-to-bl from-white/20 to-transparent" />
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true, margin: "-60px" });

  return (
    <section
      id="features"
      className="relative py-15 md:py-10 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7f6f2 100%)" }}
    >
      {/* Background blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#25D366]/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#7c3aed]/7 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          {/* <span className="inline-block text-xs font-bold tracking-widest uppercase text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 mb-4">
            Features
          </span> */}
          <h2 className="text-4xl lg:text-5xl font-extrabold text-ink-900 mb-4">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-[#25D366] to-[#06b6d4] bg-clip-text text-transparent">
              dominate WhatsApp
            </span>
          </h2>
          <p className="text-lg text-ink-900/65 max-w-2xl mx-auto">
            From bulk campaigns to intelligent automation — one platform to run your entire WhatsApp marketing engine.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
