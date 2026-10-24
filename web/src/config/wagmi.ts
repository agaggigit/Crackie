import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { monadTestnet, RPC_URL } from "./chains";

const FALLBACK_PROJECT_ID = "crackie-placeholder-project-id";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    "[crackie] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Using a placeholder; WalletConnect will not work.",
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "Crackie",
  projectId: projectId || FALLBACK_PROJECT_ID,
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(RPC_URL),
  },
  ssr: true,
  // useReadContract yang terpisah digabung lewat Multicall3 supaya tidak kena 429 dari RPC publik.
  batch: { multicall: true },
});
