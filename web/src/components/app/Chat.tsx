"use client";

import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Chip } from "@/components/ui/Chip";
import { Jebi, type JebiMood } from "@/components/ui/Jebi";
import { OFFICIAL_FAUCET_URL, monadTestnet } from "@/config/chains";
import { VAULT_READY } from "@/config/vault";
import type { Step, Turn } from "@/hooks/useAttempt";
import { usePreflight } from "@/hooks/usePreflight";
import { AgentBubble, ErrorCard, OutcomeCard, Stepper, Thinking, UserBubble } from "./ChatParts";

// Di bawah ini saldo tidak cukup untuk gas catatPercobaan (docs/prd/fe.md Bagian 6).
const MIN_GAS = parseEther("0.01");

export const MAX_PESAN = Number(process.env.NEXT_PUBLIC_BATAS_PANJANG_PESAN || 2000);

type Blocker = { mood: JebiMood; title: string; body: string; action?: ReactNode };

function useBlocker(onGetMon?: () => void): Blocker | null {
  const { isConnected, chainId, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const bal = useBalance({ address, query: { enabled: VAULT_READY && !!address, refetchInterval: 15_000 } });
  const pre = usePreflight();
  const btn = (label: string, onClick?: () => void, href?: string) =>
    href ? (
      <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-full bg-navy px-4 text-sm font-semibold text-white">
        {label}
      </a>
    ) : (
      <button type="button" onClick={onClick} className="h-9 rounded-full bg-navy px-4 text-sm font-semibold text-white">
        {label}
      </button>
    );

  if (pre.budgetOut) return { mood: "stopped", title: "KopiBot is resting", body: "Today's tries are used up. New tries open at midnight WIB." };
  if (pre.agentOffline)
    return { mood: "stopped", title: "KopiBot is not ready", body: "Its setup does not match what is recorded on Monad. Tries are paused so you do not waste a fee." };
  if (pre.backendDown) return { mood: "think", title: "KopiBot is offline", body: "Our server is not answering right now. Try again in a moment." };
  if (!VAULT_READY) return null;
  if (!isConnected)
    return { mood: "idle", title: "Connect a wallet to try", body: "You need a wallet on Monad testnet. Each try costs a small network fee.", action: btn("Connect wallet", openConnectModal) };
  if (chainId !== monadTestnet.id)
    return { mood: "think", title: "Switch to Monad testnet", body: "Your wallet is on another network.", action: btn("Switch network", openChainModal) };
  if (bal.data && bal.data.value < MIN_GAS)
    return {
      mood: "gift",
      title: "You need a little MON",
      body: "Get free test MON to pay the network fee.",
      action: onGetMon ? btn("Get test MON", onGetMon) : btn("Get test MON", undefined, OFFICIAL_FAUCET_URL),
    };
  return null;
}

// Area chat + komposer (desain A2 sampai A6, A9).
export function Chat({
  turns,
  step,
  onSend,
  onResend,
  stopped,
  banner,
  claim,
  onGetMon,
}: {
  turns: Turn[];
  step: Step | null;
  onSend: (pesan: string) => Promise<"rejected" | "done">;
  onResend: (id: string) => void;
  stopped: boolean;
  banner?: ReactNode;
  claim?: ReactNode;
  onGetMon?: () => void;
}) {
  const [text, setText] = useState("");
  const blocker = useBlocker(onGetMon);
  const list = useRef<HTMLDivElement>(null);
  const sending = step !== null;
  const tooLong = text.length > MAX_PESAN;
  const canSend = !sending && !blocker && text.length > 0 && !tooLong;

  // Hanya daftar pesan yang digulir, bukan seluruh halaman, dan tidak saat halaman baru dibuka.
  useEffect(() => {
    const el = list.current;
    if (el && (turns.length > 0 || step)) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns, step]);

  const submit = () => {
    if (!canSend) return;
    const pesan = text;
    setText("");
    // Kalau dibatalkan di wallet, teks dikembalikan (docs/prd/fe.md Bagian 6).
    onSend(pesan).then((r) => {
      if (r === "rejected") setText((cur) => cur || pesan);
    });
  };

  return (
    <section aria-label="Chat with KopiBot" className="flex min-h-[520px] flex-col gap-4 rounded-[28px] bg-white p-4 sm:p-6 lg:rounded-[36px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-head text-xl font-semibold tracking-[-0.02em]">Chat with KopiBot</h2>
        {VAULT_READY ? <span className="text-[13px] text-ink-2">Messages are public</span> : <Chip tone="orange">Demo mode</Chip>}
      </div>
      {banner}
      {step ? <Stepper step={step} demo={!VAULT_READY} /> : null}
      <div ref={list} className="flex max-h-[60dvh] min-h-[240px] flex-1 flex-col gap-3 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-430px)]" aria-live="polite">
        <AgentBubble>Hi. I pay the café&apos;s coffee suppliers. Send me an invoice.</AgentBubble>
        {!VAULT_READY && turns.length === 0 ? (
          <p className="rounded-2xl bg-cream px-4 py-3 text-[13px] leading-relaxed text-ink-2">
            Demo mode. The vault is not on Monad yet, so tries are not recorded and payments are simulated.
          </p>
        ) : null}
        {turns.map((t) => (
          <div key={t.id} className="flex flex-col gap-3">
            <UserBubble text={t.pesan} ke={t.ke} recordTx={t.recordTx} />
            {t.balasan ? <AgentBubble>{t.balasan}</AgentBubble> : null}
            {t.outcome ? <OutcomeCard outcome={t.outcome} demo={t.demo} /> : null}
            {t.error ? <ErrorCard turn={t} onResend={() => onResend(t.id)} disabled={sending} /> : null}
          </div>
        ))}
        {step ? <Thinking step={step} /> : null}
        {claim}
      </div>
      {blocker ? (
        <div className="flex items-center gap-3 rounded-[24px] bg-field p-4">
          <Jebi mood={blocker.mood} size={64} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">{blocker.title}</div>
            <p className="text-[13px] leading-relaxed text-ink-2">{blocker.body}</p>
          </div>
          {blocker.action}
        </div>
      ) : (
        <form
          className="flex flex-col gap-3 rounded-[24px] bg-field p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="pesan" className="sr-only">
            Message to KopiBot
          </label>
          <textarea
            id="pesan"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            disabled={sending}
            rows={2}
            placeholder={sending ? "Locked until KopiBot answers" : stopped ? "KopiBot can no longer pay, but you can still try" : "Write to KopiBot"}
            className="max-h-48 min-h-12 w-full resize-none bg-transparent px-1 text-[15px] leading-relaxed outline-none placeholder:text-ink-3 disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between gap-3">
            <span className={`text-xs ${tooLong ? "font-semibold text-warn" : "text-ink-2"}`}>
              {tooLong
                ? `Too long. Keep it under ${MAX_PESAN} characters.`
                : VAULT_READY
                  ? "Your try is recorded on Monad before KopiBot reads it."
                  : "Demo mode. Nothing is sent on chain."}
            </span>
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send try"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-orange text-white transition-colors hover:bg-ember disabled:bg-[#E6E1D8]"
            >
              <ArrowUp size={20} aria-hidden />
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
