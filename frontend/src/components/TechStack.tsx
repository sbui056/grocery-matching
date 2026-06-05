"use client";

const DECISIONS = [
  { t: "Dual retrieval", d: "TF-IDF nails literal name overlap; embeddings catch semantic equivalents. Running both and taking the union means neither blind spot costs a match." },
  { t: "LLM as verifier, not generator", d: "The model judges pre-filtered candidates instead of searching all 55K products — bounding cost at ~15K calls rather than hundreds of millions." },
  { t: "Private-label cross-matching", d: "Great Value ↔ Wegmans store brands get a 0.7 brand score instead of zero, so private-label equivalents surface when name, size, and category line up." },
  { t: "Checkpoint & resume", d: "Embeddings cache to .npy, LLM verdicts to JSONL. A crashed 80-minute run picks up where it left off instead of starting over." },
  { t: "Category blocking", d: "Comparisons stay within compatible categories — Frozen to Frozen, never Frozen to Wine — cutting the search space 60% while holding recall." },
];

const STACK = ["Python", "OpenAI API", "scikit-learn", "NumPy", "pandas", "asyncio", "httpx", "rapidfuzz"];

export default function TechStack() {
  return (
    <section className="sec" id="design">
      <div className="wrap">
        <div className="sec-head" data-reveal>
          <h2 className="h2">Decisions &amp; tradeoffs</h2>
        </div>
        <div className="dec-list">
          {DECISIONS.map((d, i) => (
            <div className="dec-row" key={d.t} data-reveal style={{ transitionDelay: i * 45 + "ms" }}>
              <div className="dt">{d.t}</div>
              <div className="dd">{d.d}</div>
            </div>
          ))}
        </div>
        <div className="dec-stack" data-reveal>
          <div className="sl">Built with</div>
          <div className="dec-chips">
            {STACK.map((s) => (
              <span className="dec-chip" key={s}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .dec-list { border-top: 1px solid var(--hair); }
        .dec-row { display: grid; grid-template-columns: 240px 1fr; gap: 32px; padding: 22px 0; border-bottom: 1px solid var(--hair); align-items: baseline; }
        @media (max-width: 760px) { .dec-row { grid-template-columns: 1fr; gap: 8px; padding: 18px 0; } }
        .dec-row .dt { font-weight: 600; font-size: 16px; letter-spacing: -.01em; }
        .dec-row .dd { font-size: 14px; line-height: 1.6; color: var(--muted); max-width: 640px; }
        .dec-stack { margin-top: 38px; display: grid; grid-template-columns: 240px 1fr; gap: 32px; align-items: baseline; }
        @media (max-width: 760px) { .dec-stack { grid-template-columns: 1fr; gap: 14px; } }
        .dec-stack .sl { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--ghost); }
        .dec-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .dec-chip { font-family: var(--mono); font-size: 12px; color: var(--muted); background: var(--surface);
          border: 1px solid var(--border); padding: 6px 11px; border-radius: 8px; white-space: nowrap;
          transition: transform .16s ease, border-color .16s ease, color .16s ease; }
        .dec-chip:hover { transform: translateY(-1px); border-color: rgba(22,23,27,.26); color: var(--ink); }
      `}</style>
    </section>
  );
}
