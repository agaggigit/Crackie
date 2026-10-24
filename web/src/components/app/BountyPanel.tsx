"use client";

import { Amount } from "@/components/ui/Amount";
import { Chip, DemoBadge } from "@/components/ui/Chip";
import { Jebi, KopiBotAvatar, type JebiMood } from "@/components/ui/Jebi";
import { Melt } from "@/components/ui/Melt";
import { useNow } from "@/hooks/useNow";
import type { VaultStatus } from "@/hooks/useVaultStatus";
import { formatDuration, formatScore } from "@/utils/format";

function lockLabel(status: VaultStatus, now: number): string {
  const left = Number(status.kunciSampai) - now;
  if (!status.aktif || left <= 0) return "Unlocked";
  const min = Math.ceil(left / 60);
  return min <= 1 ? "Locked 1 more min" : `Locked ${min} more min`;
}

// Kolom kiri halaman agent (desain A2): profil, kartu bounty dengan Jebi, statistik.
export function BountyPanel({
  status,
  isDemo,
  mood,
  maxPerWin,
}: {
  status?: VaultStatus;
  isDemo: boolean;
  mood: JebiMood;
  maxPerWin: string;
}) {
  const now = useNow();
  const held = status?.aktif ? formatDuration(now - Number(status.bertahanSejak)) : "0s";

  return (
    <section aria-label="KopiBot bounty" className="flex flex-col gap-3">
      <div className="relative h-[262px] overflow-hidden rounded-[30px] bg-navy text-white sm:h-[260px] md:h-[480px] md:rounded-[36px] lg:h-[520px]">
        <Melt variant="glow" />
        <Jebi
          mood={mood}
          size={420}
          priority
          className={`absolute -bottom-10 -right-8 w-[46%] max-w-[260px] sm:w-[40%] md:-bottom-20 md:left-[18%] md:right-auto md:w-[92%] md:max-w-[420px] lg:-bottom-24 lg:left-[20%] ${
            mood === "broken" ? "anim-shake" : "anim-bob"
          }`}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-orange/70" />
        <div className="relative flex flex-col gap-3 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream">
              <KopiBotAvatar size={52} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-head text-xl font-semibold">KopiBot</div>
              <div className="truncate text-[13px] text-white/60">Pays coffee suppliers</div>
            </div>
            {status ? <Chip tone={status.aktif ? "ok" : "warn"}>{status.aktif ? "Active" : "Stopped"}</Chip> : null}
          </div>
          <div className="mt-1 md:mt-4">
            <div className="flex items-center gap-2 text-sm text-white/60">
              Bounty {isDemo ? <DemoBadge className="h-6 text-xs" /> : null}
            </div>
            {status ? (
              <Amount wei={status.celengan} className="text-[52px] leading-none sm:text-[60px] md:text-[64px] xl:text-[76px]" />
            ) : (
              <div className="mt-2 h-16 w-44 animate-pulse rounded-2xl bg-white/10" />
            )}
          </div>
          {status ? (
            <div className="flex max-w-[62%] flex-wrap gap-2 md:max-w-none">
              <Chip tone="glass">Up to {maxPerWin} MON per win</Chip>
              <Chip tone="glass">{lockLabel(status, now)}</Chip>
            </div>
          ) : null}
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <StatBox label="Held out" value={held} />
        <StatBox
          label="Tries"
          value={status ? `${status.percobaanSejakNyala} of ${status.totalPercobaan}` : "–"}
          hint="Since the last restart, of all time"
        />
        <StatBox label="Score" value={status ? formatScore(status.skor) : "–"} hint="Bounty held over time, in MON hours" />
      </dl>
    </section>
  );
}

function StatBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col-reverse rounded-[22px] bg-white p-4" title={hint}>
      <dt className="text-[13px] text-ink-2">{label}</dt>
      <dd className="whitespace-nowrap font-head text-base font-semibold tracking-[-0.02em] tabular-nums sm:text-xl md:text-base lg:text-xl">{value}</dd>
    </div>
  );
}
