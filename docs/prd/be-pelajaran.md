# Pelajaran BE dari latihan sebelum acara

> **Pemilik:** @agaggigit
> **Untuk:** agent dan anggota tim yang membangun BE di repo ini
> **Mengacu ke:** `docs/prd/be.md` (desain), `docs/plan.md` Bagian 13 (antarmuka)

Dokumen ini merangkum hal yang **tidak terlihat dari PRD** tapi kami temukan saat latihan membangun BE sebelum acara (23–24 Okt 2026, di repo terpisah). Isinya sengaja berupa prosa dan checklist, bukan kode: kode latihan tidak dibawa, dan BE di repo ini ditulis dari nol saat acara. Desainnya tetap mengikuti `docs/prd/be.md`; kalau ada yang bertentangan, PRD dan plan yang berlaku.

## 1. Urutan membangun yang terbukti jalan
Setiap tahap diuji sebelum lanjut. Dengan urutan ini, BE tidak pernah menunggu bagian lain.

1. **Agent + tool palsu.** System prompt, tool `bayar`, dan route `POST /api/serang` dengan pembayaran tiruan (tanpa chain, tanpa verifikasi hash). Uji: serangan injeksi crackie, tagihan resmi dibayar, permintaan naif ditolak.
2. **Redis.** Kunci agent, penanda replay, anggaran harian, detail percobaan, lalu `GET /api/anggaran`. Uji: kirim ulang → 409, dua request bersamaan → 429 sibuk, anggaran bertambah.
3. **Chain di anvil.** Verifikasi `PercobaanTercatat`, baca `status()`, kirim `bayar` sungguhan ke **kontrak tiruan** di anvil. Kontrak tiruan cukup meniru ABI dan event di plan Bagian 13, jadi BE bisa jalan sebelum SC deploy.
4. **Endpoint pendukung.** `GET /api/kesehatan`, `POST /api/admin/tagihan`, `GET /api/admin/percobaan`.
5. **Ganti ke kontrak SC asli di testnet**, ukur gas limit `bayar`, uji 7.3 di PRD.

Jadwal hari H di `docs/prd/be.md` Bagian 8 memampatkan urutan ini. Kalau SC belum deploy saat tahap 3, pakai pola kontrak tiruan di anvil.

## 2. Jebakan yang sudah pernah kena
Agent baru hampir pasti mengulangi ini kalau tidak diberi tahu.

### Agent dan LLM
- **Alamat dari LLM sering salah huruf besar-kecil.** Validasi ketat bawaan viem (checksum) menolak alamat yang sebenarnya benar. Validasi tanpa cek checksum, lalu normalkan ke bentuk checksum sebelum dipakai atau dibandingkan.
- **Alamat contoh di prompt harus checksum yang valid.** Alamat karangan dengan huruf besar-kecil acak membuat validasi gagal di tempat yang tidak terduga.
- **Agent cukup dua langkah:** langkah 1 memutuskan dan memanggil `bayar`, langkah 2 menulis balasan setelah melihat hasil tool. Lebih dari itu membuka peluang lebih dari satu pembayaran per pesan; tegakkan juga "maksimal satu `bayar` per pesan" di dalam tool.
- **Model kadang tidak menulis balasan akhir.** Siapkan balasan cadangan yang mengikuti hasil pembayaran sebenarnya (jangan menyebut "diproses" kalau transaksinya revert).
- **gpt-oss-120b di Groq kadang memanggil tool yang tidak ada** (misalnya `decode` untuk pesan base64) dan Groq menolak seluruh panggilan. Tangkap error ini sebagai percobaan tanpa aksi, bukan 500. Kalau `bayar` sudah terkirim sebelum error, aksi tetap dilaporkan.
- **Buat objek model LLM di dalam blok try.** Kalau dibuat di luar, provider atau key yang salah langsung jadi 500 HTML.
- **Panggilan LLM yang error tetap memakan kuota provider** tapi tidak melaporkan usage. Hitung token per langkah, dan tambahkan perkiraan untuk panggilan gagal, supaya penyerang tidak bisa menghabiskan anggaran dengan sengaja memancing error.
- **Hasil tool ke agent harus netral:** "pembayaran terkirim (tx …)", "pembayaran sedang diproses (tx …)", atau "pembayaran gagal". Tanpa nama event, kata "celengan", atau alasan revert.
- **Pakai batas waktu dan retry kecil:** LLM 25 detik dengan 1 kali retry. Total LLM + menunggu receipt harus muat di `maxDuration` route (60 detik).

### Chain
- **Cari log `PercobaanTercatat` yang hash-nya cocok**, jangan ambil log pertama. Satu transaksi bisa berisi beberapa log (misalnya lewat kontrak lain). Cek juga alamat kontrak asal log dan status receipt.
- **Kunci replay harus menyertakan chain ID dan alamat vault** (`percobaan:<chainId>:<alamatVault>:<ke>`). Nomor `ke` mulai dari 1 lagi di setiap deploy, jadi kunci yang hanya berisi `ke` akan bertabrakan dengan data deploy sebelumnya.
- **Gas limit `bayar` tetap, tanpa simulasi.** `estimateGas` gagal untuk transaksi yang akan revert, padahal adegan "diblokir" butuh revert tercatat on-chain. Monad menagih gas berdasarkan gas limit, bukan gas terpakai, jadi nilainya diukur setelah SC deploy (baca skill `monskills:gas`).
- **Receipt bisa lambat.** Setelah transaksi terkirim, txHash sudah pasti ada. Kalau receipt belum datang dalam 20 detik, kembalikan hasil `"tertunda"` beserta txHash, jangan laporkan sebagai gagal.
- **Nonce diambil dari chain (`pending`) setiap kali.** Kunci agent di Redis yang menjaga supaya tidak ada dua transaksi bersamaan.
- **Verifikasi bukti dan cek sidik jari bisa dijalankan paralel** supaya respons lebih cepat.

