"use client";

import { Ban, Coffee, ExternalLink, Loader2 } from "lucide-react";
import { parseEther } from "viem";
import type { ReactNode } from "react";
import { Jebi, type JebiMood } from "@/components/ui/Jebi";
import { Melt } from "@/components/ui/Melt";
import { RESENDABLE, type AttemptError, type Outcome, type Step, type Turn } from "@/hooks/useAttempt";
import { formatMon, shortAddress, supplierName, txUrl } from "@/utils/format";

const STEPS: { key: Step[]; label: string }[] = [
  { key: ["locked"], label: "Locked" },
  { key: ["signing", "recording"], label: "Recorded on Monad" },
  { key: ["reading", "busy"], label: "KopiBot reading" },
  { key: ["confirming"], label: "Result" },
];

// Stepper berbentuk bar (desain A3).
export function Stepper({ step, demo }: { step: Step; demo: boolean }) {
  const now = STEPS.findIndex((s) => s.key.includes(step));
  return (
    <ol className="grid grid-cols-4 gap-2.5" aria-label="Progress">
      {STEPS.map((s, i) => {
        const done = i < now || (demo && i === 1 && now > 1);
        const cur = i === now;
        const label = demo && i === 1 ? "Skipped in demo" : s.label;
        return (
          <li key={s.label} aria-current={cur ? "step" : undefined} className="min-w-0">
            <span className={`block h-1 rounded-full ${done ? "bg-navy" : cur ? "bg-orange" : "bg-[#E6E1D8]"}`} />
            <span className="mt-2 block text-xs text-ink-2">Step {i + 1}</span>
            <span className="block truncate text-sm font-semibold">{label}</span>
            <span className={`block text-xs ${cur ? "text-orange" : "text-ink-2"}`}>
              {cur ? (step === "signing" ? "Confirm in wallet" : step === "busy" ? "Waiting in line" : "Now") : done ? "Done" : "Next"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function AgentBubble({ children }: { children: ReactNode }) {
  return (
    <div className="anim-pop w-fit max-w-[85%] whitespace-pre-wrap [overflow-wrap:anywhere] rounded-[8px_22px_22px_22px] bg-field px-4 py-3 text-[15px] leading-relaxed">
      {children}
    </div>
  );
}

export function UserBubble({ text, ke, recordTx }: { text: string; ke?: number | null; recordTx?: string }) {
  return (
    <div className="anim-pop ml-auto flex w-fit max-w-[85%] flex-col items-end gap-1">
      <div className="whitespace-pre-wrap [overflow-wrap:anywhere] rounded-[22px_8px_22px_22px] bg-navy px-4 py-3 text-[15px] leading-relaxed text-white">
        {text}
      </div>
      {recordTx ? (
        <a href={txUrl(recordTx)} target="_blank" rel="noreferrer" className="text-xs text-ink-2 hover:text-navy">
          {ke ? `Try ${ke} recorded on Monad` : "Recorded on Monad"} ↗
        </a>
      ) : null}
    </div>
  );
}

export function Thinking({ step }: { step: Step }) {
  const text =
    step === "signing"
      ? "Confirm the try in your wallet"
      : step === "recording"
        ? "Recording your try on Monad"
        : step === "busy"
          ? "Someone else's try is being read. Yours is next."
          : step === "confirming"
            ? "Waiting for Monad to confirm the payment"
            : "KopiBot is reading your try";
  return (
    <div className="flex items-center gap-3" role="status">
      <Jebi mood="think" size={52} />
      <span className="text-sm text-ink-2">{text}</span>
      <Loader2 size={16} className="animate-spin text-orange" aria-hidden />
    </div>
  );
}

function Receipt({ hash, light = false }: { hash: string; light?: boolean }) {
  return (
    <a
      href={txUrl(hash)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex shrink-0 items-center gap-1 text-sm font-semibold ${light ? "text-white" : "text-orange"} hover:underline`}
    >
      Receipt <ExternalLink size={13} aria-hidden />
    </a>
  );
}

// Kartu hasil satu percobaan (desain A4, A6).
export function OutcomeCard({ outcome, demo }: { outcome: Outcome; demo?: boolean }) {
  if (outcome.kind === "held") {
    return (
      <div className="anim-pop relative overflow-hidden rounded-[28px] bg-navy p-6 pr-36 text-white sm:pr-48">
        <Melt variant="glow" className="opacity-80" />
        <Jebi mood="safe" size={170} className="absolute -bottom-6 -right-2 w-[140px] sm:w-[170px]" />
        <div className="relative">
          <div className="font-head text-2xl font-semibold tracking-[-0.02em]">KopiBot held out</div>
          <p className="mt-1 text-sm text-white/70">It did not pay. Your try is saved and its score keeps growing.</p>
        </div>
      </div>
    );
  }
  if (outcome.kind === "paid") {
    const name = supplierName(outcome.aksi.alamat);
    return (
      <Row icon={<Coffee size={18} aria-hidden />} iconTone="bg-white text-orange" tone="bg-cream" title="Paid an approved supplier">
        {formatMon(parseEther(outcome.aksi.jumlah))} MON to {name ?? shortAddress(outcome.aksi.alamat)}. That is allowed, so no bounty.
        {demo ? null : <Receipt hash={outcome.aksi.txHash} />}
      </Row>
    );
  }
  if (outcome.kind === "refused") {
    return (
      <Row icon={<Ban size={18} aria-hidden />} iconTone="bg-navy text-white" tone="bg-field" title="Payment refused">
        KopiBot tried to pay, and Monad blocked it. Your try is still saved.
        {demo ? null : <Receipt hash={outcome.aksi.txHash} />}
      </Row>
    );
  }
  return (
    <Row icon={<Jebi mood="broken" size={40} />} iconTone="bg-orange" tone="bg-warn-bg" title="KopiBot broke">
      It paid {shortAddress(outcome.aksi.alamat)}, an address that was not on its list.
      {demo ? null : <Receipt hash={outcome.aksi.txHash} />}
    </Row>
  );
}

function Row({ icon, iconTone, tone, title, children }: { icon: ReactNode; iconTone: string; tone: string; title: string; children: ReactNode }) {
  return (
    <div className={`anim-pop flex items-start gap-3.5 rounded-[24px] px-5 py-4 ${tone}`}>
      <span className={`grid size-10 shrink-0 place-items-center overflow-hidden rounded-[14px] ${iconTone}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold">{title}</div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px] leading-relaxed text-ink-2">{children}</div>
      </div>
    </div>
  );
}

const ERRORS: Record<AttemptError, { mood: JebiMood; title: string; body: string }> = {
  rejected: { mood: "safe", title: "You cancelled", body: "Nothing was sent and no fee was charged." },
  not_recorded: {
    mood: "stopped",
    title: "Your try was not recorded",
    body: "Monad did not accept it, so KopiBot never saw it. Each wallet can send up to 10 tries per hour.",
  },
  receipt_unknown: {
    mood: "think",
    title: "Waiting for Monad",
    body: "Your try was sent but is not confirmed yet. Once it lands, send it to KopiBot. You will not pay again.",
  },
  budget: { mood: "stopped", title: "KopiBot is resting", body: "Today's tries are used up. New tries open at midnight WIB. Your try is still recorded on Monad." },
  busy: { mood: "think", title: "KopiBot is busy", body: "Other tries are being read. Send yours again in a moment. You will not pay again." },
  offline: {
    mood: "stopped",
    title: "KopiBot could not read your try",
    body: "Monad or our server did not respond. Your try is still recorded, so you can send it again without paying.",
  },
  duplicate: { mood: "think", title: "This try was already read", body: "Each recorded try is read once. Write a new message to try again." },
  not_found: {
    mood: "think",
    title: "KopiBot could not find your try yet",
    body: "Monad may still be catching up. Send it again in a moment. You will not pay again.",
  },
  network: { mood: "think", title: "Connection lost", body: "We could not reach KopiBot. Your try is still recorded, so you can send it again." },
  pending_unknown: {
    mood: "think",
    title: "Waiting for Monad",
    body: "KopiBot sent a payment but it is not confirmed yet. Check the receipt in a moment.",
  },
};

export function ErrorCard({ turn, onResend, disabled }: { turn: Turn; onResend?: () => void; disabled?: boolean }) {
  const e = ERRORS[turn.error!];
  const canResend = !!onResend && !!turn.recordTx && RESENDABLE.includes(turn.error!);
  return (
    <div role="alert" className="anim-pop flex flex-wrap items-center gap-3 rounded-[24px] bg-field px-4 py-3">
      <Jebi mood={e.mood} size={56} className="shrink-0" />
      <div className="min-w-0 flex-1 basis-48">
        <div className="text-[15px] font-semibold">{e.title}</div>
        <p className="text-[13px] leading-relaxed text-ink-2">{e.body}</p>
      </div>
      {turn.error === "pending_unknown" && turn.aksi ? <Receipt hash={turn.aksi.txHash} /> : null}
      {canResend ? (
        <button
          type="button"
          onClick={onResend}
          disabled={disabled}
          className="h-9 shrink-0 rounded-full bg-navy px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Send to KopiBot again
        </button>
      ) : null}
    </div>
  );
}
