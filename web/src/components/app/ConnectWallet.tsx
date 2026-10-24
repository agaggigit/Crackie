"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Chip } from "@/components/ui/Chip";

export function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal, openChainModal, openAccountModal }) => {
        const connected = mounted && account && chain;
        return (
          <div aria-hidden={!mounted} className={`flex items-center gap-2 ${mounted ? "" : "pointer-events-none opacity-0"}`}>
            <Chip className="hidden md:inline-flex">Testnet</Chip>
            {!connected ? (
              <button
                type="button"
                onClick={openConnectModal}
                className="h-10 rounded-full bg-navy px-4 text-sm font-semibold text-white hover:bg-[#1a2a55]"
              >
                Connect wallet
              </button>
            ) : chain.unsupported ? (
              <button
                type="button"
                onClick={openChainModal}
                className="h-10 rounded-full bg-warn-bg px-4 text-sm font-semibold text-warn"
              >
                Switch network
              </button>
            ) : (
              <button
                type="button"
                onClick={openAccountModal}
                className="flex h-10 items-center gap-2 rounded-full bg-white pl-1.5 pr-4 text-[13px] hover:bg-cream"
              >
                <span aria-hidden className="size-7 rounded-full bg-gradient-to-b from-peach to-orange" />
                <span className="font-mono">{account.displayName}</span>
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
