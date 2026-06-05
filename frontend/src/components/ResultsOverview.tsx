"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import type { Summary } from "@/lib/types";

export default function ResultsOverview({ summary }: { summary: Summary }) {
  const radarData = Object.entries(summary.signalAverages).map(([signal, avg]) => ({
    signal, value: Math.round(avg * 100), fullMark: 100,
  }));

  return (
    <section className="px-6 sm:px-10 py-16 sm:py-24 max-w-[1100px] mx-auto" id="results">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/25 mb-3">
        Results
      </p>
      <h2 className="font-display text-[28px] sm:text-[36px] tracking-[-0.015em] text-foreground mb-12">
        Analytics
      </h2>

      {/* Confidence stats */}
      <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4 mb-14">
        <div>
          <span className="font-display text-[32px] sm:text-[38px] tracking-tight text-success">
            {summary.confidence.high.toLocaleString()}
          </span>
          <span className="text-[14px] text-foreground/30 ml-2">high confidence</span>
        </div>
        <div>
          <span className="font-display text-[32px] sm:text-[38px] tracking-tight text-warning">
            {summary.confidence.medium.toLocaleString()}
          </span>
          <span className="text-[14px] text-foreground/30 ml-2">medium</span>
        </div>
        <div>
          <span className="font-display text-[32px] sm:text-[38px] tracking-tight text-danger">
            {summary.confidence.low.toLocaleString()}
          </span>
          <span className="text-[14px] text-foreground/30 ml-2">low</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 mb-10">
        <div className="bg-surface rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-6">
          <h3 className="text-[14px] font-medium text-foreground/70 mb-1">Score Distribution</h3>
          <p className="text-[12px] text-foreground/30 mb-5">Composite score across all matches</p>
          <div className="h-[340px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.scoreDistribution} barCategoryGap="16%">
                <XAxis dataKey="range" tick={{ fill: "rgba(26,26,26,0.25)", fontSize: 11 }} axisLine={{ stroke: "rgba(26,26,26,0.06)" }} tickLine={false} />
                <YAxis tick={{ fill: "rgba(26,26,26,0.25)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: "10px", fontSize: "13px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }} cursor={{ fill: "rgba(59,92,204,0.03)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#3b5ccc" fillOpacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-6">
          <h3 className="text-[14px] font-medium text-foreground/70 mb-1">Signal Contributions</h3>
          <p className="text-[12px] text-foreground/30 mb-5">Average score per signal (%)</p>
          <div className="h-[340px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="rgba(26,26,26,0.06)" />
                <PolarAngleAxis dataKey="signal" tick={{ fill: "rgba(26,26,26,0.35)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} tick={{ fill: "rgba(26,26,26,0.15)", fontSize: 10 }} domain={[0, 100]} tickCount={5} />
                <Radar dataKey="value" stroke="#3b5ccc" fill="#3b5ccc" fillOpacity={0.08} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Inline stats */}
      <div className="flex flex-wrap gap-x-10 gap-y-3 text-[13px]">
        <span><span className="text-foreground/30">Median</span>{" "}<span className="font-mono text-foreground/50">{summary.scoreStats.median.toFixed(3)}</span></span>
        <span><span className="text-foreground/30">IQR</span>{" "}<span className="font-mono text-foreground/50">{summary.scoreStats.p25.toFixed(2)}–{summary.scoreStats.p75.toFixed(2)}</span></span>
        <span><span className="text-foreground/30">Private label</span>{" "}<span className="font-mono text-foreground/50">{summary.privateLabelMatches.toLocaleString()}</span></span>
      </div>
    </section>
  );
}
