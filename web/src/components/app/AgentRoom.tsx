"use client";

import Link from "next/link";
import { BountyPanel } from "@/components/app/BountyPanel";
import { useVaultConfig } from "@/hooks/useVaultConfig";
import { useVaultStatus } from "@/hooks/useVaultStatus";
import { formatMon } from "@/utils/format";

// Halaman agent KopiBot (desain A2 sampai A6).
export function AgentRoom() {
  const { status, isDemo, isError } = useVaultStatus();
  const { limitPerTx } = useVaultConfig();
  const mood = status && !status.aktif ? "stopped" : "idle";

  return (
    <>
      <Link href="/app" className="mb-3 inline-flex w-fit items-center gap-1.5 px-1 text-sm text-ink-2 hover:text-navy">
        <span aria-hidden>←</span> All agents
      </Link>
      {isError ? (
        <p role="alert" className="mb-3 rounded-2xl bg-warn-bg px-4 py-3 text-sm text-warn">
          We could not read the vault from Monad. Retrying.
        </p>
      ) : null}
      <div className="grid flex-1 gap-3 lg:grid-cols-[400px_minmax(0,1fr)_330px]">
        <BountyPanel status={status} isDemo={isDemo} mood={mood} maxPerWin={limitPerTx ? formatMon(limitPerTx) : "–"} />
        <section aria-label="Chat" className="min-h-[420px] rounded-[36px] bg-white p-6" />
        <section aria-label="Activity" className="min-h-[300px] rounded-[36px] bg-white p-6" />
      </div>
    </>
  );
}
