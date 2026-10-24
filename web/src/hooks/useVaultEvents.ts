"use client";

import { useEffect, useRef, useState } from "react";
import { usePublicClient } from "wagmi";
import type { Address, Hash, Hex } from "viem";
import { VAULT_ADDRESS, VAULT_DEPLOY_BLOCK, VAULT_READY, vaultAbi } from "@/config/vault";

export type VaultEvent =
  | { kind: "try"; ke: bigint; penyerang: Address; hashPesan: Hex }
  | { kind: "paid"; ke: Address; jumlah: bigint }
  | { kind: "broke"; penemu: Address; hadiah: bigint }
  | { kind: "stopped" }
  | { kind: "restarted" }
  | { kind: "setup" };

export type VaultEventItem = VaultEvent & { id: string; block: bigint; tx: Hash; time?: number };

const MAX_ITEMS = 30;
// RPC publik Monad membatasi eth_getLogs 100 blok per panggilan, jadi riwayat dibaca per potongan.
const CHUNK = BigInt(process.env.NEXT_PUBLIC_LOG_CHUNK || 100);
// Batas potongan saat membaca riwayat lama (±600 × 100 blok) dan jumlah panggilan paralel.
const MAX_CHUNKS = 600;
const PARALLEL = 8;
// Batas potongan per polling, supaya tab yang lama di latar belakang tetap mengejar sedikit demi sedikit.
const MAX_CHUNKS_PER_POLL = 30;
const POLL_MS = 4_000;

type RawLog = {
  eventName: string;
  args: Record<string, unknown>;
  blockNumber: bigint | null;
  transactionHash: Hash | null;
  logIndex: number | null;
};

function toItem(l: RawLog): VaultEventItem | null {
  if (l.blockNumber == null || l.transactionHash == null) return null;
  const base = { id: `${l.transactionHash}-${l.logIndex}`, block: l.blockNumber, tx: l.transactionHash };
  const a = l.args;
  switch (l.eventName) {
    case "PercobaanTercatat":
      return { ...base, kind: "try", ke: a.ke as bigint, penyerang: a.penyerang as Address, hashPesan: a.hashPesan as Hex };
    case "Dibayar":
      return { ...base, kind: "paid", ke: a.ke as Address, jumlah: a.jumlah as bigint };
    case "Jebol":
      return { ...base, kind: "broke", penemu: a.penemu as Address, hadiah: a.hadiah as bigint };
    case "WewenangDicabut":
      return { ...base, kind: "stopped" };
    case "DinyalakanLagi":
      return { ...base, kind: "restarted" };
    case "SidikJariDiganti":
      return { ...base, kind: "setup" };
    default:
      return null;
  }
}

function sortDesc(items: VaultEventItem[]) {
  return [...items].sort((a, b) => (a.block === b.block ? b.id.localeCompare(a.id) : a.block > b.block ? -1 : 1));
}

// Riwayat event vault: dibaca dari blok deploy (mundur per potongan), lalu event baru di-polling.
export function useVaultEvents() {
  const client = usePublicClient();
  const [items, setItems] = useState<VaultEventItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">(VAULT_READY ? "loading" : "ready");
  const times = useRef(new Map<bigint, number>());

  useEffect(() => {
    if (!VAULT_READY || !client) return;
    let stop = false;
    let last = 0n;

    const withTimes = async (list: VaultEventItem[]) => {
      const need = [...new Set(list.map((i) => i.block))].filter((b) => !times.current.has(b));
      await Promise.all(
        need.map(async (b) => {
          const blk = await client.getBlock({ blockNumber: b }).catch(() => null);
          if (blk) times.current.set(b, Number(blk.timestamp));
        }),
      );
      return list.map((i) => ({ ...i, time: times.current.get(i.block) }));
    };

    const getLogs = (fromBlock: bigint, toBlock: bigint) =>
      client.getContractEvents({ address: VAULT_ADDRESS, abi: vaultAbi, fromBlock, toBlock }) as Promise<RawLog[]>;

    const merge = (add: VaultEventItem[]) =>
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return sortDesc([...prev, ...add.filter((a) => !seen.has(a.id))]).slice(0, MAX_ITEMS);
      });

    // Satu potongan dicoba dua kali. Kalau tetap gagal, dilewati supaya riwayat lain tetap tampil.
    const getLogsSafe = async (f: bigint, t: bigint) => {
      for (let i = 0; i < 2; i++) {
        try {
          return await getLogs(f, t);
        } catch {
          // dicoba lagi
        }
      }
      failed = true;
      return [] as RawLog[];
    };
    let failed = false;

    (async () => {
      try {
        const latest = await client.getBlockNumber();
        last = latest;
        // Blok awal: dari env, kalau kosong dibaca dari blokDeploy() di kontrak, kalau gagal dibatasi MAX_CHUNKS potongan.
        let start = VAULT_DEPLOY_BLOCK;
        if (start === 0n) {
          start = await client
            .readContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "blokDeploy" })
            .catch(() => (latest > CHUNK * BigInt(MAX_CHUNKS) ? latest - CHUNK * BigInt(MAX_CHUNKS) : 0n));
        }
        // Riwayat dibaca mundur dari blok terbaru, beberapa potongan sekaligus, dan ditampilkan per gelombang.
        let to = latest;
        let chunks = 0;
        let total = 0;
        while (to >= start && total < MAX_ITEMS && chunks < MAX_CHUNKS && !stop) {
          const ranges: [bigint, bigint][] = [];
          for (let i = 0; i < PARALLEL && to >= start; i++) {
            const from = to - CHUNK + 1n > start ? to - CHUNK + 1n : start;
            ranges.push([from, to]);
            to = from - 1n;
          }
          chunks += ranges.length;
          const results = await Promise.all(ranges.map(([f, t]) => getLogsSafe(f, t)));
          const found = results.flat().map(toItem).filter((x): x is VaultEventItem => x !== null);
          total += found.length;
          if (found.length && !stop) merge(await withTimes(found));
          if (chunks === ranges.length && !stop) setState("ready");
        }
        if (!stop) setState(failed && total === 0 ? "error" : "ready");
      } catch {
        if (!stop) setState("error");
      }
    })();

    const id = setInterval(async () => {
      try {
        const latest = await client.getBlockNumber();
        // Maju dari blok terakhir yang sudah dibaca, maksimal CHUNK blok per panggilan. `last` hanya maju sejauh yang berhasil dibaca.
        for (let i = 0; i < MAX_CHUNKS_PER_POLL && last < latest && !stop; i++) {
          const from = last + 1n;
          const to = from + CHUNK - 1n < latest ? from + CHUNK - 1n : latest;
          const logs = await getLogs(from, to);
          last = to;
          const add = logs.map(toItem).filter((x): x is VaultEventItem => x !== null);
          if (add.length) merge(await withTimes(add));
        }
      } catch {
        // Polling berikutnya mencoba lagi dari `last`.
      }
    }, POLL_MS);

    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [client]);

  return { items, state, isDemo: !VAULT_READY };
}
