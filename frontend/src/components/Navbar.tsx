"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Methodology", href: "#pipeline" },
  { label: "Results", href: "#results" },
  { label: "Matches", href: "#matches" },
  { label: "Design", href: "#design" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAFAF8]/85 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 h-[52px] flex items-center justify-between">
        <a href="#" className="inline-flex items-center gap-1.5">
          <span className="font-mono text-[13px] text-foreground/50 tracking-tight">
            grocery-matching
          </span>
        </a>

        <div className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-[13px] text-foreground/35 hover:text-foreground/70 transition-colors duration-150"
            >
              {item.label}
            </a>
          ))}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-foreground/35 transition-colors duration-150"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#FAFAF8]/95 backdrop-blur-md border-t border-border">
          <div className="px-6 py-3 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-[13px] text-foreground/35 hover:text-foreground/70 transition-colors duration-150"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
