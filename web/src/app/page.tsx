import { redirect } from "next/navigation";

// Landing dikerjakan terakhir. Sampai itu, halaman utama langsung ke app.
export default function Home() {
  redirect("/app");
}