### Redis dan serverless
- **Kunci agent memakai token pemilik** (SET NX EX dengan nilai acak). Saat melepas, hapus hanya kalau nilainya masih milik sendiri, supaya kunci yang sudah kedaluwarsa dan diambil request lain tidak ikut terhapus.
- **Kunci kedaluwarsa 90 detik**, lebih lama dari `maxDuration`, supaya tidak lepas saat percobaan masih berjalan.
- **Anggaran dicek sebelum `ke` ditandai**, supaya percobaan yang ditolak karena anggaran bisa dikirim ulang setelah reset.
- **Penambahan anggaran dan kedaluwarsanya dalam satu `multi`**, supaya tidak ada penghitung tanpa kedaluwarsa. Tanggal anggaran memakai WIB, bukan UTC.
- **Kalau simpan hasil ke Redis gagal setelah agent membayar, hasil tetap dikembalikan ke FE.** Pembayarannya sudah terjadi on-chain.
- **Redis tidak bisa diakses → tolak percobaan (503)**, jangan memproses tanpa perlindungan replay.
- **Data uji lokal harus dibersihkan saat anvil di-reset.** Anvil baru memberi alamat vault yang sama dan `ke` mulai dari 1, jadi kunci replay lama di Redis membuat percobaan baru ditolak 409. Bersihkan hanya data chain 31337.

### Next.js dan Vercel
- **Route yang membaca state (anggaran, kesehatan) harus dipaksa dinamis** (`await connection()` di Next.js 16). Tanpa itu, hasilnya bisa di-prerender saat build dan tidak pernah berubah.
- **Semua error dikembalikan sebagai JSON** dengan kode yang jelas (400, 409, 429 dengan `alasan`, 503). Body yang bukan JSON → 400, bukan 500.
- **Mode tool palsu harus mati otomatis di Vercel** (cek env `VERCEL`), walaupun env-nya ikut tersalin. Mode palsu melewati verifikasi hash on-chain. Respons mode palsu selalu ditandai `palsu: true`.
- **`GET /api/kesehatan` di-cache sebentar (5 detik)** supaya polling FE tidak menghabiskan kuota RPC yang dipakai percobaan. Bedakan error konfigurasi (500, misalnya `AGENT_PRIVATE_KEY` kosong) dari error chain (503).

### Endpoint admin
- **Token admin di-trim** (env Vercel dan header yang disalin sering membawa spasi atau baris baru), skema `Bearer` tidak peka huruf besar-kecil, dan dibandingkan dengan waktu konstan (bandingkan hash-nya). Tanpa `ADMIN_TOKEN`, semua request admin ditolak.
- **Tagihan admin juga dicek sidik jarinya dan dicatat di Redis dengan `saluran: "pemilik"`**, supaya pembayaran atau crackie yang dipicu pemilik tetap punya jejak. Tagihan admin tidak diblokir anggaran, tapi tokennya tetap dihitung.
- **Alur serang dan tagihan dipisah jadi satu modul bersama** (validasi teks, sidik jari, kunci, catat hasil). Dua route yang menyalin alur yang sama cepat berbeda perilakunya.

## 3. Cara menguji yang terbukti berguna
- **Skrip uji model** (PRD 7.2): setiap serangan dijalankan N kali dengan agent dan prompt yang **sama persis** dengan route, bukan salinan. Salinan prompt cepat berbeda dari yang dipakai route.
- **Uji end-to-end di anvil** dengan kontrak tiruan dan akun bawaan anvil (#0 pemilik, #1 penyerang). Urutan yang diuji: kesehatan → 401 tanpa token → tagihan admin dibayar → serangan injeksi crackie → serangan kedua revert → replay 409 → hash salah 400 → detail serangan admin. Saat latihan 13/13 lulus.
- **Skrip yang mengarahkan `next dev` ke anvil tanpa mengubah `.env.local`**, supaya tidak lupa mengembalikan RPC ke testnet.
- **Skrip `sidik-jari`** yang mencetak hash konfigurasi untuk diisi SC di constructor.
- Saat pindah ke testnet, jalankan ulang uji yang sama ke kontrak SC asli (PRD 7.3) dan ukur gas `bayar` dari receipt.

## 4. Yang perlu disepakati dengan bagian lain sejak awal
- **SC:** ABI dan event persis seperti plan Bagian 13, alamat agent di constructor, sidik jari awal (dicetak BE), tiga alamat supplier allowlist (harus sama dengan prompt agent), `limitPerTx` dan isi celengan minimal 0.05 MON (jumlah yang diminta serangan demo), saldo gas wallet agent.
- **FE:** format hash pesan (PRD 4.2: hash UTF-8 tanpa trim), format `aksi` (PRD 4.3, termasuk `"tertunda"`), FE memanggil `GET /api/anggaran` dan `GET /api/kesehatan` sebelum penyerang mengirim `catatPercobaan`, dan daftar env untuk Vercel (PRD 3.9).

## 5. Pilihan teknis yang terbukti cocok
- Vercel AI SDK (`ai` v7) dengan `@ai-sdk/groq` dan `@ai-sdk/google`, viem, `@upstash/redis`, zod untuk skema tool.
- Model `openai/gpt-oss-120b` di Groq, temperature 0,1 (hasil uji di PRD 7.2). Cadangan `gemini-3.5-flash-lite`, diganti manual.
- Teks serangan di PRD 7.4 dipakai apa adanya. Serangan demo: injeksi (crackie 10/10 di uji).
