import { prosesFaucet } from "@/lib/faucet";

export const maxDuration = 30;

export async function POST(req: Request) {
  const input = await req.json().catch(() => undefined);
  const { status, body } = await prosesFaucet(input);
  return Response.json(body, { status });
}
