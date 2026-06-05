"use client";

const PHASES = [
  { n: "01", name: "Pre-process", desc: "Normalize names, then extract brand and size from raw text — lifting brand coverage 54%→80% and size 17%→57%." },
  { n: "02", name: "Block", desc: "Map every product into 12 compatible category groups, cutting 9.4B possible comparisons down to 4.1B." },
  { n: "03", name: "Candidates", desc: "TF-IDF bigrams catch literal matches; OpenAI embeddings catch semantic ones. Union of the top-20 from each." },
  { n: "04", name: "Score", desc: "Five weighted signals collapse into a single composite score for every surviving candidate pair." },
  { n: "05", name: "LLM", desc: "An LLM verifies each candidate — five products per call, JSON-mode, with checkpoint/resume for fault tolerance." },
  { n: "06", name: "Output", desc: "24,370 verified matches, each tagged with a confidence level and a full breakdown of its diagnostic scores." },
];

const SIGNALS = [
  { key: "TF-IDF", w: 0.25, color: "#2b46e0", desc: "Lexical overlap via bigram vectors" },
  { key: "Embedding", w: 0.25, color: "#5b73ee", desc: "Semantic similarity, OpenAI vectors" },
  { key: "Brand", w: 0.25, color: "#2d8a56", desc: "Exact, private-label, or fuzzy match" },
  { key: "Size", w: 0.15, color: "#bd7a1c", desc: "Unit-normalized quantity comparison" },
  { key: "Jaccard", w: 0.10, color: "#0e8a9b", desc: "Word-level set overlap" },
];

export default function MethodologySection() {
  return (
    <section className="sec" id="methodology">
      <div className="wrap">
        <div className="sec-head" data-reveal>
          <h2 className="h2">How the pipeline works</h2>
        </div>
        <div className="mth-grid">
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ghost)", marginBottom: 8 }}>
              The six stages
            </div>
            {PHASES.map((p, i) => (
              <div
                key={p.n}
                data-reveal
                style={{
                  transitionDelay: i * 55 + "ms",
                  display: "grid",
                  gridTemplateColumns: "42px 1fr",
                  gap: 16,
                  padding: "18px 0",
                  borderTop: i > 0 ? "1px solid var(--hair)" : "none",
                  paddingTop: i === 0 ? 6 : 18,
                }}
              >
                <div className="mono" style={{ fontSize: 13, color: "var(--accent)", paddingTop: 2 }}>
                  {p.n}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-.01em", marginBottom: 5 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--muted)" }}>
                    {p.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 26 }} data-reveal>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ghost)", marginBottom: 8 }}>
              Composite scoring
            </div>

            {/* Formula */}
            <div
              className="mono"
              style={{
                fontSize: 12.5,
                lineHeight: 1.9,
                margin: "14px 0 22px",
                background: "var(--bg)",
                border: "1px solid var(--hair)",
                borderRadius: 9,
                padding: "14px 16px",
              }}
            >
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>composite</span>{" "}
              <span style={{ color: "var(--ghost)" }}>=</span>
              <br />
              {SIGNALS.map((s, i) => (
                <span key={s.key}>
                  <span style={{ color: s.color, fontWeight: 600 }}>{s.w.toFixed(2)}</span>
                  <span style={{ color: "var(--ghost)" }}>·</span>
                  <span style={{ color: s.color }}>{s.key.toLowerCase()}</span>
                  {i < SIGNALS.length - 1 && (
                    <span style={{ color: "var(--ghost)" }}>{"  +  "}</span>
                  )}
                </span>
              ))}
            </div>

            {/* Weight bar */}
            <div style={{ display: "flex", height: 8, borderRadius: 5, overflow: "hidden", marginBottom: 5 }}>
              {SIGNALS.map((s, i) => (
                <i
                  key={s.key}
                  className="grow-x"
                  style={{
                    display: "block",
                    width: s.w * 100 + "%",
                    background: s.color,
                    opacity: 0.85,
                    transitionDelay: i * 70 + "ms",
                  }}
                />
              ))}
            </div>
            <div className="mono" style={{ display: "flex", fontSize: 9, color: "var(--ghost)", marginBottom: 22 }}>
              {SIGNALS.map((s) => (
                <span key={s.key} style={{ width: s.w * 100 + "%" }}>
                  {s.w * 100}%
                </span>
              ))}
            </div>

            {/* Signal rows */}
            {SIGNALS.map((s) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                  padding: "11px 0",
                  borderTop: "1px solid var(--hair)",
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: 3, marginTop: 4, flexShrink: 0, background: s.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.key}</div>
                  <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 2 }}>{s.desc}</div>
                </div>
                <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                  {s.w.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mth-grid { display: grid; grid-template-columns: 1.08fr 1fr; gap: 48px; align-items: start; }
        @media (max-width: 900px) { .mth-grid { grid-template-columns: 1fr; gap: 36px; } }
      `}</style>
    </section>
  );
}
