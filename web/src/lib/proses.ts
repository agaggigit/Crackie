import { formatEther, getAddress, parseEther, zeroAddress, type Address, type Hex } from "viem";
import { jalankanAgent, pesanGalat, sidikJariLokal, SUPPLIER, type Eksekutor, type HasilBayar } from "./agent";
import { alamatVault, bacaStatus, BuktiTidakValid, chainId, GalatKonfigurasi, kirimBayar, verifikasiBukti } from "./chain";
import {
  ambilKunci,
  bacaAnggaran,
  GalatPenyimpanan,
  idPercobaan,
  lepasKunci,
  redis,
  simpanCatatan,
  tambahAnggaran,
  tandaiPercobaan,
  type Catatan,
} from "./simpan";

export type Hasil = { status: number; body: Record<string, unknown> };
const hasil = (status: number, body: Record<string, unknown>): Hasil => ({ status, body });

// ⚠️ MODE PALSU: tool bayar tanpa chain dan tanpa verifikasi hash, hanya untuk lokal selama
// CrackieVault belum tersambung. Selalu mati di Vercel, dan respons ditandai `palsu: true`.
export const modePalsu = () => process.env.BAYAR_PALSU === "1" && !process.env.VERCEL;

const bayarPalsu: Eksekutor = async (ke, jumlahWei): Promise<HasilBayar> => {
  const diAllowlist = SUPPLIER.some((s) => getAddress(s.alamat) === ke);
  if (diAllowlist) return { txHash: null, hasil: "dibayar" };
  const hadiah = jumlahWei < parseEther("0.05") ? jumlahWei : parseEther("0.05");
  return { txHash: null, hasil: "crackie", hadiah: formatEther(hadiah) };
};

function galatKe(e: unknown): Hasil {
  if (e instanceof BuktiTidakValid) return hasil(400, { error: e.message, alasan: "bukti" });
  if (e instanceof GalatKonfigurasi) return hasil(500, { error: e.message, alasan: "konfigurasi" });
  if (e instanceof GalatPenyimpanan) return hasil(500, { error: e.message, alasan: "konfigurasi" });
  return hasil(503, { error: `layanan tidak bisa diakses: ${pesanGalat(e)}`, alasan: "layanan" });
}

function validasiTeks(nilai: unknown, nama: string): string | Hasil {
  if (typeof nilai !== "string" || nilai.trim().length === 0) return hasil(400, { error: `${nama} wajib diisi` });
  const batas = Number(process.env.BATAS_PANJANG_PESAN || "2000");
  if (nilai.length > batas) return hasil(400, { error: `${nama} lebih dari ${batas} karakter` });
  return nilai;
}

// Rating tidak boleh tercatat untuk konfigurasi yang berbeda dari yang sedang berjalan.
async function cekSidikJari(): Promise<Hasil | null> {
  const { sidikJari } = await bacaStatus();
  const lokal = sidikJariLokal();
  if (sidikJari.toLowerCase() === lokal.toLowerCase()) return null;
  return hasil(503, {
    error: "sidik jari agent tidak cocok dengan yang tercatat on-chain",
    alasan: "sidik_jari",
    sidikJariLokal: lokal,
    sidikJariOnChain: sidikJari,
  });
}

type Jalankan = {
  catatan: Omit<Catatan, "status" | "balasan" | "aksi" | "waktu">;
  blokirAnggaran: boolean;
  tandai: boolean;
};

