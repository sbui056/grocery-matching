"use client";

import {
  Layers,
  Grid3x3,
  Search,
  BarChart3,
  Brain,
  FileOutput,
} from "lucide-react";

const PHASES = [
  {
    icon: Layers,
    title: "Pre-processing",
    subtitle: "Normalize & Extract",
    description:
      "Lowercase names, strip symbols, extract brands (54% → 80% fill rate) and sizes (17% → 57% fill rate). Filter Store A to 170K matchable products.",
    stats: ["233K → 170K products", "Brand extraction", "Size normalization"],
  },
  {
    icon: Grid3x3,
    title: "Category Blocking",
    subtitle: "Reduce Search Space",
    description:
      "Map Walmart categories to compatible Wegmans categories across 12 blocks. Restricting comparisons to plausible pairings cuts candidate pairs by 60%.",
    stats: ["12 category blocks", "9.4B → 4.1B pairs", "60% reduction"],
  },
  {
    icon: Search,
    title: "Candidate Generation",
    subtitle: "Dual Retrieval",
    description:
      "TF-IDF bigram vectorization for lexical matching plus OpenAI text-embedding-3-small for semantic similarity. Union of top-20 candidates from each method.",
    stats: ["TF-IDF (~40s)", "Embeddings (~13m)", "Top-20 union"],
  },
  {
    icon: BarChart3,
    title: "Multi-Signal Scoring",
    subtitle: "5 Weighted Signals",
    description:
      "Composite score from TF-IDF cosine (0.25), embedding cosine (0.25), brand match (0.25), size match (0.15), and Jaccard similarity (0.10).",
    stats: ["5 signal weights", "Private-label logic", "Top-5 per product"],
  },
  {
    icon: Brain,
    title: "LLM Adjudication",
    subtitle: "GPT-5.4-Nano Verification",
    description:
      "All candidates above threshold verified by LLM with JSON mode. 5 products per call, 30 concurrent requests, checkpoint/resume for fault tolerance.",
    stats: ["~15K API calls", "30 concurrency", "Checkpoint/resume"],
  },
  {
    icon: FileOutput,
    title: "Output",
    subtitle: "Final Match List",
    description:
      "24,370 verified matches with confidence levels. Diagnostic CSV includes all five signal scores for every match pair.",
    stats: ["24,370 matches", "3 confidence tiers", "Full diagnostics"],
  },
];

export default function PipelineSection() {
  return (
    <section className="px-6 sm:px-10 pt-16 sm:pt-24 pb-8 max-w-[1100px] mx-auto" id="pipeline">
      <h2 className="font-display text-[28px] sm:text-[36px] tracking-[-0.015em] text-foreground mb-2">
        Pipeline
      </h2>
      <p className="text-[15px] leading-relaxed text-foreground/40 max-w-md mb-12">
        Six-phase entity matching architecture for large-scale product deduplication.
      </p>

      <div>
        {PHASES.map((phase, i) => {
          const Icon = phase.icon;
          return (
            <div
              key={phase.title}
              className={`relative flex items-start gap-4 sm:gap-5 py-7 ${
                i < PHASES.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <span className="absolute right-0 top-3 font-display text-[4rem] sm:text-[5rem] leading-none text-foreground/[0.025] select-none pointer-events-none">
                {i + 1}
              </span>

              <div className="shrink-0 mt-1">
                <Icon className="w-[17px] h-[17px] text-foreground/20" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1.5">
                  <h3 className="text-[15px] font-medium text-foreground">
                    {phase.title}
                  </h3>
                  <span className="text-[13px] text-foreground/25">
                    {phase.subtitle}
                  </span>
                </div>

                <p className="text-[14px] leading-[1.65] text-foreground/40 mb-3 max-w-xl">
                  {phase.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {phase.stats.map((stat) => (
                    <span
                      key={stat}
                      className="px-2 py-0.5 rounded text-[11px] font-medium text-foreground/35 bg-foreground/[0.025]"
                    >
                      {stat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
