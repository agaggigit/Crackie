import Link from "next/link";
import { ConnectWallet } from "./ConnectWallet";

export function Header() {
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            Jebol
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="hover:underline">
              Challenge
            </Link>
            <Link href="/pemilik" className="hover:underline">
              Owner panel
            </Link>
          </nav>
        </div>
        <ConnectWallet />
      </div>
    </header>
  );
}
