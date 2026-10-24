import type { Metadata } from "next";
import { KopiBotCard, YourAgentCard } from "@/components/app/AgentCard";

export const metadata: Metadata = { title: "Agents | Jebol" };

export default function AgentsPage() {
  return (
    <>
      <div className="flex flex-col gap-2 px-1 pb-6 pt-4 sm:pt-6">
        <h1 className="font-head text-[40px] font-semibold tracking-[-0.04em] sm:text-[52px]">Agents</h1>
        <p className="text-[17px] text-ink-2">Pick one and try to make it pay you.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_440px]">
        <KopiBotCard />
        <YourAgentCard />
      </div>
    </>
  );
}
