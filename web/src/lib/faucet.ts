import { getAddress, isAddress, parseEther, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { pesanGalat } from "./agent";
import { klienDompet, klienPublik } from "./chain";
import { ambilKunci, lepasKunci, redis, tanggalWib } from "./simpan";

// Faucet mini untuk penonton/juri (docs/prd/fe.md 3.8). Wallet faucet terpisah dari wallet agent
// supaya nonce tidak bentrok. Kode status mengikuti FaucetModal FE:
// 200 { txHash }, 409 sudah pernah / saldo cukup, 429 batas harian, 501 belum disiapkan, 503 gagal.
type Hasil = { status: number; body: Record<string, unknown> };
const hasil = (status: number, body: Record<string, unknown>): Hasil => ({ status, body });

const KUNCI_FAUCET = "kunci:faucet";
const kunciAlamat = (a: string) => `faucet:alamat:${a.toLowerCase()}`;
const kunciHarian = () => `faucet:hari:${tanggalWib()}`;

function akunFaucet() {
  const pk = process.env.FAUCET_PRIVATE_KEY?.trim();
  if (!pk) return null;
  return privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex);
}

// Wallet faucet hanya mengirim dari satu tempat, jadi tunggu sebentar kalau request lain sedang mengirim.
async function tungguKunci(): Promise<string | null> {
  for (let i = 0; i < 20; i++) {
    const t = await ambilKunci(KUNCI_FAUCET);
    if (t) return t;
    await new Promise((s) => setTimeout(s, 500));
  }
  return null;
}

export async function prosesFaucet(input: unknown): Promise<Hasil> {
  const alamatMentah = (input as { alamat?: unknown } | null)?.alamat;
  if (typeof alamatMentah !== "string" || !isAddress(alamatMentah.trim(), { strict: false })) {
    return hasil(400, { error: "alamat tidak valid" });
  }
  const alamat = getAddress(alamatMentah.trim().toLowerCase());

  let akun;
  try {
    akun = akunFaucet();
  } catch {
    return hasil(501, { error: "FAUCET_PRIVATE_KEY tidak valid", alasan: "belum_siap" });
  }
  if (!akun) return hasil(501, { error: "faucet belum disiapkan", alasan: "belum_siap" });

  const jumlah = parseEther(process.env.FAUCET_JUMLAH?.trim() || "0.05");
  const batasHarian = Number(process.env.FAUCET_BATAS_HARIAN?.trim() || "20");

  try {
    if ((await klienPublik().getBalance({ address: alamat })) >= jumlah) {
      return hasil(409, { error: "saldo wallet sudah cukup", alasan: "saldo_cukup" });
    }
  } catch (e) {
    return hasil(503, { error: `chain tidak bisa diakses: ${pesanGalat(e)}` });
  }

  let kunci: string | null;
  try {
    kunci = await tungguKunci();
  } catch (e) {
    return hasil(503, { error: `Redis: ${pesanGalat(e)}` });
  }
  if (!kunci) return hasil(503, { error: "faucet sedang sibuk, coba lagi", alasan: "sibuk" });

  const r = redis();
  let sudahDitandai = false;
  let sudahDihitung = false;
  try {
    if (!(await r.set(kunciAlamat(alamat), Date.now(), { nx: true, ex: 30 * 86400 }))) {
      return hasil(409, { error: "wallet ini sudah pernah menerima", alasan: "sudah_pernah" });
    }
    sudahDitandai = true;
    const [terpakai] = (await r.multi().incr(kunciHarian()).expire(kunciHarian(), 2 * 86400).exec()) as [number, number];
    sudahDihitung = true;
    if (terpakai > batasHarian) {
      await r.multi().decr(kunciHarian()).del(kunciAlamat(alamat)).exec();
      return hasil(429, { error: "batas faucet hari ini habis", alasan: "batas_harian" });
    }

    // Transfer biasa ke EOA: 21.000 gas pas. Monad menagih berdasarkan gas limit.
    const txHash = await klienDompet(akun).sendTransaction({ to: alamat, value: jumlah, gas: 21_000n });
    try {
      await klienPublik().waitForTransactionReceipt({ hash: txHash, timeout: 15_000 });
    } catch {
      // Sudah terkirim; FE cukup menampilkan txHash.
    }
    return hasil(200, { txHash, jumlah: process.env.FAUCET_JUMLAH?.trim() || "0.05" });
  } catch (e) {
    // Belum ada MON yang terkirim: kembalikan penanda supaya wallet ini bisa mencoba lagi.
    const batal = r.multi();
    if (sudahDitandai) batal.del(kunciAlamat(alamat));
    if (sudahDihitung) batal.decr(kunciHarian());
    await batal.exec().catch(() => undefined);
    return hasil(503, { error: `gagal mengirim: ${pesanGalat(e)}` });
  } finally {
    await lepasKunci(kunci, KUNCI_FAUCET).catch(() => undefined);
  }
}
