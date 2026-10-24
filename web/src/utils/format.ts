import { formatEther, type Address, type Hash } from "viem";
import { EXPLORER_URL } from "@/config/chains";
import { SUPPLIERS } from "@/config/vault";

// Saldo dalam MON, dipecah jadi bagian bulat dan desimal supaya desimalnya bisa dipudarkan.
// Maksimal 4 desimal (docs/prd/fe.md Bagian 3.4), nol di belakang dibuang sampai minimal 2.
export function splitMon(wei: bigint, decimals = 4): { int: string; dec: string } {
  const [int, frac = ""] = formatEther(wei).split(".");
  let dec = (frac + "0".repeat(decimals)).slice(0, decimals);
  while (dec.length > 2 && dec.endsWith("0")) dec = dec.slice(0, -1);
  return { int, dec: decimals > 0 ? `.${dec}` : "" };
}

export function formatMon(wei: bigint, decimals = 4): string {
  const { int, dec } = splitMon(wei, decimals);
  return `${int}${dec}`;
}

// Skor dari kontrak dalam wei·detik. Ditampilkan sebagai MON·jam (docs/plan.md Bagian 4.5).
export function formatScore(skor: bigint): string {
  const monJam = Number(skor) / 1e18 / 3600;
  if (monJam === 0) return "0";
  if (monJam < 0.01) return "<0.01";
  return monJam.toFixed(2);
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatAgo(timestampSec: number, nowSec: number): string {
  const diff = Math.max(0, nowSec - timestampSec);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return formatDate(timestampSec);
}

// Tanggal tanpa jam, sesuai aturan copy (docs/desain-fe.md Bagian 3).
export function formatDate(timestampSec: number): string {
  return new Date(timestampSec * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const txUrl = (hash: Hash | string) => `${EXPLORER_URL}/tx/${hash}`;
export const addressUrl = (address: Address | string) => `${EXPLORER_URL}/address/${address}`;

export const supplierName = (address: string) => SUPPLIERS.find((s) => s.address.toLowerCase() === address.toLowerCase())?.name;
