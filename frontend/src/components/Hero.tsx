"use client";

import { ArrowRight } from "lucide-react";
import type { Summary, Match } from "@/lib/types";
import PipelineDiagram from "./PipelineDiagram";

export default function Hero({
  summary,
  matches,
}: {
  summary: Summary;
  matches: Match[];
}) {
  const example = matches.find(
    (m) =>
      m.brandA.toLowerCase() === "great value" &&
      m.brandB.toLowerCase() === "wegmans" &&
      m.confidence === "high"
  ) ?? matches[0];

  return (
    <section className="pt-24 sm:pt-28 pb-10 sm:pb-14">
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10">
        {/* Header — compact */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-[26px] sm:text-[34px] lg:text-[40px] font-medium tracking-[-0.025em] leading-[1.15] text-foreground max-w-2xl mb-3">
            Product matching across 233K Walmart and 55K Wegmans items
          </h1>

          <p className="text-[15px] text-foreground/40 max-w-lg mb-4">
            Hybrid TF-IDF + embedding + LLM pipeline producing 24,370 verified matches for competitive price indexing.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <span className="font-mono text-foreground/50">24,370 matches</span>
            <span className="text-foreground/15">·</span>
            <span className="font-mono text-foreground/50">83% high confidence</span>
            <span className="text-foreground/15">·</span>
            <span className="font-mono text-foreground/50">~80 min runtime</span>
            <span className="text-foreground/15">·</span>
            <span className="font-mono text-foreground/50">6 phases</span>
          </div>
        </div>

        {/* Pipeline diagram — full width, prominent */}
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 mb-4">
          <PipelineDiagram />
        </div>

        {/* Example match — full width, smaller supporting card */}
        {example && (
          <div className="bg-surface border border-border rounded-xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/25">
                Example Match
              </p>
              <span className="text-[10px] font-mono text-success/70 bg-success/8 px-1.5 py-0.5 rounded">
                {(example.composite * 100).toFixed(0)}% composite
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
              {/* Match pair */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-accent/50 mb-1 block">
                    Walmart
                  </span>
                  <p className="text-[13px] text-foreground/75 leading-snug mb-1.5">
                    {example.nameA}
                  </p>
                  <div className="flex gap-1.5">
                    {example.brandA && (
                      <span className="text-[10px] text-foreground/30 bg-muted px-1.5 py-0.5 rounded">{example.brandA}</span>
                    )}
                    {example.sizeA && (
                      <span className="text-[10px] text-foreground/20 bg-muted px-1.5 py-0.5 rounded">{example.sizeA}</span>
                    )}
                  </div>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-foreground/12 shrink-0 mt-3" />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-success/50 mb-1 block">
                    Wegmans
                  </span>
                  <p className="text-[13px] text-foreground/75 leading-snug mb-1.5">
                    {example.nameB}
                  </p>
                  <div className="flex gap-1.5">
                    {example.brandB && (
                      <span className="text-[10px] text-foreground/30 bg-muted px-1.5 py-0.5 rounded">{example.brandB}</span>
                    )}
                    {example.sizeB && (
                      <span className="text-[10px] text-foreground/20 bg-muted px-1.5 py-0.5 rounded">{example.sizeB}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Signal scores */}
              <div className="flex sm:flex-col gap-4 sm:gap-2 sm:border-l sm:border-border sm:pl-6 shrink-0">
                {[
                  { label: "TF-IDF", val: example.tfidf },
                  { label: "Embed", val: example.embedding },
                  { label: "Brand", val: example.brand },
                  { label: "Size", val: example.size },
                  { label: "Jaccard", val: example.jaccard },
                ].map((s) => (
                  <div key={s.label} className="flex items-baseline gap-2 sm:gap-3">
                    <span className="text-[10px] text-foreground/20 w-10 sm:text-right">{s.label}</span>
                    <span className="text-[12px] font-mono text-foreground/45 tabular-nums">{(s.val * 100).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
