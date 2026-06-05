"use client";

import {
  Layers, Grid3x3, Search, BarChart3, Brain, FileOutput,
} from "lucide-react";

const PHASES = [
  { icon: Layers, title: "Pre-processing", sub: "Normalize & Extract", desc: "Lowercase, strip symbols, extract brands (54%→80%) and sizes (17%→57%). Filter to 170K matchable." },
  { icon: Grid3x3, title: "Category Blocking", sub: "Reduce Search Space", desc: "Map categories across 12 blocks. Cut candidate pairs from 9.4B to 4.1B (60% reduction)." },
  { icon: Search, title: "Candidate Generation", sub: "Dual Retrieval", desc: "TF-IDF bigrams for lexical matching + OpenAI embeddings for semantic similarity. Union of top-20 each." },
  { icon: BarChart3, title: "Multi-Signal Scoring", sub: "5 Weighted Signals", desc: "Composite from TF-IDF (0.25), embedding (0.25), brand (0.25), size (0.15), Jaccard (0.10)." },
  { icon: Brain, title: "LLM Adjudication", sub: "GPT-5.4-Nano", desc: "JSON-mode verification, 5 products/call, 30 concurrency, checkpoint/resume for fault tolerance." },
  { icon: FileOutput, title: "Output", sub: "Final Matches", desc: "24,370 verified matches with confidence levels and full diagnostic scores." },
];

const WEIGHTS = [
  { signal: "TF-IDF", weight: 0.25, color: "#3b5ccc", desc: "Lexical similarity via bigram vectorization" },
  { signal: "Embedding", weight: 0.25, color: "#6c5ce7", desc: "Semantic similarity via OpenAI embeddings" },
  { signal: "Brand", weight: 0.25, color: "#2d8a56", desc: "Exact, private-label cross, or fuzzy match" },
  { signal: "Size", weight: 0.15, color: "#c47d1a", desc: "Unit-normalized comparison" },
  { signal: "Jaccard", weight: 0.10, color: "#0891B2", desc: "Word-level set overlap" },
];

export default function MethodologySection() {
  return (
    <section className="px-6 sm:px-10 py-12 sm:py-16 max-w-[1100px] mx-auto" id="pipeline">
      <h2 className="text-[20px] sm:text-[24px] font-medium tracking-[-0.02em] text-foreground mb-6">
        How it works
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4">
        {/* Pipeline card */}
        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/25 mb-5">
            Pipeline · 6 phases
          </p>

          {PHASES.map((phase, i) => {
            const Icon = phase.icon;
            return (
              <div
                key={phase.title}
                className={`flex items-start gap-3 py-3.5 ${
                  i < PHASES.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <Icon className="w-4 h-4 text-foreground/15 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[13px] font-medium text-foreground/75">{phase.title}</span>
                    <span className="text-[11px] text-foreground/20">{phase.sub}</span>
                  </div>
                  <p className="text-[12px] leading-[1.55] text-foreground/35">{phase.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scoring card */}
        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/25 mb-5">
            Scoring Formula
          </p>

          {/* Formula */}
          <div className="font-mono text-[12px] mb-6 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span className="text-foreground/60 font-medium">composite</span>
            <span className="text-foreground/30">=</span>
            {WEIGHTS.map((w, i) => (
              <span key={w.signal} className="whitespace-nowrap flex items-baseline gap-0.5">
                <span className="font-medium" style={{ color: w.color }}>{w.weight}</span>
                <span className="text-foreground/25">×</span>
                <span style={{ color: w.color }}>{w.signal.toLowerCase()}</span>
                {i < WEIGHTS.length - 1 && <span className="text-foreground/30 ml-1">+</span>}
              </span>
            ))}
          </div>

          {/* Stacked bar */}
          <div className="mb-6">
            <div className="flex h-2 rounded-full overflow-hidden mb-1.5">
              {WEIGHTS.map((w) => (
                <div key={w.signal} className="h-full" style={{ width: `${w.weight * 100}%`, background: w.color, opacity: 0.4 }} />
              ))}
            </div>
            <div className="flex">
              {WEIGHTS.map((w) => (
                <div key={w.signal} style={{ width: `${w.weight * 100}%` }}>
                  <span className="text-[9px] text-foreground/20">{w.signal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signal details */}
          <div className="space-y-3">
            {WEIGHTS.map((w) => (
              <div key={w.signal} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[5px]" style={{ background: w.color, opacity: 0.4 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-medium text-foreground/60">{w.signal}</span>
                    <span className="text-[11px] font-mono text-foreground/18 tabular-nums">{(w.weight * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[11px] text-foreground/25 leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
