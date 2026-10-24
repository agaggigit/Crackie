import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { monadTestnet, RPC_URL } from "./chains";

const FALLBACK_PROJECT_ID = "jebol-placeholder-project-id";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    "[jebol] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Using a placeholder; WalletConnect will not work.",
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "Jebol",
  projectId: projectId || FALLBACK_PROJECT_ID,
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(RPC_URL),
  },
  ssr: true,
});
