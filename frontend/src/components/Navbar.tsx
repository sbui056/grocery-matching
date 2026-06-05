"use client";

import { useState, useEffect } from "react";

const NAV = [
  { label: "Methodology", href: "#methodology" },
  { label: "Results", href: "#results" },
  { label: "Matches", href: "#matches" },
  { label: "Design", href: "#design" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      const ids = ["methodology", "results", "matches", "design"];
      let cur = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) cur = id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={"nav" + (scrolled ? " scrolled" : "")}>
      <div className="row">
        <a href="#top" className="brand">
          grocery-matching
        </a>
        <div className="links">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={active && n.href === "#" + active ? "active" : ""}
            >
              {n.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
