"use client";

import { KopiBotCard } from "@/components/app/AgentCard";
import { Amount } from "@/components/ui/Amount";
import { DemoBadge } from "@/components/ui/Chip";
import { VAULT_READY } from "@/config/vault";
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
        {status.aktif
          ? now && status.bertahanSejak > BigInt(0)
            ? `Held out for ${formatDuration(now - Number(status.bertahanSejak))}`
            : "Holding out"
          : "Broken. Waiting for a restart."}
      </span>
    </div>
  );
}

export function LandingKopiBot() {
  return <KopiBotCard />;
}

// Label hero: "Live" hanya kalau kontrak sudah ada di Monad, selain itu jujur bahwa ini data demo.
export function HeroTag() {
  return (
    <span className="w-fit rounded-[8px] bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-peach">
      {VAULT_READY ? "Live on Monad testnet" : "Demo data until the vault is on Monad"}
    </span>
  );
}
