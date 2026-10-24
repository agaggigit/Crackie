import { Redis } from "@upstash/redis";
import type { Aksi } from "./agent";

export class GalatPenyimpanan extends Error {}

let _redis: Redis | undefined;
export function redis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) throw new GalatPenyimpanan("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN kosong");
    _redis = new Redis({ url, token });
  }
  return _redis;
}

// --- Kunci agent: satu percobaan diproses pada satu waktu ---
// Kedaluwarsa 90 detik, lebih lama dari maxDuration route (60 detik).
const KUNCI_AGENT = "kunci:agent";
const LEPAS_KALAU_MILIK_SENDIRI = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;

// `nama` dipakai juga oleh faucet (kunci:faucet), karena wallet faucet punya nonce sendiri.
export async function ambilKunci(nama = KUNCI_AGENT): Promise<string | null> {
  const token = crypto.randomUUID();
  const ok = await redis().set(nama, token, { nx: true, ex: 90 });
  return ok ? token : null;
}

export async function lepasKunci(token: string, nama = KUNCI_AGENT): Promise<void> {
  await redis().eval(LEPAS_KALAU_MILIK_SENDIRI, [nama], [token]);
}

// --- Anggaran harian (token LLM), reset 00.00 WIB ---
const WIB = 7 * 3600_000;
export const tanggalWib = () => new Date(Date.now() + WIB).toISOString().slice(0, 10);
const kunciAnggaran = () => `anggaran:${tanggalWib()}`;

function resetPada(): string {
  const w = new Date(Date.now() + WIB);
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate() + 1) - WIB).toISOString();
}

export async function bacaAnggaran() {
  const batas = Number(process.env.BATAS_TOKEN_HARIAN || "0");
  if (!(batas > 0)) throw new GalatPenyimpanan("BATAS_TOKEN_HARIAN kosong");
  const terpakai = Number((await redis().get<number>(kunciAnggaran())) ?? 0);
  return { terpakai, batas, sisa: Math.max(0, batas - terpakai), resetPada: resetPada() };
}

// Penambahan dan kedaluwarsa dalam satu multi, supaya tidak ada penghitung tanpa kedaluwarsa.
export async function tambahAnggaran(token: number): Promise<void> {
  if (token <= 0) return;
  const k = kunciAnggaran();
  await redis().multi().incrby(k, Math.ceil(token)).expire(k, 2 * 86400).exec();
}

// --- Replay: satu `ke` hanya diproses sekali ---
// `ke` mulai dari 1 lagi di setiap deploy, jadi kuncinya menyertakan chain ID dan alamat vault.
export const idPercobaan = (chainId: number, vault: string, ke: bigint | number) =>
  `${chainId}:${vault.toLowerCase()}:${ke}`;

export async function tandaiPercobaan(id: string): Promise<boolean> {
  const ok = await redis().set(`percobaan:${id}`, Date.now(), { nx: true, ex: 30 * 86400 });
  return ok !== null;
}

// --- Detail serangan untuk developer (responsible disclosure) ---
export type Catatan = {
  id: string;
  ke: number | null;
  penyerang: string | null;
  saluran: "publik" | "pemilik";
  pesan: string;
  status: "diproses" | "selesai";
  balasan: string | null;
  aksi: Aksi;
  waktu: string;
  galat?: string;
  palsu?: true;
};

const DAFTAR = "detail:daftar";

export async function simpanCatatan(c: Catatan, baru: boolean): Promise<void> {
  const p = redis().multi().set(`detail:${c.id}`, c, { ex: 30 * 86400 });
  if (baru) p.lpush(DAFTAR, c.id).ltrim(DAFTAR, 0, 999);
  await p.exec();
}

export async function daftarCatatan(batas: number): Promise<Catatan[]> {
  const ids = await redis().lrange<string>(DAFTAR, 0, batas - 1);
  if (ids.length === 0) return [];
  const isi = await redis().mget<(Catatan | null)[]>(...ids.map((id) => `detail:${id}`));
  return isi.filter((c): c is Catatan => c !== null);
}
