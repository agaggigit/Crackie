"use client";

import { parseEther } from "viem";
import { useReadContracts } from "wagmi";
import { VAULT_ADDRESS, VAULT_READY, vaultAbi } from "@/config/vault";

// Konfigurasi vault yang jarang berubah: pemilik, agent, limit, minKunci.
export function useVaultConfig() {
  const contract = { address: VAULT_ADDRESS, abi: vaultAbi } as const;
  const q = useReadContracts({
    contracts: [
      { ...contract, functionName: "pemilik" },
      { ...contract, functionName: "agent" },
      { ...contract, functionName: "limitPerTx" },
      { ...contract, functionName: "limitPerJam" },
      { ...contract, functionName: "minKunci" },
    ],
    query: { enabled: VAULT_READY, staleTime: 60_000 },
  });
  if (!VAULT_READY) {
    return { pemilik: undefined, agent: undefined, limitPerTx: parseEther("0.1"), limitPerJam: parseEther("0.5"), minKunci: BigInt(300), isDemo: true };
  }
  const [pemilik, agent, limitPerTx, limitPerJam, minKunci] = (q.data ?? []).map((r) => r.result);
  return {
    pemilik: pemilik as `0x${string}` | undefined,
    agent: agent as `0x${string}` | undefined,
    limitPerTx: limitPerTx as bigint | undefined,
    limitPerJam: limitPerJam as bigint | undefined,
    minKunci: minKunci as bigint | undefined,
    isDemo: false,
  };
}
