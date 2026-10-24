import type { Metadata } from "next";
import { PlaceholderSection } from "@/components/PlaceholderSection";

export const metadata: Metadata = {
  title: "Owner panel | Jebol",
};

export default function OwnerPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Owner panel</h1>
      <PlaceholderSection
        title="Owner actions"
        description="Deposit, fund the bounty vault, withdraw, allowlist, config fingerprint and re-enable agent will be here."
      />
    </div>
  );
}
