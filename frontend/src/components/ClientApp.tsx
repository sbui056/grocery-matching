"use client";

import { useEffect } from "react";
import type { Summary, Match } from "@/lib/types";
import Navbar from "./Navbar";
import Hero from "./Hero";
import MethodologySection from "./MethodologySection";
import ResultsSection from "./ResultsSection";
import MatchExplorer from "./MatchExplorer";
import TechStack from "./TechStack";
import Footer from "./Footer";

export default function ClientApp({
  summary,
  matches,
}: {
  summary: Summary;
  matches: Match[];
}) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <Navbar />
      <Hero summary={summary} matches={matches} />
      <MethodologySection />
      <ResultsSection summary={summary} />
      <MatchExplorer matches={matches} />
      <TechStack />
      <Footer />
    </>
  );
}
