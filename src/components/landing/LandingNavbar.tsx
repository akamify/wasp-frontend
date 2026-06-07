import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND_NAME } from "@shared/config/brand";
import { useAuth } from "@shared/providers/AuthContext";
import { authenticatedHome } from "@shared/utils/authNavigation";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Dashboard Preview", href: "#dashboard" },
  { label: "Pricing", href: "#cta" },
];

export function LandingNavbar() {
  const { token, user } = useAuth();
  const authenticatedHref = authenticatedHome(user?.role, token);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "backdrop-blur-xl bg-white/80 border-b border-ink-900/10 shadow-[0_22px_70px_rgba(11,16,32,0.10)]"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-18">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform">
            <img src="logo.png" alt={BRAND_NAME} className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-ink-900 tracking-tight">
            {BRAND_NAME}
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-ink-900/70 hover:text-ink-900 transition-colors duration-200 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <motion.a
              href={authenticatedHref}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="text-sm font-semibold bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white px-5 py-2 rounded-xl transition-all duration-300 ease-out shadow-lg hover:shadow-2xl hover:shadow-[#25D366]/25"
            >
              Dashboard
            </motion.a>
          ) : (
            <>
              <a href="/login" className="text-sm text-ink-900/70 hover:text-ink-900 transition-colors px-4 py-2">
                Sign in
              </a>
              <motion.a
                href="/register"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="text-sm font-semibold bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white px-5 py-2 rounded-xl transition-all duration-300 ease-out shadow-lg hover:shadow-2xl hover:shadow-[#25D366]/25"
              >
                Get Started Free
              </motion.a>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 text-ink-900/70 hover:text-ink-900"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden backdrop-blur-xl bg-white/92 border-b border-ink-900/10"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
                  className="text-ink-900/70 hover:text-ink-900 transition-colors text-sm">
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2 border-t border-ink-900/10">
                {token ? (
                  <a href={authenticatedHref} className="flex-1 text-center text-sm font-semibold bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white py-2 rounded-lg">
                    Dashboard
                  </a>
                ) : (
                  <>
                    <a href="/login" className="flex-1 text-center text-sm text-ink-900/70 border border-ink-900/12 bg-white py-2 rounded-lg hover:bg-brand-50/60 transition">Sign in</a>
                    <a href="/register" className="flex-1 text-center text-sm font-semibold bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white py-2 rounded-lg">Get Started</a>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
