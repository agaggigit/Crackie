import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { monadTestnet, RPC_URL } from "./chains";

const FALLBACK_PROJECT_ID = "crackie-placeholder-project-id";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    "[crackie] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect is off; only browser wallets are available.",
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "Crackie",
  projectId: projectId || FALLBACK_PROJECT_ID,
  // Tanpa project ID asli, konektor WalletConnect gagal (403) dan membuat wagmi tertahan di "reconnecting",
  // sehingga MetaMask yang sudah terhubung tidak bisa dibuka. Jadi hanya wallet browser yang dimuat.
  // Wallet yang terpasang (MetaMask, Rabby) tetap muncul lewat deteksi EIP-6963.
  ...(projectId ? {} : { wallets: [{ groupName: "Browser wallet", wallets: [injectedWallet] }] }),
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(RPC_URL),
  },
  ssr: true,
  // useReadContract yang terpisah digabung lewat Multicall3 supaya tidak kena 429 dari RPC publik.
  batch: { multicall: true },
});
