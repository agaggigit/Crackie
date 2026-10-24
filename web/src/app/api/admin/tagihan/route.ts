import { cekAdmin } from "@/lib/admin";
import { prosesTagihan } from "@/lib/proses";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!cekAdmin(req)) return Response.json({ error: "token admin tidak valid" }, { status: 401 });
  const input = await req.json().catch(() => undefined);
  const { status, body } = await prosesTagihan(input);
  return Response.json(body, { status });
}
