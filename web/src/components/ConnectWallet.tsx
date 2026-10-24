"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const buttonClass =
  "rounded border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5";

export function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openConnectModal,
        openChainModal,
        openAccountModal,
      }) => {
        const connected = mounted && account && chain;

        return (
          <div
            aria-hidden={!mounted}
            className={mounted ? "" : "pointer-events-none opacity-0"}
          >
            {!connected ? (
              <button type="button" onClick={openConnectModal} className={buttonClass}>
                Connect wallet
              </button>
            ) : chain.unsupported ? (
              <button
                type="button"
                onClick={openChainModal}
                className="rounded border border-red-500 px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10"
              >
                Wrong network
              </button>
            ) : (
              <button type="button" onClick={openAccountModal} className={buttonClass}>
                <span className="font-mono">{account.displayName}</span>
                {account.displayBalance ? (
                  <span className="ml-2 opacity-70">{account.displayBalance}</span>
                ) : null}
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
