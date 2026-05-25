import { motion } from "framer-motion";

function HeroIllustration() {
  // Lightweight SVG hero (replaces the heavy 3D canvas).
  return (
    <svg
      viewBox="0 0 720 720"
      className="h-full w-full"
      role="img"
      aria-label="Product preview illustration"
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#25D366" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#11d593" stopOpacity="0.95" />
          <stop offset="1" stopColor="#06b6d4" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.65" />
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#0b1222" floodOpacity="0.16" />
        </filter>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(11,16,32,0.06)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="720" height="720" fill="url(#grid)" />

      {/* Glow blobs */}
      <circle cx="520" cy="170" r="150" fill="#25D366" opacity="0.10" />
      <circle cx="210" cy="520" r="170" fill="#06b6d4" opacity="0.10" />


      {/* Phone */}
      <g filter="url(#shadow)" transform="translate(220 90)">
        <rect x="0" y="0" width="280" height="540" rx="46" fill="#d7dbe0" />
        <rect x="16" y="16" width="248" height="508" rx="40" fill="#c7cbd0" />
        <rect x="34" y="54" width="212" height="434" rx="30" fill="#0b1222" />

        {/* Screen */}
        <rect x="44" y="66" width="192" height="410" rx="24" fill="#efe8df" />
        <rect x="44" y="66" width="192" height="70" rx="24" fill="#075e54" />
        <circle cx="76" cy="100" r="16" fill="#ffffff" opacity="0.92" />
        <rect x="104" y="92" width="110" height="12" rx="6" fill="#ffffff" opacity="0.92" />
        <rect x="104" y="110" width="84" height="9" rx="4.5" fill="#ffffff" opacity="0.72" />

        {/* Message bubbles */}
        <g>
          <rect x="62" y="170" width="150" height="56" rx="16" fill="url(#g2)" />
          <rect x="70" y="188" width="130" height="10" rx="5" fill="#4b5f82" opacity="0.55" />
          <rect x="70" y="205" width="104" height="10" rx="5" fill="#4b5f82" opacity="0.35" />
        </g>
        <g>
          <rect x="86" y="246" width="150" height="56" rx="16" fill="url(#g2)" />
          <rect x="94" y="264" width="130" height="10" rx="5" fill="#4b5f82" opacity="0.55" />
          <rect x="94" y="281" width="98" height="10" rx="5" fill="#4b5f82" opacity="0.35" />
        </g>
        <g>
          <rect x="62" y="322" width="150" height="56" rx="16" fill="url(#g2)" />
          <rect x="70" y="340" width="130" height="10" rx="5" fill="#4b5f82" opacity="0.55" />
          <rect x="70" y="357" width="112" height="10" rx="5" fill="#4b5f82" opacity="0.35" />
        </g>

        {/* CTA buttons */}
        <rect x="62" y="408" width="174" height="18" rx="9" fill="url(#g1)" opacity="0.85" />
        <rect x="62" y="434" width="174" height="18" rx="9" fill="url(#g1)" opacity="0.60" />
      </g>

      {/* Accent ring */}
      <circle cx="520" cy="560" r="74" fill="none" stroke="url(#g1)" strokeWidth="10" opacity="0.35" />
    </svg>
  );
}

function Stat({ val, label }: { val: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-extrabold text-ink-900">{val}</span>
      <span className="text-xs text-ink-900/55 font-medium">{label}</span>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative pt-15 lg:pt-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(37,211,102,0.16),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(6,182,212,0.12),transparent_48%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 bg-white/60 backdrop-blur">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#25D366" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#11d593" stopOpacity="0.95" />
            <stop offset="1" stopColor="#06b6d4" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.65" />
          </linearGradient>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#0b1222" floodOpacity="0.16" />
          </filter>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(11,16,32,0.06)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="720" height="720" fill="url(#grid)" />

        {/* Glow blobs */}
        <circle cx="520" cy="170" r="150" fill="#25D366" opacity="0.10" />
        <circle cx="210" cy="520" r="170" fill="#06b6d4" opacity="0.10" />
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left */}
          <div>

            <div className="mt-6">
              <h1 className="text-4xl font-black tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
                <span className="block">Send Smarter.</span>
                <span className="block bg-gradient-to-r from-[#25D366] via-[#11d593] to-[#06b6d4] bg-clip-text text-transparent">
                  Convert Faster.
                </span>
                <span className="block text-ink-900/70">Scale Bigger.</span>
              </h1>
            </div>

            <p className="mt-6 text-lg text-ink-900/70 leading-relaxed max-w-md">
              The all-in-one WhatsApp Business API platform. Automate campaigns, manage contacts, and drive real revenue
              — all from one beautiful dashboard.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/register"
                className="group relative flex items-center gap-2 bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white font-bold px-8 py-4 rounded-2xl text-base shadow-2xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 hover:scale-105 transition-all duration-300"
              >
                Start Free Trial
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 border border-ink-900/12 text-ink-900/80 hover:text-ink-900 hover:border-ink-900/18 font-semibold px-8 py-4 rounded-2xl text-base transition-all duration-300 hover:bg-white/60"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </a>
            </div>

            <div className="mt-10 flex items-center gap-8">
              <Stat val="50K+" label="Active Users" />
              <Stat val="2B+" label="Messages Sent" />
              <Stat val="99.9%" label="Uptime SLA" />
            </div>
          </div>

          {/* Right illustration */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
            className="relative h-[420px] sm:h-[520px] lg:h-[620px]"
          >
            <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_50%_50%,rgba(37,211,102,0.08),transparent_70%)]" />
            <div className="relative h-full p-2">
              <HeroIllustration />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
