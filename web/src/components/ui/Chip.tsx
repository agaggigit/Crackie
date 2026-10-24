import type { ReactNode } from "react";

const TONES = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  neutral: "bg-[#ECE8E1] text-ink-2",
  glass: "bg-white/15 text-white/90",
  orange: "bg-orange text-white",
} as const;

export function Chip({ tone = "neutral", children, className = "" }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-[8px] px-3 text-[13px] font-semibold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="The vault contract is not deployed yet. Numbers here are sample data."
      className={`inline-flex h-7 items-center rounded-[8px] bg-orange px-3 text-[13px] font-semibold text-white ${className}`}
    >
      Demo data
    </span>
  );
}
