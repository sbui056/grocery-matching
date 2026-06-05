"use client";

import type { Summary } from "@/lib/types";
import CountUp from "./CountUp";

const SIGNALS = [
  { key: "TF-IDF", color: "#2b46e0" },
  { key: "Embedding", color: "#5b73ee" },
  { key: "Brand", color: "#2d8a56" },
  { key: "Size", color: "#bd7a1c" },
  { key: "Jaccard", color: "#0e8a9b" },
];

function cap(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ResultsSection({ summary }: { summary: Summary }) {
  const total = summary.totalMatches;
  const conf = [
    { label: "High confidence", v: summary.confidence.high, color: "var(--green)" },
    { label: "Medium", v: summary.confidence.medium, color: "var(--amber)" },
    { label: "Low", v: summary.confidence.low, color: "var(--red)" },
  ];
  const maxDist = Math.max(...summary.scoreDistribution.map((d) => d.count));
  const maxBrand = Math.max(...summary.topBrandPairs.map((b) => b.count));

  return (
    <section className="sec" id="results">
      <div className="wrap">
        <div className="sec-head" data-reveal>
          <h2 className="h2" style={{ fontSize: 22, letterSpacing: "-.022em", maxWidth: "none", lineHeight: 1.25 }}>
            Most composite scores cluster between 0.6 and 0.8{" "}
            <span style={{ color: "var(--muted)", fontWeight: 400 }}>
              — strong agreement across signals.
            </span>
          </h2>
        </div>

        <div className="res-bento">
          {/* Confidence breakdown — full width */}
          <div className="card res-card res-span3" data-reveal>
            <div className="res-ct">Confidence breakdown</div>
            <div className="res-conf">
              {conf.map((c) => (
                <div className="item" key={c.label}>
                  <div className="big" style={{ color: c.color }}>
                    <CountUp value={c.v} />
                  </div>
                  <div className="k">
                    {c.label}
                    <span className="pct">{Math.round((c.v / total) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="res-seg">
              {conf.map((c, i) => (
                <i
                  key={c.label}
                  className="grow-x"
                  style={{
                    background: c.color,
                    width: Math.max((c.v / total) * 100, 0.6) + "%",
                    opacity: 0.85,
                    transitionDelay: i * 110 + "ms",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Score distribution — 2 wide */}
          <div className="card res-card res-span2" data-reveal>
            <div className="res-ct">Composite score distribution · matches</div>
            <div className="res-dist">
              {summary.scoreDistribution.map((d, i) => (
                <div className="col" key={d.range} title={d.count.toLocaleString() + " matches"}>
                  <span className="cnt">
                    {d.count >= 1000 ? (d.count / 1000).toFixed(1) + "k" : d.count}
                  </span>
                  <div
                    className="bar grow-y"
                    style={{
                      height: (d.count / maxDist) * 100 + "%",
                      opacity: 0.35 + 0.5 * (d.count / maxDist),
                      transitionDelay: i * 45 + "ms",
                    }}
                  />
                  <span className="rng">{d.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score stats — 1 */}
          <div className="card res-card res-stats" data-reveal>
            <div className="res-ct" style={{ marginBottom: 8 }}>Score statistics</div>
            {(
              [
                ["Median", summary.scoreStats.median.toFixed(3)],
                ["IQR", summary.scoreStats.p25.toFixed(2) + " – " + summary.scoreStats.p75.toFixed(2)],
                ["Range", summary.scoreStats.min.toFixed(2) + " – " + summary.scoreStats.max.toFixed(2)],
                ["Private label", summary.privateLabelMatches.toLocaleString()],
                ["Total matches", summary.totalMatches.toLocaleString()],
              ] as const
            ).map((r) => (
              <div className="row" key={r[0]}>
                <span className="l">{r[0]}</span>
                <span className="v">{r[1]}</span>
              </div>
            ))}
          </div>

          {/* Signal averages — 2 wide */}
          <div className="card res-card res-span2" data-reveal>
            <div className="res-ct">Average score per signal · 0–100</div>
            <div className="res-sig">
              {SIGNALS.map((s, i) => {
                const v = summary.signalAverages[s.key];
                return (
                  <div className="row" key={s.key}>
                    <span className="nm">{s.key}</span>
                    <div className="track">
                      <div
                        className="fill grow-x"
                        style={{
                          width: v * 100 + "%",
                          background: s.color,
                          opacity: 0.85,
                          transitionDelay: i * 60 + "ms",
                        }}
                      />
                    </div>
                    <span className="val">{Math.round(v * 100)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top brand pairs — 1 */}
          <div className="card res-card res-brand" data-reveal>
            <div className="res-ct" style={{ marginBottom: 10 }}>Top brand pairs · matches</div>
            {summary.topBrandPairs.slice(0, 8).map((b, i) => (
              <div className="row" key={b.brandA + b.brandB}>
                <div className="pair">
                  <b>{cap(b.brandA)}</b>
                  <span className="ar">→</span>
                  <span>{cap(b.brandB)}</span>
                </div>
                <div className="track">
                  <div
                    className="fill grow-x"
                    style={{
                      width: (b.count / maxBrand) * 100 + "%",
                      transitionDelay: i * 35 + "ms",
                    }}
                  />
                </div>
                <span className="c">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .res-bento { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) { .res-bento { grid-template-columns: 1fr; } }
        .res-card { padding: 22px 24px; transition: box-shadow .2s; }
        .res-card:hover { box-shadow: 0 5px 22px rgba(22,23,27,.06); }
        .res-ct { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--ghost); }
        .res-span3 { grid-column: span 3; }
        .res-span2 { grid-column: span 2; }
        @media (max-width: 900px) { .res-span3, .res-span2 { grid-column: span 1; } }

        .res-conf { display: flex; flex-wrap: wrap; gap: 34px; align-items: flex-end; margin: 18px 0 20px; }
        .res-conf .item .big { font-size: 34px; font-weight: 600; letter-spacing: -.02em; line-height: 1; }
        .res-conf .item .k { font-size: 12px; color: var(--faint); margin-top: 7px; display: flex; gap: 7px; align-items: center; }
        .res-conf .item .k .pct { font-family: var(--mono); color: var(--ghost); }
        .res-seg { display: flex; height: 10px; border-radius: 6px; overflow: hidden; gap: 2px; }
        .res-seg i { display: block; height: 100%; border-radius: 2px; }

        .res-dist { display: flex; align-items: flex-end; gap: 8px; height: 180px; margin-top: 18px; }
        .res-dist .col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 8px; }
        .res-dist .bar { width: 100%; background: var(--accent); border-radius: 4px 4px 2px 2px; min-height: 3px; }
        .res-dist .cnt { font-family: var(--mono); font-size: 10px; color: var(--faint); }
        .res-dist .rng { font-family: var(--mono); font-size: 9px; color: var(--ghost); }

        .res-stats .row { display: flex; justify-content: space-between; align-items: baseline; padding: 11px 0; border-top: 1px solid var(--hair); }
        .res-stats .row:first-of-type { border-top: none; }
        .res-stats .row .l { font-size: 13px; color: var(--muted); }
        .res-stats .row .v { font-family: var(--mono); font-size: 13px; color: var(--ink); }

        .res-sig { margin-top: 16px; }
        .res-sig .row { display: grid; grid-template-columns: 78px 1fr 38px; align-items: center; gap: 12px; padding: 8px 0; }
        .res-sig .row .nm { font-size: 13px; color: var(--muted); }
        .res-sig .track { height: 7px; border-radius: 4px; background: rgba(22,23,27,.05); overflow: hidden; }
        .res-sig .fill { height: 100%; border-radius: 4px; }
        .res-sig .val { font-family: var(--mono); font-size: 12px; color: var(--faint); text-align: right; }

        .res-brand .row { display: grid; grid-template-columns: 1fr 46px 28px; align-items: center; gap: 9px; padding: 7px 8px; margin: 0 -8px; border-radius: 7px; transition: background .16s ease; }
        .res-brand .row:hover { background: rgba(22,23,27,.03); }
        .res-brand .pair { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 5px; min-width: 0; white-space: nowrap; }
        .res-brand .pair .ar { color: var(--ghost); flex-shrink: 0; }
        .res-brand .pair b { font-weight: 600; color: var(--ink); }
        .res-brand .track { height: 6px; border-radius: 4px; background: rgba(22,23,27,.05); overflow: hidden; }
        .res-brand .fill { height: 100%; background: var(--accent); opacity: .5; border-radius: 4px; }
        .res-brand .c { font-family: var(--mono); font-size: 11px; color: var(--ghost); text-align: right; }
      `}</style>
    </section>
  );
}
