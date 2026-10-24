"use client";

import { KopiBotCard } from "@/components/app/AgentCard";
import { Amount } from "@/components/ui/Amount";
import { DemoBadge } from "@/components/ui/Chip";
import { useNow } from "@/hooks/useNow";
import { useVaultStatus } from "@/hooks/useVaultStatus";
import { formatDuration } from "@/utils/format";

// Bagian landing yang membaca chain langsung.
export function LandingBounty() {
  const { status, isDemo } = useVaultStatus();
  const now = useNow();
  if (!status) return null;
  return (
    <div className="absolute left-6 top-6 flex flex-col gap-1 rounded-[22px] bg-white/75 px-5 py-4 backdrop-blur-xl">
      <span className="flex items-center gap-2 text-[13px] text-ink-2">
        KopiBot bounty {isDemo ? <DemoBadge className="h-5 px-2 text-[11px]" /> : null}
      </span>
      <Amount wei={status.celengan} className="text-[40px] leading-none" unitClassName="text-ink-2 text-sm" />
      <span className="text-[13px] text-ink-2">
        {status.aktif ? `Held out for ${now ? formatDuration(now - Number(status.bertahanSejak)) : "a while"}` : "Broken. Waiting for a restart."}
      </span>
    </div>
  );
}

export function LandingKopiBot() {
  return <KopiBotCard />;
}
