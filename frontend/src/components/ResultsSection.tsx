"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { ArrowRight } from "lucide-react";
import type { Summary } from "@/lib/types";

export default function ResultsSection({ summary }: { summary: Summary }) {
  const radarData = Object.entries(summary.signalAverages).map(([signal, avg]) => ({
    signal, value: Math.round(avg * 100), fullMark: 100,
  }));

  const maxBrand = Math.max(...summary.topBrandPairs.map((bp) => bp.count));

  const confCards = [
    { label: "High Confidence", value: summary.confidence.high, pct: Math.round((summary.confidence.high / summary.totalMatches) * 100), color: "#2d8a56" },
    { label: "Medium", value: summary.confidence.medium, pct: Math.round((summary.confidence.medium / summary.totalMatches) * 100), color: "#c47d1a" },
    { label: "Low", value: summary.confidence.low, pct: Math.round((summary.confidence.low / summary.totalMatches) * 100), color: "#c43d3d" },
  ];

  return (
    <section className="px-6 sm:px-10 py-12 sm:py-16 max-w-[1100px] mx-auto" id="results">
      <h2 className="text-[20px] sm:text-[24px] font-medium tracking-[-0.02em] text-foreground mb-6">
        Results
      </h2>

      {/* Bento grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Row 1: Confidence stats */}
        {confCards.map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded-xl p-4">
            <div className="text-[11px] text-foreground/25 mb-2">{c.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-medium tracking-tight" style={{ color: c.color }}>
                {c.value.toLocaleString()}
              </span>
              <span className="text-[12px] font-mono text-foreground/20">{c.pct}%</span>
            </div>
          </div>
        ))}

        {/* Row 2: Score distribution (wider) + Brand pairs (narrower) */}
        <div className="sm:col-span-2 bg-surface border border-border rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-[13px] font-medium text-foreground/60">Score Distribution</span>
            <span className="text-[11px] text-foreground/20">composite score across all matches</span>
          </div>
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.scoreDistribution} barCategoryGap="16%">
                <XAxis dataKey="range" tick={{ fill: "rgba(26,26,26,0.2)", fontSize: 10 }} axisLine={{ stroke: "rgba(26,26,26,0.05)" }} tickLine={false} />
                <YAxis tick={{ fill: "rgba(26,26,26,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }} cursor={{ fill: "rgba(59,92,204,0.03)" }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} fill="#3b5ccc" fillOpacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 overflow-hidden">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-[13px] font-medium text-foreground/60">Top Brand Pairs</span>
            <span className="text-[11px] text-foreground/20">{summary.privateLabelMatches} PL</span>
          </div>
          <div className="space-y-1">
            {summary.topBrandPairs.slice(0, 8).map((bp) => {
              const barW = Math.round((bp.count / maxBrand) * 100);
              return (
                <div key={`${bp.brandA}-${bp.brandB}`} className="flex items-center gap-2 py-1">
                  <div className="w-28 flex items-center gap-1 min-w-0 shrink-0">
                    <span className="text-[11px] text-foreground/50 capitalize truncate">{bp.brandA}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-foreground/12 shrink-0" />
                    <span className="text-[11px] text-foreground/50 capitalize truncate">{bp.brandB}</span>
                  </div>
                  <div className="flex-1 h-1 rounded-full bg-foreground/[0.03] overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${barW}%`, opacity: 0.3 }} />
                  </div>
                  <span className="text-[10px] font-mono text-foreground/20 tabular-nums w-6 text-right shrink-0">{bp.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: Radar chart + Stats */}
        <div className="sm:col-span-2 bg-surface border border-border rounded-xl p-5">
          <span className="text-[13px] font-medium text-foreground/60">Signal Contributions</span>
          <span className="text-[11px] text-foreground/20 ml-3">average score per signal (%)</span>
          <div className="h-[280px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="68%">
                <PolarGrid stroke="rgba(26,26,26,0.05)" />
                <PolarAngleAxis dataKey="signal" tick={{ fill: "rgba(26,26,26,0.3)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} tick={{ fill: "rgba(26,26,26,0.12)", fontSize: 9 }} domain={[0, 100]} tickCount={5} />
                <Radar dataKey="value" stroke="#3b5ccc" fill="#3b5ccc" fillOpacity={0.07} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[13px] font-medium text-foreground/60">Score Stats</span>
            <div className="mt-4 space-y-3">
              {[
                { label: "Median", value: summary.scoreStats.median.toFixed(3) },
                { label: "IQR", value: `${summary.scoreStats.p25.toFixed(2)} – ${summary.scoreStats.p75.toFixed(2)}` },
                { label: "Range", value: `${summary.scoreStats.min.toFixed(2)} – ${summary.scoreStats.max.toFixed(2)}` },
                { label: "Private Label", value: summary.privateLabelMatches.toLocaleString() },
                { label: "Total Matches", value: summary.totalMatches.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="flex items-baseline justify-between">
                  <span className="text-[12px] text-foreground/30">{s.label}</span>
                  <span className="text-[13px] font-mono text-foreground/50 tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
