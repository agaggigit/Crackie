"use client";

import { useCallback, useRef, useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import { BaseError, decodeEventLog, formatEther, keccak256, toBytes, UserRejectedRequestError, type Hash } from "viem";
import { monadTestnet } from "@/config/chains";
import { VAULT_ADDRESS, VAULT_READY, vaultAbi } from "@/config/vault";

// "jebol" masih dikirim BE sampai respons POST /api/serang ikut diganti nama menjadi "crackie".
export type HasilBayar = "dibayar" | "crackie" | "jebol" | "revert" | "tertunda";
export type Aksi = { alamat: `0x${string}`; jumlah: string; txHash: Hash; hasil: HasilBayar; hadiah?: string };

export type Outcome =
  | { kind: "held" }
  | { kind: "paid"; aksi: Aksi }
  | { kind: "broke"; aksi: Aksi; hadiah: string }
  | { kind: "refused"; aksi: Aksi };

export type Step = "locked" | "signing" | "recording" | "reading" | "busy" | "confirming";

export type AttemptError =
  | "rejected"
  | "not_recorded"
  | "receipt_unknown"
  | "budget"
  | "busy"
  | "offline"
  | "duplicate"
  | "not_found"
  | "network"
  | "pending_unknown";

export type Turn = {
  id: string;
  pesan: string;
  // txHash catatPercobaan (atau hash acak di mode demo). Disimpan supaya bisa dikirim ulang ke agent.
  recordTx?: Hash;
  recorded?: boolean;
  ke?: number | null;
  balasan?: string;
  aksi?: Aksi | null;
  outcome?: Outcome;
  error?: AttemptError;
  demo?: boolean;
};

// Error yang terjadi setelah percobaan tercatat: pesan bisa dikirim ulang ke agent tanpa membayar gas lagi.
export const RESENDABLE: AttemptError[] = ["receipt_unknown", "busy", "offline", "not_found", "network"];

const RETRY_BUSY = 5;
const RETRY_GAP_MS = 2_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function randomHash(): Hash {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")}`;
}

type Body = { ke?: number | null; balasan?: string; aksi?: Aksi | null; alasan?: string };

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
            if (ev.eventName === "Crackie") return { kind: "broke", aksi, hadiah: formatEther(ev.args.hadiah) };
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
    async (aksi: Aksi | null): Promise<Outcome | null> => {
      if (!aksi) return { kind: "held" };
      if (aksi.hasil === "dibayar") return { kind: "paid", aksi };
      if (aksi.hasil === "crackie" || aksi.hasil === "jebol") return { kind: "broke", aksi, hadiah: aksi.hadiah ?? "0" };
      if (aksi.hasil === "revert") return { kind: "refused", aksi };
      setStep("confirming");
      return resolvePending(aksi);
    },
    [resolvePending],
  );

  // Kirim percobaan yang sudah tercatat ke agent. Dipakai juga oleh tombol "kirim ulang".
  const deliver = useCallback(
    async (id: string, txHash: Hash, pesan: string): Promise<Outcome | undefined> => {
      setStep("reading");
      patch(id, { error: undefined });
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
        const body = (await res.json().catch(() => ({}))) as Body;
        if (res.status === 429 && body.alasan === "sibuk") {
          if (i >= RETRY_BUSY) {
            patch(id, { error: "busy" });
            return;
          }
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
                    ? "not_found"
                    : "network";
          patch(id, { error: err });
          return;
        }
        patch(id, { ke: body.ke ?? null, balasan: body.balasan, aksi: body.aksi ?? null });
        const o = await toOutcome(body.aksi ?? null);
        if (!o) {
          patch(id, { error: "pending_unknown" });
          return;
        }
        patch(id, { outcome: o });
        return o;
      }
    },
    [toOutcome],
  );

  const run = useCallback(
    async (job: () => Promise<Outcome | undefined>) => {
      busy.current = true;
      let outcome: Outcome | undefined;
      try {
        outcome = await job();
      } finally {
        busy.current = false;
        setStep(null);
        onSettled?.(outcome);
      }
    },
    [onSettled],
  );

  // Hasil "rejected" dikembalikan supaya komposer bisa mengembalikan teks.
  const send = useCallback(
    async (pesan: string): Promise<"rejected" | "done"> => {
      if (busy.current || pesan.length === 0) return "done";
      const id = randomHash();
      let rejected = false;
      setTurns((ts) => [...ts, { id, pesan, demo: !VAULT_READY }]);
      await run(async () => {
        // Pesan dipakai persis apa adanya: tanpa trim, tanpa normalisasi.
        setStep("locked");
        const hashPesan = keccak256(toBytes(pesan));

        if (!VAULT_READY) {
          // Mode demo: BE berjalan dengan BAYAR_PALSU=1, tidak ada transaksi.
          const txHash = randomHash();
          patch(id, { recordTx: txHash });
          return deliver(id, txHash, pesan);
        }

        setStep("signing");
        let txHash: Hash;
        try {
          txHash = await writeContractAsync({
            address: VAULT_ADDRESS,
            abi: vaultAbi,
            functionName: "catatPercobaan",
            args: [hashPesan],
            chainId: monadTestnet.id,
          });
        } catch (e) {
          rejected = e instanceof BaseError && !!e.walk((x) => x instanceof UserRejectedRequestError);
          if (rejected) setTurns((ts) => ts.filter((t) => t.id !== id));
          else patch(id, { error: "not_recorded" });
          return;
        }
        patch(id, { recordTx: txHash });
        setStep("recording");
        try {
          const r = await client!.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
          if (r.status !== "success") {
            patch(id, { error: "not_recorded" });
            return;
          }
        } catch {
          // Belum ada receipt: transaksi mungkin masih masuk. Bisa dikirim ulang ke agent nanti.
          patch(id, { error: "receipt_unknown" });
          return;
        }
        patch(id, { recorded: true });
        return deliver(id, txHash, pesan);
      });
      return rejected ? "rejected" : "done";
    },
    [client, writeContractAsync, deliver, run],
  );

  const resend = useCallback(
    async (id: string) => {
      const t = turns.find((x) => x.id === id);
      if (busy.current || !t?.recordTx) return;
      await run(async () => {
        // Receipt catatPercobaan yang belum pasti dicek dulu, supaya percobaan yang gagal tidak dikirim ulang terus.
        if (VAULT_READY && !t.recorded) {
          const r = await client?.getTransactionReceipt({ hash: t.recordTx! }).catch(() => null);
          if (!r) {
            patch(id, { error: "receipt_unknown" });
            return;
          }
          if (r.status !== "success") {
            patch(id, { error: "not_recorded" });
            return;
          }
          patch(id, { recorded: true });
        }
        return deliver(id, t.recordTx!, t.pesan);
      });
    },
    [turns, client, deliver, run],
  );

  return { turns, step, sending: step !== null, send, resend };
}
