import { connection } from "next/server";
import { cekAdmin } from "@/lib/admin";
import { pesanGalat } from "@/lib/agent";
import { daftarCatatan, GalatPenyimpanan } from "@/lib/simpan";

export async function GET(req: Request) {
  await connection();
  if (!cekAdmin(req)) return Response.json({ error: "token admin tidak valid" }, { status: 401 });

  const diminta = Number(new URL(req.url).searchParams.get("batas") ?? "50");
  const batas = Number.isInteger(diminta) ? Math.min(200, Math.max(1, diminta)) : 50;
  try {
    const daftar = await daftarCatatan(batas);
    return Response.json(
      daftar.map(({ ke, penyerang, saluran, pesan, status, balasan, aksi, waktu, galat, palsu }) => ({
        ke, penyerang, saluran, pesan, status, balasan, aksi, waktu,
        ...(galat && { galat }),
        ...(palsu && { palsu }),
      })),
    );
  } catch (e) {
    const konfigurasi = e instanceof GalatPenyimpanan;
    return Response.json({ error: konfigurasi ? (e as Error).message : `Redis: ${pesanGalat(e)}` }, { status: konfigurasi ? 500 : 503 });
  }
}
