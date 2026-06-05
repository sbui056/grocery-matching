"use client";

import { ArrowRight } from "lucide-react";
import type { BrandPair } from "@/lib/types";

export default function BrandPairsSection({
  brandPairs,
  privateLabelCount,
}: {
  brandPairs: BrandPair[];
  privateLabelCount: number;
}) {
  const maxCount = Math.max(...brandPairs.map((bp) => bp.count));

  return (
    <section className="px-6 sm:px-10 py-12 sm:py-16 max-w-[1100px] mx-auto" id="brands">
      <h2 className="font-display text-[28px] sm:text-[36px] tracking-[-0.015em] text-foreground mb-1">
        Top Brand Pairs
      </h2>
      <p className="text-[14px] text-foreground/30 mb-10">
        Including {privateLabelCount} private-label cross-matches
      </p>

      <div className="space-y-0.5">
        {brandPairs.map((bp) => {
          const isPrivateLabel =
            (bp.brandA === "great value" && bp.brandB === "wegmans") ||
            (bp.brandA === "equate" && bp.brandB === "wegmans");
          const barWidth = Math.round((bp.count / maxCount) * 100);

          return (
            <div
              key={`${bp.brandA}-${bp.brandB}`}
              className="flex items-center gap-4 sm:gap-5 py-2.5"
            >
              <div className="shrink-0 w-44 sm:w-52 flex items-center gap-1.5 min-w-0">
                <span className="text-[14px] font-medium text-foreground/60 capitalize truncate">
                  {bp.brandA}
                </span>
                <ArrowRight className="w-3 h-3 text-foreground/15 shrink-0" />
                <span className="text-[14px] font-medium text-foreground/60 capitalize truncate">
                  {bp.brandB}
                </span>
              </div>

              {isPrivateLabel && (
                <span className="hidden sm:inline text-[10px] font-medium text-foreground/20 uppercase tracking-wide shrink-0">
                  PL
                </span>
              )}

              <div className="flex-1 h-1 rounded-full bg-foreground/[0.03] overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${barWidth}%`, opacity: 0.3 }}
                />
              </div>

              <span className="shrink-0 text-[12px] font-mono text-foreground/25 tabular-nums w-8 text-right">
                {bp.count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
