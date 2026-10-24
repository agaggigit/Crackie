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
