import type { ReactNode } from "react";
import { AppNav } from "@/components/app/AppNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col px-3.5 pb-6 sm:px-6 lg:px-8">
      <AppNav />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
