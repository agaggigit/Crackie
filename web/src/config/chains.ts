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
  testnet: true,
});

export const OFFICIAL_FAUCET_URL = "https://faucet.monad.xyz";
