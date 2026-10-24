"use client";

import { Amount } from "@/components/ui/Amount";
import { ArrowButton } from "@/components/ui/Button";
import { Chip, DemoBadge } from "@/components/ui/Chip";
import { Jebi, KopiBotAvatar } from "@/components/ui/Jebi";
import { Melt } from "@/components/ui/Melt";
import { useNow } from "@/hooks/useNow";
import { useVaultStatus } from "@/hooks/useVaultStatus";
import { formatDuration, formatScore } from "@/utils/format";

// Kartu KopiBot di daftar agent (desain A1).
export function KopiBotCard() {
  const { status, isDemo, isLoading } = useVaultStatus();
  const now = useNow();
  const held = status?.aktif ? formatDuration(now - Number(status.bertahanSejak)) : "0s";

  return (
    <article className="relative flex min-h-[520px] flex-col overflow-hidden rounded-[36px] bg-navy text-white">
      <div className="relative h-[300px] overflow-hidden bg-cream sm:h-[330px]">
        <Melt variant="rise" />
        <KopiBotAvatar size={340} className="absolute -top-4 right-0 w-[62%] max-w-[360px] sm:right-6 sm:w-[44%]" />
        <div className="absolute left-6 top-6 flex gap-2">
          {status ? <Chip tone={status.aktif ? "ok" : "warn"}>{status.aktif ? "Active" : "Stopped"}</Chip> : null}
          {isDemo ? <DemoBadge /> : null}
        </div>
        <div className="absolute bottom-6 left-6">
          <div className="text-sm text-navy/70">Bounty</div>
          {status ? (
            <Amount wei={status.celengan} className="text-[64px] leading-none text-white sm:text-[72px]" unitClassName="text-white" />
          ) : (
            <div className="h-16 w-40 animate-pulse rounded-2xl bg-white/40" aria-label={isLoading ? "Loading" : undefined} />
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-6 p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-head text-[32px] font-semibold tracking-[-0.035em]">KopiBot</h3>
            <p className="text-[15px] text-white/60">Pays coffee suppliers</p>
          </div>
          <dl className="flex gap-7">
            <Stat label="Held out" value={held} />
            <Stat label="Tries" value={status ? status.totalPercobaan.toString() : "–"} />
            <Stat label="Score" value={status ? formatScore(status.skor) : "–"} />
          </dl>
        </div>
        <ArrowButton href="/app/agent/kopibot" className="w-full">
          Try to break it
        </ArrowButton>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-[13px] text-white/50">{label}</dt>
      <dd className="font-head text-2xl font-semibold tracking-[-0.03em] tabular-nums">{value}</dd>
    </div>
  );
}

export function YourAgentCard() {
  return (
    <article className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[36px] bg-white p-7 lg:min-h-[520px]">
      <h3 className="font-head text-[30px] font-semibold tracking-[-0.035em]">Your agent here</h3>
      <p className="mt-2 max-w-[300px] text-[15px] leading-relaxed text-ink-2">
        Add Jebol to an agent that holds money. Jebi will guard its bounty.
      </p>
      <a
        href="https://github.com/Nabil-Aufa/Monad-Blitz"
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex h-10 w-fit items-center rounded-full border-[1.5px] border-navy px-4 text-sm font-semibold hover:bg-navy hover:text-white"
      >
        Protect my agent
      </a>
      <Jebi mood="gift" size={420} className="absolute -bottom-10 -right-10 w-[78%] max-w-[420px]" />
    </article>
  );
}
