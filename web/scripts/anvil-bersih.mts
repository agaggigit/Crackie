// npm run anvil:bersih
// Hapus data uji anvil (chain 31337) dari Redis. Anvil baru memberi alamat vault yang sama dan `ke`
// mulai dari 1, jadi kunci replay lama membuat percobaan baru ditolak 409. Data chain lain tidak disentuh.
import { redis } from "../src/lib/simpan";

const r = redis();
let dihapus = 0;
for (const pola of ["percobaan:31337:*", "detail:31337:*"]) {
  let kursor = "0";
  do {
    const [lanjut, kunci] = await r.scan(kursor, { match: pola, count: 500 });
    kursor = String(lanjut);
    if (kunci.length) dihapus += await r.del(...kunci);
  } while (kursor !== "0");
}
const daftar = await r.lrange<string>("detail:daftar", 0, -1);
const lama = daftar.filter((id) => id.startsWith("31337:"));
for (const id of lama) await r.lrem("detail:daftar", 0, id);
console.log(`dihapus ${dihapus} kunci dan ${lama.length} entri daftar milik chain 31337`);
