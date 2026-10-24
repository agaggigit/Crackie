"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { Activity } from "@/components/app/Activity";
import { BountyPanel } from "@/components/app/BountyPanel";
import { BrokeModal } from "@/components/app/BrokeModal";
import { Chat } from "@/components/app/Chat";
import { ClaimCard } from "@/components/app/ClaimCard";
import { useOpenFaucet } from "@/components/app/FaucetModal";
import type { JebiMood } from "@/components/ui/Jebi";
import { VAULT_READY } from "@/config/vault";
import { useAttempt, type Outcome } from "@/hooks/useAttempt";
import { useVaultConfig } from "@/hooks/useVaultConfig";
import { useVaultStatus } from "@/hooks/useVaultStatus";
import { formatMon } from "@/utils/format";

// Halaman agent KopiBot (desain A2 sampai A6).
export function AgentRoom() {
  const { status, isDemo, isError, refetch } = useVaultStatus();
  const { limitPerTx } = useVaultConfig();
  const { address } = useAccount();
  const [broke, setBroke] = useState<Extract<Outcome, { kind: "broke" }> | null>(null);
  const [lastMood, setLastMood] = useState<JebiMood | null>(null);
  // Mode demo: setelah jebol, status demo ikut berubah supaya alurnya terasa sama dengan aslinya.
  const [demoBroke, setDemoBroke] = useState<bigint | null>(null);

  const onSettled = useCallback(
    (o?: Outcome) => {
      refetch();
      if (o?.kind === "broke") {
        setBroke(o);
        if (!VAULT_READY) setDemoBroke(parseEther(o.hadiah || "0"));
      }
      setLastMood(o?.kind === "held" ? "safe" : o?.kind === "broke" ? "broken" : null);
    },
    [refetch],
  );
  const { turns, step, send } = useAttempt({ onSettled });
  const openFaucet = useOpenFaucet();

  const shown = status && isDemo && demoBroke !== null ? { ...status, aktif: false, celengan: status.celengan - demoBroke, percobaanSejakNyala: BigInt(0), skor: BigInt(0) } : status;
  const stopped = !!shown && !shown.aktif;
  const mood: JebiMood = step ? "think" : lastMood === "broken" ? "broken" : stopped ? "stopped" : (lastMood ?? "idle");

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
      <div className="grid flex-1 items-start gap-3 lg:grid-cols-[400px_minmax(0,1fr)_330px]">
        <BountyPanel status={shown} isDemo={isDemo} mood={mood} maxPerWin={limitPerTx ? formatMon(limitPerTx) : "–"} />
        <Chat
          turns={turns}
          step={step}
          onSend={send}
          stopped={stopped}
          banner={stopped ? <StoppedBanner /> : null}
          claim={VAULT_READY ? <ClaimCard /> : null}
          onGetMon={openFaucet}
        />
        <Activity className="lg:max-h-[calc(100dvh-170px)] lg:overflow-y-auto" />
      </div>
      {broke ? (
        <BrokeModal
          hadiah={broke.hadiah}
          penemu={broke.aksi.alamat}
          txHash={broke.aksi.txHash}
          isYou={!!address && address.toLowerCase() === broke.aksi.alamat.toLowerCase()}
          demo={!VAULT_READY}
          onClose={() => setBroke(null)}
        />
      ) : null}
    </>
  );
}

function StoppedBanner() {
  return (
    <div className="flex items-center gap-3.5 rounded-[24px] bg-warn-bg px-5 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-orange text-white">
        <Lock size={18} aria-hidden />
      </span>
      <div>
        <div className="text-[15px] font-semibold">KopiBot can no longer pay</div>
        <p className="text-[13px] leading-relaxed text-ink-2">
          Someone broke it. You can still send tries, but every payment will be refused until the owner restarts it.
        </p>
      </div>
    </div>
  );
}
