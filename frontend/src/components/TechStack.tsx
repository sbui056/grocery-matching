"use client";

const DECISIONS = [
  { title: "Dual retrieval", desc: "TF-IDF for lexical matching, embeddings for semantic — the union captures both." },
  { title: "LLM as verifier", desc: "Verify pre-filtered candidates instead of searching 55K products. ~15K calls, not millions." },
  { title: "Private-label cross-matching", desc: "Great Value ↔ Wegmans get a 0.7 brand score, surfacing when name/size/category align." },
  { title: "Checkpoint / resume", desc: "Embeddings to .npy, LLM results to JSONL. Crashed runs resume from last checkpoint." },
  { title: "Category blocking", desc: "Frozen ↔ Frozen, not Frozen ↔ Wine. 60% search space reduction while maintaining recall." },
];

const TECH = ["Python", "OpenAI API", "scikit-learn", "NumPy", "pandas", "asyncio", "httpx", "rapidfuzz"];

export default function TechStack() {
  return (
    <section className="px-6 sm:px-10 py-12 sm:py-16 max-w-[1100px] mx-auto" id="design">
      <h2 className="text-[20px] sm:text-[24px] font-medium tracking-[-0.02em] text-foreground mb-6">
        Design Decisions
      </h2>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {DECISIONS.map((d, i) => (
          <div
            key={d.title}
            className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-5 sm:px-6 py-4 border-b border-border/40"
          >
            <h3 className="text-[13px] font-medium text-foreground/60 sm:w-52 shrink-0">
              {d.title}
            </h3>
            <p className="text-[13px] leading-[1.55] text-foreground/35">
              {d.desc}
            </p>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-5 sm:px-6 py-4">
          <span className="text-[13px] font-medium text-foreground/60 sm:w-52 shrink-0">
            Stack
          </span>
          <div className="flex flex-wrap gap-2">
            {TECH.map((t) => (
              <span
                key={t}
                className="text-[12px] text-foreground/40 bg-foreground/[0.03] px-2 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
