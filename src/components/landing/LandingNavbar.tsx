import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND_NAME } from "../../config/brand";
import { useAuth } from "../../context/AuthContext";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Pricing", href: "#cta" },
];

export function LandingNavbar() {
  const { token } = useAuth();
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-white/80 border-b border-ink-900/10 shadow-[0_22px_70px_rgba(11,16,32,0.10)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-18">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#25D366] to-[#06b77e] flex items-center justify-center shadow-lg shadow-[#25D366]/30 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
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
            <a
              href="/app"
              className="text-sm font-semibold bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white px-5 py-2 rounded-xl hover:shadow-lg hover:shadow-[#25D366]/25 hover:scale-105 transition-all duration-200"
            >
              Dashboard
            </a>
          ) : (
            <>
              <a href="/login" className="text-sm text-ink-900/70 hover:text-ink-900 transition-colors px-4 py-2">
                Sign in
              </a>
              <a
                href="/register"
                className="text-sm font-semibold bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white px-5 py-2 rounded-xl hover:shadow-lg hover:shadow-[#25D366]/25 hover:scale-105 transition-all duration-200"
              >
                Get Started Free
              </a>
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
                  <a href="/app" className="flex-1 text-center text-sm font-semibold bg-gradient-to-r from-[#25D366] to-[#06b77e] text-white py-2 rounded-lg">
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
