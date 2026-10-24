"use client";

import { useCallback, useRef, useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import { BaseError, decodeEventLog, formatEther, keccak256, toBytes, UserRejectedRequestError, type Hash } from "viem";
import { VAULT_ADDRESS, VAULT_READY, vaultAbi } from "@/config/vault";

export type HasilBayar = "dibayar" | "jebol" | "revert" | "tertunda";
export type Aksi = { alamat: `0x${string}`; jumlah: string; txHash: Hash; hasil: HasilBayar; hadiah?: string };

export type Outcome =
  | { kind: "held" }
  | { kind: "paid"; aksi: Aksi }
  | { kind: "broke"; aksi: Aksi; hadiah: string }
  | { kind: "refused"; aksi: Aksi };

export type Step = "locked" | "signing" | "recording" | "reading" | "busy" | "confirming";

export type Turn = {
  id: string;
  pesan: string;
  recordTx?: Hash;
  ke?: number | null;
  balasan?: string;
  aksi?: Aksi | null;
  outcome?: Outcome;
  error?: AttemptError;
  demo?: boolean;
};

export type AttemptError =
  | "rejected"
  | "not_recorded"
  | "budget"
  | "offline"
  | "duplicate"
  | "bad_request"
  | "network"
  | "pending_unknown";

const RETRY_BUSY = 5;
const RETRY_GAP_MS = 2_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function randomHash(): Hash {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")}`;
}

// Alur satu percobaan (docs/prd/fe.md Bagian 3.3):
// kunci teks → hash → catatPercobaan → tunggu receipt → POST /api/serang (ulang kalau sibuk) → tampilkan aksi.
export function useAttempt({ onSettled }: { onSettled?: (o?: Outcome) => void } = {}) {
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [step, setStep] = useState<Step | null>(null);
  const busy = useRef(false);

  const patch = (id: string, p: Partial<Turn>) => setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)));

  // Hasil "tertunda": receipt bayar dibaca langsung dari chain.
  const resolvePending = useCallback(
    async (aksi: Aksi): Promise<Outcome | null> => {
      if (!client) return null;
      try {
        const r = await client.waitForTransactionReceipt({ hash: aksi.txHash, timeout: 90_000 });
        if (r.status === "reverted") return { kind: "refused", aksi };
        for (const log of r.logs) {
          try {
            const ev = decodeEventLog({ abi: vaultAbi, data: log.data, topics: log.topics });
            if (ev.eventName === "Jebol") return { kind: "broke", aksi, hadiah: formatEther(ev.args.hadiah) };
            if (ev.eventName === "Dibayar") return { kind: "paid", aksi };
          } catch {
            // Log lain di transaksi yang sama.
          }
        }
        return null;
      } catch {
        return null;
      }
    },
    [client],
  );

  const toOutcome = useCallback(
    async (aksi: Aksi | null): Promise<Outcome | "pending_unknown"> => {
      if (!aksi) return { kind: "held" };
      if (aksi.hasil === "dibayar") return { kind: "paid", aksi };
      if (aksi.hasil === "jebol") return { kind: "broke", aksi, hadiah: aksi.hadiah ?? "0" };
      if (aksi.hasil === "revert") return { kind: "refused", aksi };
      setStep("confirming");
      return (await resolvePending(aksi)) ?? "pending_unknown";
    },
    [resolvePending],
  );

  const send = useCallback(
    async (pesan: string) => {
      if (busy.current || pesan.length === 0) return;
      busy.current = true;
      const id = randomHash();
      setTurns((ts) => [...ts, { id, pesan, demo: !VAULT_READY }]);
      let outcome: Outcome | undefined;
      try {
        // Pesan dipakai persis apa adanya: tanpa trim, tanpa normalisasi.
        setStep("locked");
        const hashPesan = keccak256(toBytes(pesan));

        let txHash: Hash;
        if (VAULT_READY) {
          setStep("signing");
          try {
            txHash = await writeContractAsync({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "catatPercobaan", args: [hashPesan] });
          } catch (e) {
            const rejected = e instanceof BaseError && e.walk((x) => x instanceof UserRejectedRequestError);
            patch(id, { error: rejected ? "rejected" : "not_recorded" });
            return;
          }
          patch(id, { recordTx: txHash });
          setStep("recording");
          const r = await client!.waitForTransactionReceipt({ hash: txHash });
          if (r.status !== "success") {
            patch(id, { error: "not_recorded" });
            return;
          }
        } else {
          // Mode demo: BE berjalan dengan BAYAR_PALSU=1, tidak ada transaksi.
          txHash = randomHash();
        }

        setStep("reading");
        for (let i = 0; ; i++) {
          let res: Response;
          try {
            res = await fetch("/api/serang", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ txHash, pesan }),
            });
          } catch {
            patch(id, { error: "network" });
            return;
          }
          const body = (await res.json().catch(() => ({}))) as {
            ke?: number | null;
            balasan?: string;
            aksi?: Aksi | null;
            alasan?: string;
          };
          if (res.status === 429 && body.alasan === "sibuk" && i < RETRY_BUSY) {
            setStep("busy");
            await sleep(RETRY_GAP_MS);
            setStep("reading");
            continue;
          }
          if (!res.ok) {
            const err: AttemptError =
              res.status === 429 && body.alasan === "anggaran_habis"
                ? "budget"
                : res.status === 409
                  ? "duplicate"
                  : res.status === 503
                    ? "offline"
                    : res.status === 400
                      ? "bad_request"
                      : "network";
            patch(id, { error: err });
            return;
          }
          patch(id, { ke: body.ke ?? null, balasan: body.balasan, aksi: body.aksi ?? null });
          const o = await toOutcome(body.aksi ?? null);
          if (o === "pending_unknown") {
            patch(id, { error: "pending_unknown", outcome: undefined });
            return;
          }
          outcome = o;
          patch(id, { outcome: o });
          return;
        }
      } finally {
        busy.current = false;
        setStep(null);
        onSettled?.(outcome);
      }
    },
    [client, writeContractAsync, toOutcome, onSettled],
  );

  return { turns, step, sending: step !== null, send };
}
