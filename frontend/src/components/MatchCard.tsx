"use client";

import { useState } from "react";
import type { Match } from "@/lib/types";

const SIG_COLORS: Record<string, string> = {
  tfidf: "#2b46e0", embedding: "#5b73ee", brand: "#2d8a56",
  size: "#bd7a1c", jaccard: "#0e8a9b",
};
const CONF_STYLE: Record<string, { fg: string; bg: string }> = {
  high: { fg: "var(--green)", bg: "rgba(45,138,86,.10)" },
  medium: { fg: "var(--amber)", bg: "rgba(189,122,28,.10)" },
  low: { fg: "var(--red)", bg: "rgba(196,61,61,.10)" },
};

function trunc(s: string) {
  return s.length > 64 ? s.slice(0, 61) + "…" : s;
}

function Chip({ text }: { text: string }) {
  if (!text) return null;
  return <span className="exp-chip">{text}</span>;
}

export default function MatchCard({ m }: { m: Match }) {
  const [open, setOpen] = useState(false);
  const cs = CONF_STYLE[m.confidence] || CONF_STYLE.low;
  const bars: [string, number, string][] = [
    ["TF-IDF", m.tfidf, SIG_COLORS.tfidf],
    ["Embed", m.embedding, SIG_COLORS.embedding],
    ["Brand", m.brand, SIG_COLORS.brand],
    ["Size", m.size, SIG_COLORS.size],
    ["Jaccard", m.jaccard, SIG_COLORS.jaccard],
  ];

  return (
    <div className={"exp-card" + (open ? " open" : "")}>
      <div className="exp-top">
        <span className="exp-badge" style={{ color: cs.fg, background: cs.bg }}>
          {m.confidence}
        </span>
        <span className="exp-comp tnum">{(m.composite * 100).toFixed(1)}%</span>
        <button className="exp-exp" onClick={() => setOpen((o) => !o)} aria-label="toggle details">
          <svg
            width="13" height="13" viewBox="0 0 13 13"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }}
          >
            <path d="M3 5 L6.5 8.5 L10 5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        </button>
      </div>
      <div className="exp-pair">
        <div className="exp-side">
          <span className="exp-store a">Walmart</span>
          <p className="exp-name">{trunc(m.nameA)}</p>
          <div className="exp-chips">
            <Chip text={m.brandA} />
            <Chip text={m.sizeA} />
          </div>
        </div>
        <svg className="exp-arrow" width="14" height="14" viewBox="0 0 14 14">
          <path d="M2 7 H11 M8 4 L11 7 L8 10" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
        <div className="exp-side">
          <span className="exp-store b">Wegmans</span>
          <p className="exp-name">{trunc(m.nameB)}</p>
          <div className="exp-chips">
            <Chip text={m.brandB} />
            <Chip text={m.sizeB} />
          </div>
        </div>
      </div>
      {open && (
        <div className="exp-detail">
          {bars.map((b) => (
            <div className="exp-bar" key={b[0]}>
              <span className="bl">{b[0]}</span>
              <div className="bt">
                <div className="bf" style={{ width: Math.round(b[1] * 100) + "%", background: b[2], opacity: 0.8 }} />
              </div>
              <span className="bv tnum">{Math.round(b[1] * 100)}</span>
            </div>
          ))}
          <div className="exp-ids">
            <span>{m.idA} → {m.idB}</span>
            <span>{(m.composite * 100).toFixed(2)}% composite</span>
          </div>
        </div>
      )}
    </div>
  );
}
