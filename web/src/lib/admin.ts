import { createHash, timingSafeEqual } from "node:crypto";

const sha256 = (s: string) => createHash("sha256").update(s).digest();

// Token di-trim, skema Bearer tidak peka huruf besar-kecil, dibandingkan dengan waktu konstan.
// Tanpa ADMIN_TOKEN, semua request admin ditolak.
export function cekAdmin(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN?.trim();
  if (!token) return false;
  const cocok = /^bearer\s+(.+)$/i.exec(req.headers.get("authorization")?.trim() ?? "");
  if (!cocok) return false;
  return timingSafeEqual(sha256(cocok[1].trim()), sha256(token));
}
