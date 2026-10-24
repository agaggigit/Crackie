import { connection } from "next/server";
import { formatEther } from "viem";
import { pesanGalat, sidikJariLokal } from "@/lib/agent";
import { akunAgent, alamatVault, bacaStatus, GalatKonfigurasi, saldoGasAgent } from "@/lib/chain";
import { modePalsu } from "@/lib/proses";

// Di-cache 5 detik supaya polling FE tidak menghabiskan kuota RPC yang dipakai percobaan.
let cache: { waktu: number; status: number; body: Record<string, unknown> } | null = null;

async function periksa(): Promise<{ status: number; body: Record<string, unknown> }> {
  const palsu = modePalsu() ? { palsu: true } : {};
  const lokal = sidikJariLokal();
  let alamatAgent: string;
  try {
    alamatAgent = akunAgent().address;
    alamatVault();
  } catch (e) {
    if (e instanceof GalatKonfigurasi) return { status: 500, body: { ok: false, error: e.message, sidikJariLokal: lokal, ...palsu } };
    throw e;
  }
  try {
    const [saldo, { sidikJari }] = await Promise.all([saldoGasAgent(), bacaStatus()]);
    const cocok = sidikJari.toLowerCase() === lokal.toLowerCase();
    return {
      status: 200,
      body: { ok: cocok, alamatAgent, saldoGasAgent: formatEther(saldo), sidikJariLokal: lokal, sidikJariOnChain: sidikJari, cocok, ...palsu },
    };
  } catch (e) {
    return { status: 503, body: { ok: false, error: `chain tidak bisa diakses: ${pesanGalat(e)}`, alamatAgent, sidikJariLokal: lokal, ...palsu } };
  }
}

export async function GET() {
  await connection();
  if (!cache || Date.now() - cache.waktu > 5_000) cache = { waktu: Date.now(), ...(await periksa()) };
  return Response.json(cache.body, { status: cache.status });
}
