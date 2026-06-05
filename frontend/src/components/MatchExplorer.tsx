"use client";

import { useState, useMemo, useEffect } from "react";
import MatchCard from "./MatchCard";
import type { Match } from "@/lib/types";

const PAGE = 6;
const SORTS = [
  { k: "mixed", label: "Mixed" },
  { k: "composite", label: "Composite" },
  { k: "tfidf", label: "TF-IDF" },
  { k: "embedding", label: "Embedding" },
  { k: "brand", label: "Brand" },
] as const;
const CONFS = ["all", "high", "medium", "low"] as const;
type Conf = (typeof CONFS)[number];
type SortKey = (typeof SORTS)[number]["k"];

function interleave(list: Match[]): Match[] {
  const by: Record<string, Match[]> = { high: [], medium: [], low: [] };
  list.forEach((m) => by[m.confidence].push(m));
  Object.values(by).forEach((a) => a.sort((x, y) => y.composite - x.composite));
  const out: Match[] = [];
  let hi = 0, mi = 0, li = 0;
  const pat = ["medium", "high", "high", "low", "high", "medium", "high"];
  let p = 0;
  while (hi < by.high.length || mi < by.medium.length || li < by.low.length) {
    const c = pat[p++ % pat.length];
    if (c === "high" && hi < by.high.length) { out.push(by.high[hi++]); continue; }
    if (c === "medium" && mi < by.medium.length) { out.push(by.medium[mi++]); continue; }
    if (c === "low" && li < by.low.length) { out.push(by.low[li++]); continue; }
    if (hi < by.high.length) out.push(by.high[hi++]);
    else if (mi < by.medium.length) out.push(by.medium[mi++]);
    else if (li < by.low.length) out.push(by.low[li++]);
  }
  return out;
}

