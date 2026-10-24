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
// Rentang blok per getLogs. RPC publik membatasi rentang, jadi riwayat dibaca mundur per potongan.
const CHUNK = BigInt(process.env.NEXT_PUBLIC_LOG_CHUNK || 1000);
const MAX_CHUNKS = 20;
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

    (async () => {
      try {
        const latest = await client.getBlockNumber();
        last = latest;
        let to = latest;
        const found: VaultEventItem[] = [];
        for (let i = 0; i < MAX_CHUNKS && to >= VAULT_DEPLOY_BLOCK && found.length < MAX_ITEMS; i++) {
          const from = to - CHUNK + 1n > VAULT_DEPLOY_BLOCK ? to - CHUNK + 1n : VAULT_DEPLOY_BLOCK;
          const logs = await getLogs(from, to);
          found.push(...logs.map(toItem).filter((x): x is VaultEventItem => x !== null));
          to = from - 1n;
        }
        if (stop) return;
        merge(await withTimes(found));
        setState("ready");
      } catch {
        if (!stop) setState("error");
      }
    })();

    const id = setInterval(async () => {
      try {
        const latest = await client.getBlockNumber();
        if (latest <= last) return;
        const from = last + 1n > latest - CHUNK + 1n ? last + 1n : latest - CHUNK + 1n;
        const logs = await getLogs(from, latest);
        last = latest;
        const add = logs.map(toItem).filter((x): x is VaultEventItem => x !== null);
        if (add.length && !stop) merge(await withTimes(add));
      } catch {
        // Polling berikutnya mencoba lagi.
      }
    }, POLL_MS);

    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [client]);

  return { items, state, isDemo: !VAULT_READY };
}
