import { parseAbi, type Address } from "viem";
import { JEBOL_VAULT_ADDRESS } from "@/abi/JebolVault";

// Subset ABI yang dipakai FE, sesuai docs/prd/sc.md Bagian 4. Diganti jebolVaultAbi dari SC setelah deploy.
export const vaultAbi = parseAbi([
  "function status() view returns (bool aktif, uint256 danaUtama, uint256 celengan, uint256 kunciSampai, uint256 totalPercobaan, uint256 percobaanSejakNyala, uint256 bertahanSejak, uint256 skor, bytes32 sidikJari)",
  "function catatPercobaan(bytes32 hashPesan)",
  "function klaimHadiah()",
  "function setorUtama() payable",
  "function isiCelengan(uint256 kunciSampai) payable",
  "function tarikUtama(uint256 jumlah)",
  "function tarikCelengan()",
  "function aturAllowlist(address alamat, bool boleh)",
  "function aturSidikJari(bytes32 hashKonfigurasi)",
  "function nyalakanLagi(bytes32 sidikJariBaru)",
  "function aturErc8004(address registry, uint256 agentId)",
  "function pemilik() view returns (address)",
  "function agent() view returns (address)",
  "function limitPerTx() view returns (uint256)",
  "function limitPerJam() view returns (uint256)",
  "function minKunci() view returns (uint256)",
  "function blokDeploy() view returns (uint256)",
  "function allowlist(address) view returns (bool)",
  "function hadiahTertunda(address) view returns (uint256)",
  "event PercobaanTercatat(address indexed penyerang, bytes32 hashPesan, uint256 ke)",
  "event Dibayar(address indexed ke, uint256 jumlah)",
  "event Jebol(address indexed penemu, uint256 hadiah, bytes32 sidikJari)",
  "event WewenangDicabut()",
  "event DinyalakanLagi(bytes32 sidikJari)",
  "event SidikJariDiganti(bytes32 sidikJari)",
]);

const ALAMAT_NOL = "0x0000000000000000000000000000000000000000";

// NEXT_PUBLIC_JEBOL_VAULT_ALAMAT hanya untuk uji lokal (anvil). Di testnet alamat dari web/src/abi/JebolVault.ts.
export const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_JEBOL_VAULT_ALAMAT ||
  JEBOL_VAULT_ADDRESS) as Address;

// Blok awal untuk getLogs. Diganti JEBOL_VAULT_DEPLOY_BLOCK dari SC setelah deploy.
export const VAULT_DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_JEBOL_VAULT_BLOK || 0);

// Selama kontrak belum ada, UI memakai data demo yang ditandai jelas.
export const VAULT_READY = VAULT_ADDRESS.toLowerCase() !== ALAMAT_NOL;

// Supplier di allowlist KopiBot (kesepakatan BE dan SC, ikut sidik jari agent).
export const SUPPLIERS: { name: string; address: Address }[] = [
  { name: "Toko Biji Kopi Merapi", address: "0x1111a7c0f1e2D3B4A5968778695A4B3C2D1E0f11" },
  { name: "Susu Segar Kaliurang", address: "0x2222b8d1A2F3E4c5b6079889706b5c4D3e2F1A22" },
  { name: "Gula Aren Kulon Progo", address: "0x3333C9e2b3A4f5D6c7180990817C6d5e4f3a2b33" },
];
