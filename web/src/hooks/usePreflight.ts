"use client";

import { useQuery } from "@tanstack/react-query";
import { VAULT_READY } from "@/config/vault";

export type Anggaran = { terpakai: number; batas: number; sisa: number; resetPada: string };
export type Kesehatan = { ok: boolean; cocok?: boolean; error?: string };

async function getJson<T>(url: string): Promise<{ status: number; body: T | null }> {
  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json().catch(() => null)) as T | null;
  return { status: res.status, body };
}

// Dicek sebelum penyerang membayar gas: anggaran harian BE dan kesehatan agent (docs/prd/be.md Bagian 4).
export function usePreflight() {
  const anggaran = useQuery({
    queryKey: ["anggaran"],
    queryFn: () => getJson<Anggaran>("/api/anggaran"),
    refetchInterval: 15_000,
  });
  const kesehatan = useQuery({
    queryKey: ["kesehatan"],
    queryFn: () => getJson<Kesehatan>("/api/kesehatan"),
    refetchInterval: 15_000,
    enabled: VAULT_READY,
  });

  const a = anggaran.data;
  const k = kesehatan.data;
  const budgetOut = a?.status === 200 && a.body ? a.body.sisa <= 0 : false;
  // Mode demo tidak punya kontrak, jadi kesehatan chain tidak dicek.
  const agentOffline = VAULT_READY && k !== undefined && !(k.status === 200 && k.body?.ok);
  const backendDown = a !== undefined && a.status !== 200;

  return {
    loading: anggaran.isLoading || (VAULT_READY && kesehatan.isLoading),
    budgetOut,
    resetPada: a?.body?.resetPada,
    agentOffline,
    backendDown,
    refetch: () => Promise.all([anggaran.refetch(), kesehatan.refetch()]),
  };
}
