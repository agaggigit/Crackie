"use client";

import { useMemo } from "react";
import { useStartTime } from "@/hooks/useStartTime";
import { useReadContract } from "wagmi";
import type { Hex } from "viem";
import { VAULT_ADDRESS, VAULT_READY, vaultAbi } from "@/config/vault";
import { demoStatus } from "@/utils/demo";

export type VaultStatus = {
  aktif: boolean;
  danaUtama: bigint;
  celengan: bigint;
  kunciSampai: bigint;
  totalPercobaan: bigint;
  percobaanSejakNyala: bigint;
  bertahanSejak: bigint;
  skor: bigint;
  sidikJari: Hex;
};

// Status vault dibaca langsung dari chain (bukan dari BE), diperbarui tiap 4 detik.
export function useVaultStatus() {
  const query = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "status",
    query: { enabled: VAULT_READY, refetchInterval: 4_000 },
  });

  // Data demo dibuat di browser saja supaya prerender tidak memakai jam.
  const t0 = useStartTime();
  const demo = useMemo(() => (VAULT_READY || t0 === 0 ? null : demoStatus(t0)), [t0]);

  const status: VaultStatus | undefined = useMemo(() => {
    if (!VAULT_READY) return demo ?? undefined;
    if (!query.data) return undefined;
    const [aktif, danaUtama, celengan, kunciSampai, totalPercobaan, percobaanSejakNyala, bertahanSejak, skor, sidikJari] =
      query.data;
    return { aktif, danaUtama, celengan, kunciSampai, totalPercobaan, percobaanSejakNyala, bertahanSejak, skor, sidikJari };
  }, [query.data, demo]);

  return {
    status,
    isDemo: !VAULT_READY,
    isLoading: VAULT_READY && query.isLoading,
    isError: VAULT_READY && query.isError,
    refetch: query.refetch,
  };
}
