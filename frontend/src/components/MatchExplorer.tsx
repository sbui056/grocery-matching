"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import MatchCard from "./MatchCard";
import type { Match } from "@/lib/types";

type ConfidenceFilter = "all" | "high" | "medium" | "low";
type SortKey = "mixed" | "composite" | "tfidf" | "embedding" | "brand";

const PAGE_SIZE = 6;

function interleave(matches: Match[]): Match[] {
  const high = matches.filter((m) => m.confidence === "high");
  const medium = matches.filter((m) => m.confidence === "medium");
  const low = matches.filter((m) => m.confidence === "low");

  const result: Match[] = [];
  let hi = 0, mi = 0, li = 0;

  while (hi < high.length || mi < medium.length || li < low.length) {
    if (mi < medium.length) result.push(medium[mi++]);
    if (hi < high.length) result.push(high[hi++]);
    if (hi < high.length) result.push(high[hi++]);
    if (li < low.length) result.push(low[li++]);
    if (hi < high.length) result.push(high[hi++]);
    if (mi < medium.length) result.push(medium[mi++]);
  }

  return result;
}

export default function MatchExplorer({ matches }: { matches: Match[] }) {
  const [search, setSearch] = useState("");
  const [confidence, setConfidence] = useState<ConfidenceFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("mixed");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    setVisibleCount(PAGE_SIZE);
    let result = [...matches];
    if (confidence !== "all") result = result.filter((m) => m.confidence === confidence);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) =>
        m.nameA.toLowerCase().includes(q) || m.nameB.toLowerCase().includes(q) ||
        m.brandA.toLowerCase().includes(q) || m.brandB.toLowerCase().includes(q)
      );
    }

    if (sortBy === "mixed") {
      result = interleave(result);
    } else {
      result.sort((a, b) => b[sortBy] - a[sortBy]);
    }

    return result;
  }, [matches, confidence, search, sortBy]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const confidenceButtons: { label: string; value: ConfidenceFilter }[] = [
    { label: "All", value: "all" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ];

  const sortOptions: { label: string; value: SortKey }[] = [
    { label: "Mixed", value: "mixed" },
    { label: "Composite", value: "composite" },
    { label: "TF-IDF", value: "tfidf" },
    { label: "Embedding", value: "embedding" },
    { label: "Brand", value: "brand" },
  ];

  return (
    <section className="px-6 sm:px-10 py-12 sm:py-16 max-w-[1100px] mx-auto" id="matches">
      <h2 className="text-[20px] sm:text-[24px] font-medium tracking-[-0.02em] text-foreground mb-2">
        Match Explorer
      </h2>
      <p className="text-[14px] text-foreground/35 mb-6">
        Browse sample matches across confidence levels.
      </p>

      {/* Search bar */}
      <div className="bg-background/80 backdrop-blur-md border border-border rounded-xl p-3 mb-5 sticky top-[56px] z-20 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20" />
            <input
              type="text"
              placeholder="Search products, brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-7 py-2 bg-surface rounded-lg border border-border text-[13px] text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/15 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground/40 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 flex items-center gap-1.5 ${
              showFilters ? "bg-foreground text-background" : "bg-surface border border-border text-foreground/35 hover:text-foreground/55"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <span className="shrink-0 text-[10px] text-foreground/20 font-mono tabular-nums">{filtered.length}</span>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-border/60 flex flex-col sm:flex-row gap-3">
            <div>
              <div className="text-[10px] text-foreground/25 uppercase tracking-wider mb-1.5 font-medium">Confidence</div>
              <div className="flex gap-1">
                {confidenceButtons.map((btn) => (
                  <button key={btn.value} onClick={() => setConfidence(btn.value)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                      confidence === btn.value ? "bg-foreground text-background" : "text-foreground/35 hover:bg-foreground/[0.03]"
                    }`}>{btn.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-foreground/25 uppercase tracking-wider mb-1.5 font-medium">Sort by</div>
              <div className="flex gap-1">
                {sortOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                      sortBy === opt.value ? "bg-foreground text-background" : "text-foreground/35 hover:bg-foreground/[0.03]"
                    }`}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {visible.map((match) => <MatchCard key={match.idA} match={match} />)}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-5 py-2 rounded-full text-[13px] text-foreground/35 hover:text-foreground/55 hover:bg-foreground/[0.03] transition-colors duration-150"
              >
                Show more · {filtered.length - visibleCount} remaining
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center text-[13px] text-foreground/25">No matches found.</div>
      )}
    </section>
  );
}
