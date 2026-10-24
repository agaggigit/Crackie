import { prosesSerangan } from "@/lib/proses";

export const maxDuration = 60;

export async function POST(req: Request) {
  const input = await req.json().catch(() => undefined);
  const { status, body } = await prosesSerangan(input);
  return Response.json(body, { status });
}
