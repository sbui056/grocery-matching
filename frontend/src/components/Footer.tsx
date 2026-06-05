"use client";

export default function Footer() {
  return (
    <footer className="px-6 sm:px-10 py-8">
      <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[11px] text-foreground/20">
          <span className="font-mono">grocery-matching</span>
          {" · "}
          case study sample for BetterBasket (Y Combinator W24)
        </p>
        <a
          href="https://github.com/sbui056/grocery-matching"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-foreground/20 hover:text-foreground/40 transition-colors duration-150"
        >
          GitHub ↗
        </a>
      </div>
    </footer>
  );
}
