import { defineChain } from "viem";

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.monadexplorer.com";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 10143);

// 31337 hanya untuk uji lokal di anvil (lihat web/scripts/dev-anvil.mjs).
export const monadTestnet = defineChain({
  id: CHAIN_ID,
  name: CHAIN_ID === 31337 ? "Anvil" : "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: EXPLORER_URL },
  },
  // Multicall3 menggabungkan banyak pembacaan kontrak jadi satu eth_call (RPC publik Monad membatasi request).
  // Anvil tidak punya Multicall3, jadi hanya dipasang untuk Monad testnet.
  ...(CHAIN_ID === 10143
    ? { contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" as const, blockCreated: 251449 } } }
    : {}),
  testnet: true,
});

export const OFFICIAL_FAUCET_URL = "https://faucet.monad.xyz";
