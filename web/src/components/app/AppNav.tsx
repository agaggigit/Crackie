"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "./ConnectWallet";
import { CrackieLogo } from "./CrackieLogo";
import { FaucetButton } from "./FaucetModal";

const TABS = [
  { href: "/app", label: "Agents", match: (p: string) => p === "/app" || p.startsWith("/app/agent") },
  { href: "/app/pemilik", label: "My agents", match: (p: string) => p.startsWith("/app/pemilik") },
];

export function Logo() {
  return (
    <span className="flex items-center">
      <CrackieLogo className="h-7 w-auto" />
    </span>
  );
}

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 py-4 sm:py-5">
      <Link href="/app" aria-label="Crackie home">
        <Logo />
      </Link>
      <nav aria-label="Main" className="order-3 flex w-full gap-1 rounded-full bg-white p-1 sm:order-none sm:w-auto">
        {TABS.map((t) => {
          const on = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={`flex-1 rounded-full px-4 py-2 text-center text-sm transition-colors sm:flex-none ${
                on ? "bg-navy font-semibold text-white" : "text-ink-2 hover:text-navy"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2">
        <FaucetButton />
        <ConnectWallet />
      </div>
    </header>
  );
}
