import { parseEther, type Address } from "viem";
import type { VaultStatus } from "@/hooks/useVaultStatus";

// Data demo dipakai selama kontrak SC belum di-deploy. Semua layar yang memakainya menampilkan label "Demo data".
export function demoStatus(t: number): VaultStatus {
  return {
    aktif: true,
    danaUtama: parseEther("2"),
    celengan: parseEther("0.2"),
    kunciSampai: BigInt(t + 4 * 60),
    totalPercobaan: BigInt(37),
    percobaanSejakNyala: BigInt(14),
    bertahanSejak: BigInt(t - 192),
    skor: BigInt(Math.round(0.62 * 3600)) * BigInt(1e18),
    sidikJari: "0x23ac36e03ebf895cff4870f75ec9793be60faa80eb5fb6f04a8a164c23459286",
  };
}

export const DEMO_OWNER: Address = "0x0000000000000000000000000000000000000000";

// Riwayat demo, relatif terhadap waktu mulai t.
export function demoEvents(t: number): import("@/hooks/useVaultEvents").VaultEventItem[] {
  const tx = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;
  return [
    { id: "d1", kind: "try", ke: BigInt(37), penyerang: "0xA1b2000000000000000000000000000000009F3e", hashPesan: tx, block: BigInt(4), tx, time: t - 60 },
    { id: "d2", kind: "paid", ke: "0x1111a7c0f1e2D3B4A5968778695A4B3C2D1E0f11", jumlah: BigInt(3e16), block: BigInt(3), tx, time: t - 180 },
    { id: "d3", kind: "try", ke: BigInt(36), penyerang: "0x77E0000000000000000000000000000000002b14", hashPesan: tx, block: BigInt(2), tx, time: t - 420 },
    { id: "d4", kind: "setup", block: BigInt(1), tx, time: t - 720 },
  ];
}
