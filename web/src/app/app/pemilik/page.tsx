import type { Metadata } from "next";
import { OwnerPanel } from "@/components/app/OwnerPanel";

export const metadata: Metadata = { title: "My agents | Crackie" };

export default function OwnerPage() {
  return <OwnerPanel />;
}
