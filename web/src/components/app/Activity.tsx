"use client";

import { Ban, Coffee, MessageSquare, RotateCcw, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useStartTime } from "@/hooks/useStartTime";
import { DemoBadge } from "@/components/ui/Chip";
import { useNow } from "@/hooks/useNow";
import { useVaultEvents, type VaultEventItem } from "@/hooks/useVaultEvents";
import { demoEvents } from "@/utils/demo";
import { formatAgo, formatMon, shortAddress, supplierName, txUrl } from "@/utils/format";

function describe(e: VaultEventItem) {
  switch (e.kind) {
    case "try":
      return { icon: MessageSquare, tone: "bg-navy text-white", title: `Try ${e.ke}`, sub: `by ${shortAddress(e.penyerang)}`, value: "" };
    case "paid": {
      const name = supplierName(e.ke);
      return { icon: Coffee, tone: "bg-cream text-orange", title: `Paid ${name ?? shortAddress(e.ke)}`, sub: name ? "Approved supplier" : "Approved address", value: `${formatMon(e.jumlah)} MON` };
    }
    case "broke":
      return { icon: ShieldAlert, tone: "bg-orange text-white", title: "KopiBot broke", sub: `Bounty to ${shortAddress(e.penemu)}`, value: `${formatMon(e.hadiah)} MON` };
    case "stopped":
      return { icon: Ban, tone: "bg-warn-bg text-warn", title: "Stopped paying", sub: "Until the owner restarts it", value: "" };
    case "restarted":
      return { icon: RotateCcw, tone: "bg-ok-bg text-ok", title: "Restarted", sub: "With a new setup", value: "" };
    case "setup":
      return { icon: SlidersHorizontal, tone: "bg-[#F1E8FF] text-[#7B4DE0]", title: "Setup changed", sub: "Score starts again", value: "" };
  }
}

// Daftar aktivitas on-chain (desain A2, kolom kanan).
export function Activity({ className = "" }: { className?: string }) {
  const { items, state, isDemo } = useVaultEvents();
  const now = useNow(15_000);
  const t0 = useStartTime();
  const list = useMemo(() => (isDemo ? (t0 ? demoEvents(t0) : []) : items), [isDemo, items, t0]);

  return (
    <section aria-label="Activity" className={`flex flex-col rounded-[36px] bg-white px-5 py-5 ${className}`}>
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-head text-xl font-semibold tracking-[-0.02em]">Activity</h2>
        {isDemo ? <DemoBadge className="h-6 text-xs" /> : <span className="text-[13px] text-ink-2">Live</span>}
      </div>
      {state === "loading" ? (
        <ul aria-busy className="flex flex-col gap-3 pt-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-11 animate-pulse rounded-2xl bg-field" />
          ))}
        </ul>
      ) : state === "error" && list.length === 0 ? (
        <p className="py-4 text-sm text-ink-2">We could not load the history from Monad. New activity will still show up here.</p>
      ) : list.length === 0 ? (
        <p className="py-4 text-sm text-ink-2">Nothing yet. Be the first to try.</p>
      ) : (
        <ul className="flex flex-col">
          {list.map((e) => {
            const d = describe(e);
            const Icon = d.icon;
            return (
              <li key={e.id}>
                <a
                  href={isDemo ? undefined : txUrl(e.tx)}
                  target="_blank"
                  rel="noreferrer"
                  className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-field"
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${d.tone}`}>
                    <Icon size={17} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{d.title}</span>
                    <span className="block truncate text-[13px] text-ink-2">{d.sub}</span>
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums">
                    {d.value ? (
                      d.value
                    ) : e.time && now ? (
                      <span className="text-[13px] font-normal text-ink-2">{formatAgo(e.time, now)}</span>
                    ) : null}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