export default function MatchExplorer({ matches }: { matches: Match[] }) {
  const [q, setQ] = useState("");
  const [conf, setConf] = useState<Conf>("all");
  const [sort, setSort] = useState<SortKey>("mixed");
  const [count, setCount] = useState(PAGE);

  const filtered = useMemo(() => {
    let r = matches.slice();
    if (conf !== "all") r = r.filter((m) => m.confidence === conf);
    const s = q.trim().toLowerCase();
    if (s)
      r = r.filter(
        (m) =>
          m.nameA.toLowerCase().includes(s) ||
          m.nameB.toLowerCase().includes(s) ||
          (m.brandA || "").toLowerCase().includes(s) ||
          (m.brandB || "").toLowerCase().includes(s)
      );
    if (sort === "mixed") return interleave(r);
    r.sort((a, b) => (b[sort as keyof Match] as number) - (a[sort as keyof Match] as number));
    return r;
  }, [matches, q, conf, sort]);

  useEffect(() => { setCount(PAGE); }, [q, conf, sort]);
  const shown = filtered.slice(0, count);

  return (
    <section className="sec" id="matches">
      <div className="wrap">
        <div className="sec-head" data-reveal>
          <h2 className="h2">Browse the matches</h2>
        </div>

        <div className="exp-controls">
          <div className="exp-search">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10 10 L13 13" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products or brands…" />
          </div>
          <div className="exp-group">
            {CONFS.map((c) => (
              <button key={c} className={conf === c ? "on" : ""} onClick={() => setConf(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="exp-group">
            {SORTS.map((s) => (
              <button key={s.k} className={sort === s.k ? "on" : ""} onClick={() => setSort(s.k)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="exp-meta-line">
          <span>{filtered.length} results</span>
          <span>·</span>
          <span>{sort === "mixed" ? "natural mix" : "sorted by " + sort}</span>
        </div>

        {filtered.length > 0 ? (
          <>
            <div className="exp-grid">
              {shown.map((m) => (
                <MatchCard key={m.idA + "-" + m.idB} m={m} />
              ))}
            </div>
            {count < filtered.length && (
              <div className="exp-more">
                <button onClick={() => setCount((c) => c + PAGE)}>
                  Show more — {filtered.length - count} remaining
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="exp-empty">No matches for &ldquo;{q}&rdquo;.</div>
        )}
      </div>

      <style jsx>{`
        .exp-controls { display: flex; gap: 10px; align-items: center; margin-bottom: 22px; flex-wrap: wrap; }
        .exp-search { position: relative; flex: 1; min-width: 220px; }
        .exp-search svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--ghost); }
        .exp-search input { width: 100%; padding: 11px 14px 11px 36px; border: 1px solid var(--border); border-radius: 10px;
          background: var(--surface); font-family: var(--display); font-size: 13.5px; color: var(--ink); outline: none; transition: border .15s; }
        .exp-search input::placeholder { color: var(--ghost); }
        .exp-search input:focus { border-color: rgba(43,70,224,.45); }
        .exp-group { display: flex; gap: 3px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 3px; }
        .exp-group button { border: none; background: none; font-family: var(--display); font-size: 12.5px; color: var(--faint);
          padding: 7px 12px; border-radius: 7px; cursor: pointer; transition: all .14s; text-transform: capitalize; white-space: nowrap; }
        .exp-group button:hover { color: var(--ink); }
        .exp-group button.on { background: var(--ink); color: var(--bg); }
        .exp-meta-line { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; font-family: var(--mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--ghost); }

        .exp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 860px) { .exp-grid { grid-template-columns: 1fr; } }
        :global(.exp-card) { background: var(--surface); border: 1px solid var(--border); border-radius: 13px; padding: 17px 18px; transition: box-shadow .2s, border-color .2s; }
        :global(.exp-card:hover) { box-shadow: 0 3px 14px rgba(22,23,27,.05); }
        :global(.exp-card.open) { border-color: rgba(43,70,224,.3); }
        :global(.exp-top) { display: flex; align-items: center; gap: 9px; margin-bottom: 13px; }
        :global(.exp-badge) { font-family: var(--mono); font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; padding: 3px 8px; border-radius: 5px; }
        :global(.exp-comp) { font-family: var(--mono); font-size: 11px; color: var(--ghost); }
        :global(.exp-exp) { margin-left: auto; border: none; background: none; color: var(--ghost); cursor: pointer; padding: 3px; border-radius: 6px; display: flex; }
        :global(.exp-exp:hover) { color: var(--muted); background: rgba(22,23,27,.04); }
        :global(.exp-pair) { display: flex; align-items: flex-start; gap: 12px; }
        :global(.exp-side) { flex: 1; min-width: 0; }
        :global(.exp-store) { font-family: var(--mono); font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; display: block; margin-bottom: 6px; }
        :global(.exp-store.a) { color: rgba(43,70,224,.6); }
        :global(.exp-store.b) { color: rgba(45,138,86,.65); }
        :global(.exp-name) { font-size: 13px; line-height: 1.4; color: var(--ink); margin: 0 0 8px; font-weight: 500; }
        :global(.exp-chips) { display: flex; flex-wrap: wrap; gap: 5px; }
        :global(.exp-chip) { font-family: var(--mono); font-size: 9.5px; color: var(--faint); background: var(--bg); border: 1px solid var(--hair); padding: 2px 7px; border-radius: 5px; }
        :global(.exp-arrow) { color: var(--ghost); flex-shrink: 0; margin-top: 18px; }
        :global(.exp-detail) { margin-top: 14px; padding-top: 13px; border-top: 1px solid var(--hair); }
        :global(.exp-bar) { display: grid; grid-template-columns: 54px 1fr 26px; align-items: center; gap: 10px; padding: 3px 0; }
        :global(.exp-bar .bl) { font-size: 11px; color: var(--faint); }
        :global(.exp-bar .bt) { height: 6px; border-radius: 4px; background: rgba(22,23,27,.05); overflow: hidden; }
        :global(.exp-bar .bf) { height: 100%; border-radius: 4px; }
        :global(.exp-bar .bv) { font-family: var(--mono); font-size: 10px; color: var(--ghost); text-align: right; }
        :global(.exp-ids) { display: flex; justify-content: space-between; margin-top: 9px; font-family: var(--mono); font-size: 9.5px; color: var(--ghost); }
        .exp-more { display: flex; justify-content: center; margin-top: 26px; }
        .exp-more button { font-family: var(--display); font-size: 13px; color: var(--muted); background: none; border: 1px solid var(--border);
          border-radius: 999px; padding: 9px 20px; cursor: pointer; transition: all .15s; }
        .exp-more button:hover { color: var(--ink); border-color: var(--ghost); }
        .exp-empty { padding: 48px 0; text-align: center; color: var(--ghost); font-size: 13px; }
      `}</style>
    </section>
  );
}
