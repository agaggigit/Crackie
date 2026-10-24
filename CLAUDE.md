# CLAUDE.md

Panduan untuk AI agent (Claude Code dan sejenisnya) yang bekerja di repo ini. Berlaku untuk semua anggota tim.

## Proyek
**Jebol**: modul alarm untuk AI agent yang memegang uang, dibuat di Monad Blitz Jogja Vol. 2 (Sabtu, 24 Oktober 2026). Kalau ada yang berhasil membujuk agent membayar ke alamat di luar allowlist, pembayaran itu diambil dari celengan bounty, dan wewenang agent dicabut di transaksi yang sama.

## Sumber kebenaran
1. `docs/plan.md`: rencana final. Kalau ada yang bertentangan, yang berlaku dokumen ini.
2. `docs/prd/sc.md`, `docs/prd/be.md`, `docs/prd/fe.md`: detail per bagian (sudah disetujui).
3. `docs/prd/be-pelajaran.md`: jebakan dan urutan kerja BE yang sudah teruji. **Wajib dibaca sebelum mengerjakan BE.**
4. `docs/alur-kerja.md`: cara kerja tim (branch, PR, review).

Baca `docs/plan.md` dan PRD bagian terkait sebelum mengerjakan apa pun.

## Tim
| Peran | Orang |
|---|---|
| Smart Contract | @razaqialkautsar |
| Agent + Backend | @agaggigit |
| Frontend + Pitch | @Nabil-Aufa |

## Monad
- Jaringan: **Monad testnet, chain ID 10143**, RPC `https://testnet-rpc.monad.xyz`. Jangan memakai chain ID, RPC, atau alamat dari chain lain.
- Untuk hal khusus Monad (gas, deploy, verifikasi, alamat, tooling), pakai skill **monskills**, mulai dari `monskills:monskill`. Jangan memakai skill Celo walaupun terpasang.
- Monad menagih gas berdasarkan **gas limit**, bukan gas terpakai. Baca `monskills:gas` sebelum menyetel gas limit.
- Wallet: ikuti pilihan di `docs/prd/fe.md`. Jangan otomatis memakai Para dari `monskills:wallet-integration` kalau PRD FE memilih yang lain.

## Struktur repo
Sesuai `docs/plan.md` Bagian 13: `contracts/` (Foundry) dan `web/` (Next.js 16, App Router, TS, Tailwind, npm). Bukan monorepo workspace. Kepemilikan folder ada di `docs/plan.md` Bagian 13.

## Aturan untuk agent

### Saat coding
- Kerjakan hanya bagian milik pengguna. Jangan mengubah folder bagian lain tanpa diminta.
- Ikuti urutan kerja dan target jam di PRD masing-masing (Bagian 8). Bangun bertahap dan uji setiap tahap sebelum lanjut.
- Jangan mengubah kontrak antar-bagian (`docs/plan.md` Bagian 13: ABI, event, endpoint) diam-diam. Kalau perlu, perbarui plan + PRD di PR yang sama dan ingatkan pengguna untuk mengumumkannya.
- Jangan menambah fitur di luar MVP tanpa kesepakatan tim. Kalau waktu kurang, potong sesuai PRD Bagian 9, jangan memotong yang ditandai "tidak boleh dipotong".
- Jangan pernah commit rahasia (private key, API key, `.env`, `.env.local`). Nama env mengikuti PRD (BE: `docs/prd/be.md` Bagian 3.9).
- Mock harus ditandai jelas, di kode maupun di respons/UI, dan tidak boleh aktif di deploy Vercel.
- Branch: `sc/<topik>`, `be/<topik>`, `fe/<topik>`, `docs/<topik>`. Jangan push langsung ke `main`.
- Deploy ke Vercel sedini mungkin, lalu deploy ulang setiap kali ada bagian yang tersambung.

### Saat mereview PR
1. Ambil diff-nya (`gh pr diff <N>`) dan baca deskripsinya.
2. Bandingkan dengan `docs/plan.md`, PRD bagian terkait, dan checklist di `docs/alur-kerja.md`.
3. Laporkan: bug, pelanggaran plan/PRD, perubahan antarmuka yang tidak diumumkan, fitur di luar MVP, rahasia di diff, dan teks yang melanggar tabel klaim.
4. Hal yang wajib dicek per bagian:
   - **SC:** alarm + pencabutan wewenang atomik; pemilik selalu bisa menarik dana utama; celengan terkunci sampai waktunya; reentrancy; test Foundry untuk jalur normal, alarm, dan setelah jebol.
   - **BE:** agent tidak diberi tahu soal celengan; pesan hanya diproses kalau hash-nya tercatat on-chain; perlindungan replay; anggaran harian; private key dari env; jebakan di `docs/prd/be-pelajaran.md` Bagian 2.
   - **FE:** data dibaca dari chain; mock ditandai jelas.

### Klaim dan bahasa
- Ikuti tabel klaim di `docs/plan.md` Bagian 6, termasuk untuk teks UI, README, dan slide.
- Jangan pakai kata "taruhan", "jackpot", "tiket", "trustless", atau "satu-satunya". Panitia berhati-hati soal taruhan; strukturnya bug bounty.
- Dokumen tim ditulis dalam bahasa Indonesia.

## Penilaian juri
Bukti on-chain nyata, kejujuran soal mock, demo singkat, kecocokan dengan Monad, deploy lebih awal (Vercel), dan kesederhanaan.
