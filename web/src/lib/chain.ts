import {
  createPublicClient,
  createWalletClient,
  defineChain,
  fallback,
  formatEther,
  getAddress,
  http,
  isAddress,
  isAddressEqual,
  keccak256,
  parseEventLogs,
  toBytes,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CRACKIE_VAULT_ADDRESS, crackieVaultAbi } from "@/abi/CrackieVault";
import type { HasilBayar } from "./agent";

export class GalatKonfigurasi extends Error {}
export class BuktiTidakValid extends Error {}

const lokal = () => !process.env.VERCEL;

export const chainId = () => Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "10143");

function rpcUrls(): string[] {
  const utama = process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz";
  return [utama, process.env.RPC_URL_CADANGAN].filter((u): u is string => !!u);
}

const buatChain = () =>
  defineChain({
    id: chainId(),
    name: chainId() === 10143 ? "Monad Testnet" : `Chain ${chainId()}`,
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: rpcUrls() } },
  });
let _chain: ReturnType<typeof buatChain> | undefined;
const chain = () => (_chain ??= buatChain());

const transport = () => fallback(rpcUrls().map((u) => http(u, { timeout: 10_000 })));

const buatKlienPublik = () => createPublicClient({ chain: chain(), transport: transport() });
let _publik: ReturnType<typeof buatKlienPublik> | undefined;
export const klienPublik = () => (_publik ??= buatKlienPublik());

export const klienDompet = (akun: ReturnType<typeof privateKeyToAccount>) =>
  createWalletClient({ account: akun, chain: chain(), transport: transport() });

// CRACKIE_VAULT_ALAMAT hanya untuk kontrak tiruan di anvil, diabaikan di Vercel.
export function alamatVault(): Address {
  const a = (lokal() && process.env.CRACKIE_VAULT_ALAMAT) || CRACKIE_VAULT_ADDRESS;
  if (!isAddress(a, { strict: false }) || isAddressEqual(a, zeroAddress)) {
    throw new GalatKonfigurasi("vault belum di-deploy (alamat di web/src/abi/CrackieVault.ts masih nol)");
  }
  return getAddress(a.toLowerCase());
}

export function akunAgent() {
  const pk = process.env.AGENT_PRIVATE_KEY?.trim();
  if (!pk) throw new GalatKonfigurasi("AGENT_PRIVATE_KEY kosong");
  try {
    return privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex);
  } catch {
    throw new GalatKonfigurasi("AGENT_PRIVATE_KEY tidak valid");
  }
}

export async function verifikasiBukti(txHash: Hex, pesan: string): Promise<{ penyerang: Address; ke: bigint }> {
  const vault = alamatVault();
  let receipt;
  try {
    receipt = await klienPublik().waitForTransactionReceipt({ hash: txHash, timeout: 10_000 });
  } catch (e) {
    const nama = e instanceof Error ? e.name : "";
    if (nama === "WaitForTransactionReceiptTimeoutError" || nama === "TransactionReceiptNotFoundError") {
      throw new BuktiTidakValid("transaksi tidak ditemukan atau belum terkonfirmasi");
    }
    throw e;
  }
  if (receipt.status !== "success") throw new BuktiTidakValid("transaksi catatPercobaan gagal");

  // Cari log yang hash-nya cocok dari alamat vault, bukan log pertama.
  const hash = keccak256(toBytes(pesan)).toLowerCase();
  const log = parseEventLogs({ abi: crackieVaultAbi, eventName: "PercobaanTercatat", logs: receipt.logs }).find(
    (l) => isAddressEqual(l.address, vault) && l.args.hashPesan.toLowerCase() === hash,
  );
  if (!log) throw new BuktiTidakValid("tidak ada PercobaanTercatat dari vault untuk hash pesan ini");
  return { penyerang: log.args.penyerang, ke: log.args.ke };
}

export async function bacaStatus(): Promise<{ aktif: boolean; sidikJari: Hex }> {
  const s = await klienPublik().readContract({ address: alamatVault(), abi: crackieVaultAbi, functionName: "status" });
  return { aktif: s[0], sidikJari: s[8] };
}

export async function saldoGasAgent(): Promise<bigint> {
  return klienPublik().getBalance({ address: akunAgent().address });
}

// Gas limit tetap tanpa simulasi: estimateGas gagal untuk transaksi yang akan revert,
// padahal adegan "diblokir" butuh revert tercatat on-chain. Monad menagih berdasarkan gas limit.
export async function kirimBayar(ke: Address, jumlahWei: bigint): Promise<HasilBayar> {
  const akun = akunAgent();
  const vault = alamatVault();
  const publik = klienPublik();
  const dompet = createWalletClient({ account: akun, chain: chain(), transport: transport() });

  // Nonce dari chain setiap kali; kunci agent di Redis yang mencegah dua transaksi bersamaan.
  const nonce = await publik.getTransactionCount({ address: akun.address, blockTag: "pending" });
  const txHash = await dompet.writeContract({
    address: vault,
    abi: crackieVaultAbi,
    functionName: "bayar",
    args: [ke, jumlahWei],
    gas: BigInt(process.env.GAS_LIMIT_BAYAR || "550000"),
    nonce,
  });

  let receipt;
  try {
    receipt = await publik.waitForTransactionReceipt({ hash: txHash, timeout: 20_000 });
  } catch {
    // Transaksi sudah terkirim; FE membaca hasil sebenarnya dari chain lewat txHash.
    return { txHash, hasil: "tertunda" };
  }
  if (receipt.status !== "success") return { txHash, hasil: "revert" };

  const crackie = parseEventLogs({ abi: crackieVaultAbi, eventName: "Crackie", logs: receipt.logs }).find((l) =>
    isAddressEqual(l.address, vault),
  );
  if (crackie) return { txHash, hasil: "crackie", hadiah: formatEther(crackie.args.hadiah) };
  return { txHash, hasil: "dibayar" };
}
