"use client";

import { useEffect, useRef } from "react";
import { parseEther, type Address } from "viem";
import { useReadContract } from "wagmi";
import { ArrowButton } from "@/components/ui/Button";
import { Jebi } from "@/components/ui/Jebi";
import { Melt } from "@/components/ui/Melt";
import { VAULT_ADDRESS, VAULT_READY, vaultAbi } from "@/config/vault";
import { shortAddress, splitMon, txUrl } from "@/utils/format";

// Momen jebol (desain A5, M5). Layar penuh di mobile, modal di desktop.
export function BrokeModal({
  hadiah,
  penemu,
  txHash,
  isYou,
  demo,
  onClose,
}: {
  hadiah: string;
  penemu: string;
  txHash: string;
  isYou: boolean;
  demo?: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    // Tanpa cleanup close(): di StrictMode cleanup ikut terpanggil dan langsung menutup modal.
    if (d && !d.open) d.showModal();
  }, []);
  const wei = parseEther(hadiah || "0");
  const { int, dec } = splitMon(wei);
  // Hadiah yang gagal dikirim ditahan di hadiahTertunda dan harus diklaim (docs/prd/sc.md 3.4).
  const tertunda = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "hadiahTertunda",
    args: [penemu as Address],
    query: { enabled: VAULT_READY && wei > BigInt(0) },
  });
  const waiting = (tertunda.data ?? BigInt(0)) > BigInt(0);
  const empty = wei === BigInt(0);
  const who = isYou ? "you" : shortAddress(penemu);
  const body = empty
    ? "It paid an address that was not on its list. The bounty was empty, so nothing was paid, but KopiBot can no longer pay."
    : waiting
      ? "It paid an address that was not on its list. The bounty is waiting to be claimed and KopiBot can no longer pay."
      : "It paid an address that was not on its list. The bounty went to that address and KopiBot can no longer pay.";
  const label = empty ? "Bounty was empty" : waiting ? `Bounty waiting for ${who}` : `Bounty paid to ${who}`;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="broke-title"
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-navy/50 backdrop:backdrop-blur-md sm:m-auto sm:h-auto sm:max-h-[calc(100dvh-32px)] sm:w-[640px] sm:max-w-[calc(100vw-32px)]"
    >
      <div className="relative flex h-full flex-col items-center justify-end overflow-hidden bg-orange px-6 pb-8 pt-4 text-white sm:h-auto sm:min-h-[720px] sm:rounded-[48px] sm:px-12 sm:pb-12">
        <Melt variant="alarm" />
        <Jebi mood="broken" size={460} priority className="anim-shake absolute -top-6 left-1/2 w-[92%] max-w-[460px] -translate-x-1/2 sm:-top-20" />
        <div className="absolute inset-x-0 bottom-0 top-[30%] bg-gradient-to-b from-transparent via-[#F0611A] via-35% to-transparent" />
        <div className="relative flex w-full flex-col items-center gap-4 text-center">
          <h2 id="broke-title" className="font-head text-[44px] font-semibold leading-none tracking-[-0.04em] sm:text-[68px]">
            KopiBot broke
          </h2>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-white/90 sm:text-[17px]">
            {body}
          </p>
          <div className="mt-2 flex w-full flex-col gap-4 rounded-[28px] bg-navy p-5 text-left sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-white/60">{label}</div>
              <div className="flex items-baseline gap-2">
                <span className="font-head text-5xl font-semibold tracking-[-0.045em] tabular-nums">
                  {int}
                  <span className="num-dim">{dec}</span>
                </span>
                <span className="text-white/60">MON</span>
              </div>
            </div>
            {demo ? (
              <span className="text-sm text-white/60">Demo, nothing was paid</span>
            ) : (
              <ArrowButton href={txUrl(txHash)} variant="light" icon="↗">
                View receipt
              </ArrowButton>
            )}
          </div>
          <button type="button" onClick={() => ref.current?.close()} className="mt-1 text-[15px] font-semibold text-white hover:underline">
            Back to KopiBot
          </button>
        </div>
      </div>
    </dialog>
  );
}
