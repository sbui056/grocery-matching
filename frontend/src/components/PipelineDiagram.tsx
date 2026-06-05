"use client";

export default function PipelineDiagram() {
  const fg = "#1a1a1a";

  return (
    <div className="w-full overflow-x-auto -mx-2">
      <div className="min-w-[780px] px-2 py-4">
        <svg
          viewBox="0 0 900 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          {/* Connection lines — curved merging paths */}
          <path d="M 130 60 C 170 60, 185 105, 215 105" stroke={fg} strokeOpacity="0.1" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M 130 180 C 170 180, 185 105, 215 105" stroke={fg} strokeOpacity="0.1" strokeWidth="1.5" strokeDasharray="4 3" />

          {/* Straight connections */}
          <line x1="310" y1="105" x2="345" y2="105" stroke={fg} strokeOpacity="0.1" strokeWidth="1.5" />
          <line x1="445" y1="105" x2="478" y2="105" stroke={fg} strokeOpacity="0.1" strokeWidth="1.5" />
          <line x1="608" y1="105" x2="638" y2="105" stroke={fg} strokeOpacity="0.1" strokeWidth="1.5" />
          <line x1="718" y1="105" x2="748" y2="105" stroke={fg} strokeOpacity="0.1" strokeWidth="1.5" />
          <line x1="828" y1="105" x2="850" y2="105" stroke={fg} strokeOpacity="0.1" strokeWidth="1.5" />

          {/* Arrow tips */}
          {[215, 345, 478, 638, 748, 850].map((x) => (
            <polygon key={x} points={`${x - 1},101 ${x - 1},109 ${x + 5},105`} fill={fg} fillOpacity="0.12" />
          ))}

          {/* ── Input nodes ── */}
          <rect x="12" y="38" width="118" height="44" rx="22" fill="#3b5ccc" fillOpacity="0.06" stroke="#3b5ccc" strokeOpacity="0.18" strokeWidth="1" />
          <text x="71" y="56" textAnchor="middle" fill="#3b5ccc" fillOpacity="0.8" fontSize="13" fontWeight="600" fontFamily="system-ui">Store A</text>
          <text x="71" y="72" textAnchor="middle" fill="#3b5ccc" fillOpacity="0.35" fontSize="10" fontFamily="system-ui">Walmart · 233K</text>

          <rect x="12" y="158" width="118" height="44" rx="22" fill="#2d8a56" fillOpacity="0.06" stroke="#2d8a56" strokeOpacity="0.18" strokeWidth="1" />
          <text x="71" y="176" textAnchor="middle" fill="#2d8a56" fillOpacity="0.8" fontSize="13" fontWeight="600" fontFamily="system-ui">Store B</text>
          <text x="71" y="192" textAnchor="middle" fill="#2d8a56" fillOpacity="0.35" fontSize="10" fontFamily="system-ui">Wegmans · 55K</text>

          {/* ── Processing nodes ── */}
          <rect x="220" y="82" width="90" height="46" rx="10" fill={fg} fillOpacity="0.025" stroke={fg} strokeOpacity="0.08" strokeWidth="1" />
          <text x="265" y="101" textAnchor="middle" fill={fg} fillOpacity="0.6" fontSize="12" fontWeight="500" fontFamily="system-ui">Pre-process</text>
          <text x="265" y="117" textAnchor="middle" fill={fg} fillOpacity="0.22" fontSize="9" fontFamily="system-ui">normalize · extract</text>

          <rect x="350" y="82" width="95" height="46" rx="10" fill={fg} fillOpacity="0.025" stroke={fg} strokeOpacity="0.08" strokeWidth="1" />
          <text x="397" y="101" textAnchor="middle" fill={fg} fillOpacity="0.6" fontSize="12" fontWeight="500" fontFamily="system-ui">Block</text>
          <text x="397" y="117" textAnchor="middle" fill={fg} fillOpacity="0.22" fontSize="9" fontFamily="system-ui">12 category groups</text>

          {/* Candidates — wider, more prominent */}
          <rect x="483" y="77" width="125" height="56" rx="10" fill={fg} fillOpacity="0.03" stroke={fg} strokeOpacity="0.1" strokeWidth="1.5" />
          <text x="545" y="100" textAnchor="middle" fill={fg} fillOpacity="0.65" fontSize="12" fontWeight="600" fontFamily="system-ui">Candidates</text>
          <text x="545" y="117" textAnchor="middle" fill={fg} fillOpacity="0.22" fontSize="9" fontFamily="system-ui">TF-IDF + Embeddings</text>

          <rect x="643" y="82" width="75" height="46" rx="10" fill={fg} fillOpacity="0.025" stroke={fg} strokeOpacity="0.08" strokeWidth="1" />
          <text x="680" y="101" textAnchor="middle" fill={fg} fillOpacity="0.6" fontSize="12" fontWeight="500" fontFamily="system-ui">Score</text>
          <text x="680" y="117" textAnchor="middle" fill={fg} fillOpacity="0.22" fontSize="9" fontFamily="system-ui">5 signals</text>

          {/* LLM — accent color */}
          <rect x="753" y="82" width="75" height="46" rx="10" fill="#6c5ce7" fillOpacity="0.04" stroke="#6c5ce7" strokeOpacity="0.15" strokeWidth="1" />
          <text x="790" y="101" textAnchor="middle" fill="#6c5ce7" fillOpacity="0.7" fontSize="12" fontWeight="500" fontFamily="system-ui">LLM</text>
          <text x="790" y="117" textAnchor="middle" fill="#6c5ce7" fillOpacity="0.3" fontSize="9" fontFamily="system-ui">gpt-5.4-nano</text>

          {/* Output — green accent */}
          <rect x="855" y="82" width="40" height="46" rx="23" fill="#2d8a56" fillOpacity="0.08" stroke="#2d8a56" strokeOpacity="0.2" strokeWidth="1" />
          <text x="875" y="101" textAnchor="middle" fill="#2d8a56" fillOpacity="0.8" fontSize="12" fontWeight="700" fontFamily="system-ui">24K</text>
          <text x="875" y="117" textAnchor="middle" fill="#2d8a56" fillOpacity="0.35" fontSize="8" fontFamily="system-ui">matches</text>

          {/* ── Data reduction annotations ── */}
          <text x="265" y="145" textAnchor="middle" fill={fg} fillOpacity="0.1" fontSize="9" fontFamily="monospace">→ 170K</text>
          <text x="397" y="145" textAnchor="middle" fill={fg} fillOpacity="0.1" fontSize="9" fontFamily="monospace">4.1B pairs</text>
          <text x="545" y="150" textAnchor="middle" fill={fg} fillOpacity="0.1" fontSize="9" fontFamily="monospace">~40 per item</text>
          <text x="680" y="145" textAnchor="middle" fill={fg} fillOpacity="0.1" fontSize="9" fontFamily="monospace">top 5</text>
          <text x="790" y="145" textAnchor="middle" fill={fg} fillOpacity="0.1" fontSize="9" fontFamily="monospace">~15K calls</text>
        </svg>
      </div>
    </div>
  );
}