async function jalankanDenganKunci({ catatan, blokirAnggaran, tandai }: Jalankan): Promise<Hasil> {
  let kunci: string | null;
  try {
    kunci = await ambilKunci();
  } catch (e) {
    return galatKe(e instanceof GalatPenyimpanan ? e : new Error(`Redis: ${pesanGalat(e)}`));
  }
  if (!kunci) return hasil(429, { error: "agent sedang memproses, coba lagi sebentar", alasan: "sibuk" });

  try {
    try {
      // Anggaran dicek sebelum `ke` ditandai, supaya percobaan yang ditolak bisa dikirim ulang setelah reset.
      if (blokirAnggaran) {
        const a = await bacaAnggaran();
        if (a.sisa <= 0) return hasil(429, { error: "anggaran harian habis", alasan: "anggaran_habis", ...a });
      }
      if (tandai && !(await tandaiPercobaan(catatan.id))) {
        return hasil(409, { error: "percobaan ini sudah diproses", alasan: "replay" });
      }
      await simpanCatatan({ ...catatan, status: "diproses", balasan: null, aksi: null, waktu: new Date().toISOString() }, true);
    } catch (e) {
      // Redis tidak bisa diakses → tolak, jangan memproses tanpa perlindungan replay.
      return galatKe(e instanceof GalatPenyimpanan ? e : new Error(`Redis: ${pesanGalat(e)}`));
    }

    const r = await jalankanAgent(catatan.pesan, modePalsu() ? bayarPalsu : kirimBayar);

    // Pembayaran sudah terjadi on-chain: kalau Redis gagal di sini, hasil tetap dikembalikan.
    try {
      await tambahAnggaran(r.token);
      await simpanCatatan(
        { ...catatan, status: "selesai", balasan: r.balasan, aksi: r.aksi, waktu: new Date().toISOString(), ...(r.galat && { galat: r.galat }) },
        false,
      );
    } catch (e) {
      console.error("gagal menyimpan hasil percobaan", catatan.id, pesanGalat(e));
    }
    if (r.galat) console.warn("percobaan", catatan.id, r.galat);

    return hasil(200, {
      ...(catatan.saluran === "publik" && { ke: catatan.ke, penyerang: catatan.penyerang }),
      balasan: r.balasan,
      aksi: r.aksi,
      ...(catatan.palsu && { palsu: true }),
    });
  } finally {
    await lepasKunci(kunci).catch((e) => console.error("gagal melepas kunci", pesanGalat(e)));
  }
}

// POST /api/serang
export async function prosesSerangan(input: unknown): Promise<Hasil> {
  if (typeof input !== "object" || input === null) return hasil(400, { error: "body harus JSON { txHash, pesan }" });
  const { txHash, pesan: p } = input as { txHash?: unknown; pesan?: unknown };
  const pesan = validasiTeks(p, "pesan");
  if (typeof pesan !== "string") return pesan;

  if (modePalsu()) {
    const ke = await redis().incr("palsu:ke").catch(() => null);
    if (ke === null) return galatKe(new Error("Redis tidak bisa diakses"));
    return jalankanDenganKunci({
      catatan: { id: `palsu:${ke}`, ke, penyerang: zeroAddress, saluran: "publik", pesan, palsu: true },
      blokirAnggaran: true,
      tandai: true,
    });
  }

  if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return hasil(400, { error: "txHash tidak valid" });
  }

  let penyerang: Address;
  let ke: bigint;
  let vault: Address;
  try {
    vault = alamatVault();
    const [bukti, salah] = await Promise.all([verifikasiBukti(txHash as Hex, pesan), cekSidikJari()]);
    if (salah) return salah;
    ({ penyerang, ke } = bukti);
  } catch (e) {
    return galatKe(e);
  }

  return jalankanDenganKunci({
    catatan: { id: idPercobaan(chainId(), vault, ke), ke: Number(ke), penyerang, saluran: "publik", pesan },
    blokirAnggaran: true,
    tandai: true,
  });
}

// POST /api/admin/tagihan: saluran operasional pemilik, bukan percobaan (docs/prd/be.md 3.8).
export async function prosesTagihan(input: unknown): Promise<Hasil> {
  if (typeof input !== "object" || input === null) return hasil(400, { error: "body harus JSON { teks }" });
  const teks = validasiTeks((input as { teks?: unknown }).teks, "teks");
  if (typeof teks !== "string") return teks;

  if (!modePalsu()) {
    try {
      const salah = await cekSidikJari();
      if (salah) return salah;
    } catch (e) {
      return galatKe(e);
    }
  }

  return jalankanDenganKunci({
    catatan: {
      id: `pemilik:${crypto.randomUUID()}`,
      ke: null,
      penyerang: null,
      saluran: "pemilik",
      pesan: teks,
      ...(modePalsu() && { palsu: true as const }),
    },
    blokirAnggaran: false,
    tandai: false,
  });
}
