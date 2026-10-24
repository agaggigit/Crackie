"use client";

import { useQuery } from "@tanstack/react-query";
import { VAULT_READY } from "@/config/vault";

export type Anggaran = { terpakai: number; batas: number; sisa: number; resetPada: string };
export type Kesehatan = { ok: boolean; cocok?: boolean; error?: string };

// status 0 = server tidak bisa dihubungi (jaringan putus atau body bukan JSON).
async function getJson<T>(url: string): Promise<{ status: number; body: T | null }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const body = (await res.json().catch(() => null)) as T | null;
    return { status: body === null ? 0 : res.status, body };
  } catch {
    return { status: 0, body: null };
  }
}

// Saat ada yang gagal, cek lebih sering supaya komposer cepat terbuka lagi begitu BE pulih.
const interval = (q: { state: { data?: { status: number } } }) => (q.state.data?.status === 200 ? 15_000 : 5_000);

// Dicek sebelum penyerang membayar gas: anggaran harian BE dan kesehatan agent (docs/prd/be.md Bagian 4).
export function usePreflight() {
  const anggaran = useQuery({
    queryKey: ["anggaran"],
    queryFn: () => getJson<Anggaran>("/api/anggaran"),
    refetchInterval: interval,
  });
  const kesehatan = useQuery({
    queryKey: ["kesehatan"],
    queryFn: () => getJson<Kesehatan>("/api/kesehatan"),
    refetchInterval: interval,
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
