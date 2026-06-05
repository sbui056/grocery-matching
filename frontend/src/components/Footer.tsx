"use client";

export default function Footer() {
  return (
    <footer className="ft">
      <div className="row">
        <p className="note">
          <b>grocery-matching</b> &nbsp;·&nbsp; case study sample for BetterBasket (YC W24)
        </p>
        <a href="https://github.com/sbui056/grocery-matching" target="_blank" rel="noopener noreferrer">
          GitHub
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M3 8 L8 3 M4 3 H8 V7" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </a>
      </div>

      <style jsx>{`
        .ft { padding: 8px 0 44px; }
        .ft .row { max-width: 1140px; margin: 0 auto; padding: 0 56px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        @media (max-width: 820px) { .ft .row { padding: 0 24px; } }
        .ft .note { font-size: 12px; color: var(--faint); margin: 0; }
        .ft .note b { font-family: var(--mono); font-weight: 500; color: var(--muted); }
        .ft a { font-family: var(--mono); font-size: 12px; color: var(--faint); text-decoration: none; display: inline-flex; align-items: center; gap: 5px; transition: color .15s; }
        .ft a:hover { color: var(--ink); }
      `}</style>
    </footer>
  );
}
