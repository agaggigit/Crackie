import { connection } from "next/server";
import { pesanGalat } from "@/lib/agent";
import { bacaAnggaran, GalatPenyimpanan } from "@/lib/simpan";

export async function GET() {
  await connection();
  try {
    return Response.json(await bacaAnggaran());
  } catch (e) {
    const konfigurasi = e instanceof GalatPenyimpanan;
    return Response.json({ error: konfigurasi ? (e as Error).message : `Redis: ${pesanGalat(e)}` }, { status: konfigurasi ? 500 : 503 });
  }
}
