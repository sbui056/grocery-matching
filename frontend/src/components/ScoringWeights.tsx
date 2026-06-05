"use client";

const WEIGHTS = [
  { signal: "TF-IDF Cosine", weight: 0.25, description: "Bigram vectorization captures lexical surface-level similarity.", color: "#3b5ccc" },
  { signal: "Embedding Cosine", weight: 0.25, description: "OpenAI text-embedding-3-small for semantic meaning.", color: "#6c5ce7" },
  { signal: "Brand Match", weight: 0.25, description: "Exact (1.0), private-label cross-match (0.7), fuzzy (0.8+).", color: "#2d8a56" },
  { signal: "Size Match", weight: 0.15, description: "Unit-normalized comparison with formatting tolerance.", color: "#c47d1a" },
  { signal: "Name Jaccard", weight: 0.10, description: "Word-level set overlap complements TF-IDF.", color: "#0891B2" },
];

export default function ScoringWeightsSection() {
  return (
    <section className="px-6 sm:px-10 py-16 sm:py-20 max-w-[1100px] mx-auto" id="scoring">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/25 mb-3">
        Methodology
      </p>
      <h2 className="font-display text-[28px] sm:text-[36px] tracking-[-0.015em] text-foreground mb-8">
        Scoring Formula
      </h2>

      {/* Inline formula */}
      <p className="font-mono text-[13px] text-foreground/40 mb-10 leading-relaxed">
        <span className="text-foreground/70 font-medium">composite</span>
        <span className="text-foreground/15"> = </span>
        <span style={{ color: "#3b5ccc" }}>0.25</span><span className="text-foreground/12">·</span><span style={{ color: "#3b5ccc" }}>tfidf</span>
        <span className="text-foreground/10"> + </span>
        <span style={{ color: "#6c5ce7" }}>0.25</span><span className="text-foreground/12">·</span><span style={{ color: "#6c5ce7" }}>embed</span>
        <span className="text-foreground/10"> + </span>
        <span style={{ color: "#2d8a56" }}>0.25</span><span className="text-foreground/12">·</span><span style={{ color: "#2d8a56" }}>brand</span>
        <span className="text-foreground/10"> + </span>
        <span style={{ color: "#c47d1a" }}>0.15</span><span className="text-foreground/12">·</span><span style={{ color: "#c47d1a" }}>size</span>
        <span className="text-foreground/10"> + </span>
        <span style={{ color: "#0891B2" }}>0.10</span><span className="text-foreground/12">·</span><span style={{ color: "#0891B2" }}>jaccard</span>
      </p>

      {/* Stacked weight bar */}
      <div className="mb-10">
        <div className="flex h-2 rounded-full overflow-hidden">
          {WEIGHTS.map((w) => (
            <div
              key={w.signal}
              className="h-full"
              style={{ width: `${w.weight * 100}%`, background: w.color, opacity: 0.45 }}
            />
          ))}
        </div>
        <div className="flex mt-2">
          {WEIGHTS.map((w) => (
            <div key={w.signal} style={{ width: `${w.weight * 100}%` }}>
              <span className="text-[10px] text-foreground/25">{w.signal.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signal details */}
      <div className="space-y-4">
        {WEIGHTS.map((w) => (
          <div key={w.signal} className="flex items-baseline gap-3">
            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ background: w.color, opacity: 0.4 }} />
            <div className="flex-1 min-w-0">
              <span className="text-[14px] font-medium text-foreground/70">{w.signal}</span>
              <span className="text-[14px] text-foreground/30 ml-2">{w.description}</span>
            </div>
            <span className="shrink-0 text-[12px] font-mono text-foreground/20 tabular-nums">{(w.weight * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
