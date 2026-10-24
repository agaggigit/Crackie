import { PlaceholderSection } from "@/components/PlaceholderSection";

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <PlaceholderSection
        title="Live status"
        description="Main funds, bounty vault, agent authority, score and attempts will be read from the chain here."
      />
      <PlaceholderSection
        title="Attack console"
        description="Write a message, record the attempt on-chain, and see the agent's reply here."
      />
      <PlaceholderSection
        title="Event history"
        description="Contract events (attempts, payments, breaches) will be listed here."
      />
    </div>
  );
}
