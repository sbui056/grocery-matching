"use client";

import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { Match } from "@/lib/types";

function confidenceBadge(confidence: string) {
  const styles: Record<string, string> = {
    high: "bg-success/8 text-success",
    medium: "bg-warning/8 text-warning",
    low: "bg-danger/8 text-danger",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${styles[confidence] ?? styles.low}`}>
      {confidence}
    </span>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-foreground/30 w-12 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-foreground/[0.03] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color, opacity: 0.4 }} />
      </div>
      <span className="text-[10px] text-foreground/25 w-8 font-mono tabular-nums">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

function formatName(name: string) {
  return name.length > 60 ? name.slice(0, 57) + "..." : name;
}

export default function MatchCard({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-200">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {confidenceBadge(match.confidence)}
            <span className="text-[10px] text-foreground/20 font-mono tabular-nums">
              {(match.composite * 100).toFixed(1)}%
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-foreground/[0.03] transition-colors duration-150 text-foreground/20"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent/50 mb-1 block">
              Walmart
            </span>
            <p className="text-[13px] font-medium leading-snug text-foreground/80">
              {formatName(match.nameA)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {match.brandA && (
                <span className="text-[10px] text-foreground/30 bg-muted px-1.5 py-0.5 rounded">{match.brandA}</span>
              )}
              {match.sizeA && (
                <span className="text-[10px] text-foreground/20 bg-muted px-1.5 py-0.5 rounded">{match.sizeA}</span>
              )}
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-foreground/10 shrink-0 mt-4" />

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-success/50 mb-1 block">
              Wegmans
            </span>
            <p className="text-[13px] font-medium leading-snug text-foreground/80">
              {formatName(match.nameB)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {match.brandB && (
                <span className="text-[10px] text-foreground/30 bg-muted px-1.5 py-0.5 rounded">{match.brandB}</span>
              )}
              {match.sizeB && (
                <span className="text-[10px] text-foreground/20 bg-muted px-1.5 py-0.5 rounded">{match.sizeB}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/60 px-4 sm:px-5 py-3.5">
          <div className="space-y-1.5">
            <ScoreBar label="TF-IDF" value={match.tfidf} color="#3b5ccc" />
            <ScoreBar label="Embed" value={match.embedding} color="#6c5ce7" />
            <ScoreBar label="Brand" value={match.brand} color="#2d8a56" />
            <ScoreBar label="Size" value={match.size} color="#c47d1a" />
            <ScoreBar label="Jaccard" value={match.jaccard} color="#0891B2" />
          </div>
          <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-foreground/20 font-mono">
            <span>{match.idA} → {match.idB}</span>
            <span>{(match.composite * 100).toFixed(2)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
