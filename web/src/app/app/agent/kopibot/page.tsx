import type { Metadata } from "next";
import { AgentRoom } from "@/components/app/AgentRoom";

export const metadata: Metadata = { title: "KopiBot | Crackie" };

export default function KopiBotPage() {
  return <AgentRoom />;
}
