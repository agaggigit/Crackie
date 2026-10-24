"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { ArrowButton } from "@/components/ui/Button";
import { Jebi } from "@/components/ui/Jebi";
import { Melt } from "@/components/ui/Melt";
import { OFFICIAL_FAUCET_URL } from "@/config/chains";
import { txUrl } from "@/utils/format";

const FaucetContext = createContext<() => void>(() => {});
export const useOpenFaucet = () => useContext(FaucetContext);

type Result =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; txHash?: string }
  | { kind: "used" }
  | { kind: "limit" }
  | { kind: "unavailable" }
  | { kind: "error" };

const AMOUNT = process.env.NEXT_PUBLIC_FAUCET_JUMLAH || "0.05";

// Faucet mini untuk juri dan penonton (docs/prd/fe.md Bagian 3.8). Endpoint POST /api/faucet milik BE.
export function FaucetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  return (
    <FaucetContext.Provider value={show}>
      {children}
      {open ? <FaucetModal onClose={() => setOpen(false)} /> : null}
    </FaucetContext.Provider>
  );
}

function FaucetModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [r, setR] = useState<Result>({ kind: "idle" });

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const request = async () => {
    if (!address) return;
    setR({ kind: "sending" });
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alamat: address }),
      });
      const body = (await res.json().catch(() => ({}))) as { txHash?: string; alasan?: string };
      if (res.ok) setR({ kind: "sent", txHash: body.txHash });
      else if (res.status === 409) setR({ kind: "used" });
      else if (res.status === 429) setR({ kind: "limit" });
      else if (res.status === 404 || res.status === 501) setR({ kind: "unavailable" });
      else setR({ kind: "error" });
    } catch {
      setR({ kind: "error" });
    }
  };

  const copy: Record<Result["kind"], { title: string; body: string }> = {
    idle: { title: "Get test MON", body: "You need a little MON to send a try. We send it for free, once per wallet." },
    sending: { title: "Sending your MON", body: "This takes a few seconds." },
    sent: { title: "MON is on its way", body: "It should show in your wallet in a moment. Go ahead and send a try." },
    used: { title: "Already sent to this wallet", body: "Each wallet gets test MON once. Try the official Monad faucet for more." },
    limit: { title: "No more for today", body: "Today's test MON is used up. Try the official Monad faucet." },
    unavailable: { title: "Our faucet is not ready yet", body: "Use the official Monad faucet for now." },
    error: { title: "That did not go through", body: "Nothing was sent. Try again in a moment, or use the official Monad faucet." },
  };
  const c = copy[r.kind];
  const fallback = r.kind === "used" || r.kind === "limit" || r.kind === "unavailable" || r.kind === "error";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="faucet-title"
      className="m-auto w-[460px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[40px] bg-white p-0 text-navy backdrop:bg-navy/50 backdrop:backdrop-blur-md"
    >
      <div className="relative h-[220px] overflow-hidden bg-cream">
        <Melt variant="rise" />
        <Jebi mood={fallback ? "think" : "gift"} size={250} className="anim-bob absolute left-1/2 top-2 -translate-x-1/2" />
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/80 text-lg"
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-3 p-7">
        <h2 id="faucet-title" className="font-head text-[28px] font-semibold tracking-[-0.03em]">
          {c.title}
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-2">{c.body}</p>
        {r.kind === "idle" || r.kind === "sending" ? (
          <>
            <div className="flex justify-between border-y border-line py-3.5 text-sm">
              <span className="text-ink-2">You get</span>
              <span className="font-semibold">{AMOUNT} MON</span>
            </div>
            {address ? (
              <ArrowButton onClick={request} disabled={r.kind === "sending"} className="mt-1 w-full">
                {r.kind === "sending" ? "Sending" : "Send it to me"}
              </ArrowButton>
            ) : (
              <ArrowButton onClick={openConnectModal} variant="dark" className="mt-1 w-full">
                Connect wallet first
              </ArrowButton>
            )}
          </>
        ) : null}
        {r.kind === "sent" && r.txHash ? (
          <a href={txUrl(r.txHash)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-orange hover:underline">
            View receipt ↗
          </a>
        ) : null}
        {fallback ? (
          <ArrowButton href={OFFICIAL_FAUCET_URL} variant="dark" icon="↗" className="mt-1 w-full">
            Open Monad faucet
          </ArrowButton>
        ) : null}
        {r.kind === "idle" ? (
          <a href={OFFICIAL_FAUCET_URL} target="_blank" rel="noreferrer" className="text-center text-[13px] text-ink-2 hover:text-navy">
            Already used? Try the official Monad faucet.
          </a>
        ) : null}
      </div>
    </dialog>
  );
}

export function FaucetButton() {
  const open = useOpenFaucet();
  return (
    <button type="button" onClick={open} className="hidden h-10 rounded-full bg-white px-4 text-sm font-semibold hover:bg-cream sm:inline-flex sm:items-center">
      Get test MON
    </button>
  );
}
