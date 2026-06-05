"use client";

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
