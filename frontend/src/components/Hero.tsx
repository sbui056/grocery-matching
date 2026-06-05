"use client";

import type { Summary, Match } from "@/lib/types";
import CountUp from "./CountUp";

const PHASE_NODES = [
  { name: "Pre-process", sub: "normalize · extract", mv: "170K", mk: "matchable" },
  { name: "Block", sub: "12 categories", mv: "4.1B", mk: "pairs" },
  { name: "Candidates", sub: "TF-IDF + embed", mv: "~40", mk: "per item" },
  { name: "Score", sub: "5 signals", mv: "top 5", mk: "ranked" },
  { name: "LLM", sub: "gpt-5.4-nano", mv: "~15K", mk: "LLM calls", llm: true },
];

function FlowArrow() {
  return (
    <div className="arr">
      <svg width="30" height="12" viewBox="0 0 30 12" fill="none">
        <line x1="0" y1="6" x2="22" y2="6" stroke="#16171b" strokeOpacity="0.22" strokeWidth="1.2" />
        <path d="M21 2.5 L27 6 L21 9.5" stroke="#16171b" strokeOpacity="0.3" strokeWidth="1.2" fill="none" />
      </svg>
    </div>
  );
}

export default function Hero({
  summary,
  matches,
}: {
  summary: Summary;
  matches: Match[];
}) {
  return (
    <header className="wrap hero" id="top">
      <h1 data-reveal>
        Pairing 233K Walmart products with 55K Wegmans products
        <span className="mut"> — without a single shared barcode.</span>
      </h1>
      <div className="sub" data-reveal style={{ transitionDelay: "70ms" }}>
        A hybrid TF-IDF + embedding + LLM pipeline that finds each product's
        closest equivalent at the other store, then verifies every match.
      </div>
      <div className="meta" data-reveal style={{ transitionDelay: "140ms" }}>
        <b>24,370</b>
        <span>matches</span>
        <span className="x">/</span>
        <b>83%</b>
        <span>high confidence</span>
        <span className="x">/</span>
        <b>
          ~80<span style={{ fontWeight: 400, fontSize: 11 }}>min</span>
        </b>
        <span>runtime</span>
      </div>
      <div className="diagram" data-reveal style={{ transitionDelay: "210ms" }}>
        <div className="dlab">
          <span>How it works — 6 stages</span>
        </div>
        <div className="flowscroll">
          <div className="flow">
            <div className="sources">
              <div className="src a">
                <span className="sq" />
                <span className="nm">Walmart</span>
                <span className="ct">233K</span>
              </div>
              <div className="src b">
                <span className="sq" />
                <span className="nm">Wegmans</span>
                <span className="ct">55K</span>
              </div>
            </div>
            <div className="merge">
              <svg width="46" height="104" viewBox="0 0 46 104" fill="none">
                <path
                  d="M0 26 C26 26 20 52 44 52"
                  className="flowdash"
                  stroke="#2b46e0"
                  strokeOpacity="0.45"
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                />
                <path
                  d="M0 78 C26 78 20 52 44 52"
                  className="flowdash"
                  stroke="#2d8a56"
                  strokeOpacity="0.45"
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                />
                <path
                  d="M38 48.5 L44 52 L38 55.5"
                  stroke="#16171b"
                  strokeOpacity="0.3"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            </div>
            <div className="nodes">
              {PHASE_NODES.map((nd) => (
                <span key={nd.name} style={{ display: "contents" }}>
                  <div className={"node" + (nd.llm ? " llm" : "")}>
                    <span className="nm">{nd.name}</span>
                    <span className="nsub">{nd.sub}</span>
                    <div className="foot">
                      <span className="mv">{nd.mv}</span>
                      <span className="mk">{nd.mk}</span>
                    </div>
                  </div>
                  <FlowArrow />
                </span>
              ))}
            </div>
            <div className="out">
              <span className="ov">
                <CountUp value={24370} />
              </span>
              <span className="ok">verified matches</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
