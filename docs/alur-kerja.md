# Alur Kerja Tim

Dokumen ini menjelaskan cara kita bekerja dari ide sampai kode masuk ke `main`. Semua anggota memakai AI agent (Claude Code atau sejenisnya), jadi aturan ini juga berlaku untuk agent kalian.

## Peran

| Peran | Orang | Folder kode | PRD |
|---|---|---|---|
| Smart Contract | @razaqialkautsar | `contracts/`, `web/src/abi/` | `docs/prd/sc.md` |
| Agent + Backend | @agaggigit | `web/src/app/api/`, `web/src/lib/` | `docs/prd/be.md` |
| Frontend + Pitch | @Nabil-Aufa | sisa isi `web/` | `docs/prd/fe.md` |

> Struktur repo sudah di-init sesuai `docs/plan.md` Bagian 13.

## Langkah 1: Baca konteks dulu
Sebelum menulis kode apa pun, baca (atau minta agent kalian membaca):
1. `docs/plan.md`: sumber kebenaran. Terutama Bagian 4 (cara kerja), 5 (apa yang diuji), 6 (klaim), 13 (MVP + kontrak antar-bagian), dan 15 (keputusan terbuka).
2. `CLAUDE.md`: aturan kerja untuk agent.
3. `docs/brainstorming/`: hanya kalau perlu tahu alasan sebuah keputusan. Isinya **bukan** rencana yang berlaku.

## Langkah 2: Diskusikan dulu dengan agent kalian, jangan langsung coding
Buka sesi dengan agent kalian dan minta agent:
- Menjelaskan ulang bagian kalian dengan kata-katanya sendiri, supaya ketahuan kalau ada yang salah paham.
- Mengkritik desain bagian kalian: celah keamanan, kasus pinggir, hal yang terlalu besar untuk hari H.
- Menjawab keputusan terbuka di `docs/plan.md` Bagian 15 yang menyangkut bagian kalian, lengkap dengan usulan.

Contoh prompt:
> "Baca docs/plan.md dan CLAUDE.md. Aku pegang bagian [SC/BE]. Jelaskan ulang bagianku, kritik desainnya, lalu bantu aku menulis PRD di docs/prd/[sc/be].md memakai template docs/prd/_template.md. Jangan menulis kode dulu."

## Langkah 3: Tulis PRD bagian kalian
- Salin `docs/prd/_template.md` ke `docs/prd/sc.md`, `docs/prd/be.md`, atau `docs/prd/fe.md`.
- PRD **tidak boleh** bertentangan dengan `docs/plan.md`. Kalau menurut kalian plan-nya salah, usulkan perubahan ke tim, jangan diam-diam diubah di PRD.
- Bagian **"Antarmuka ke bagian lain"** wajib diisi: fungsi, event, endpoint, dan format data yang dipakai bagian lain.
- Buka PR berisi PRD saja. Dua anggota lain membaca dan menyetujui sebelum coding dimulai.

## Langkah 4: Coding di branch sendiri
- Nama branch: `sc/<topik>`, `be/<topik>`, `fe/<topik>`, atau `docs/<topik>`. Contoh: `sc/jalur-alarm`.
- Jangan push langsung ke `main`.
- Commit kecil dengan pesan yang jelas, dalam bahasa Indonesia atau Inggris.
- Kalau perlu mengubah **kontrak antar-bagian** (ABI, event, endpoint), umumkan ke grup dulu dan perbarui `docs/plan.md` Bagian 13 serta PRD terkait di PR yang sama.

## Langkah 5: Pull Request dan review
Setiap PR ke `main` wajib:
1. Mengisi deskripsi: apa yang diubah, kenapa, cara mengujinya, dan bagian PRD mana yang dikerjakan.
2. **Direview AI dengan konteks proyek ini.** Jalankan `/code-review` di Claude Code (atau minta agent mereview PR dengan membaca `docs/plan.md`, PRD terkait, dan `CLAUDE.md`). Hasil review ditempel atau dirangkum di PR.
3. **Disetujui minimal satu anggota lain.**
4. Lolos checklist di bawah.

### Checklist review
- [ ] Sesuai `docs/plan.md` dan PRD bagiannya. Tidak menambah fitur di luar MVP tanpa kesepakatan.
- [ ] Tidak mengubah kontrak antar-bagian diam-diam.
- [ ] **SC:** jalur alarm dan pencabutan wewenang terjadi di transaksi yang sama; pemilik tetap bisa menarik dana utama; celengan tidak bisa ditarik sebelum waktunya; tidak ada reentrancy; ada test Foundry untuk jalur normal, jalur alarm, dan setelah crackie.
- [ ] **BE:** private key agent tidak pernah di-commit (pakai `.env`); pesan hanya diteruskan ke agent kalau hash-nya tercatat on-chain; ada anggaran harian; agent tidak diberi tahu soal celengan.
- [ ] **FE:** angka di layar dibaca dari chain, bukan hardcode; jelas kalau ada data yang masih mock.
- [ ] Teks di UI dan pitch mengikuti tabel klaim (`docs/plan.md` Bagian 6). Tidak ada kata "taruhan", "jackpot", "tiket", "trustless", atau "satu-satunya".
- [ ] Tidak ada rahasia (API key, private key, `.env`) di diff.

## Langkah 6: Merge
- Merge oleh pembuat PR setelah disetujui.
- Pakai **squash merge** supaya riwayat `main` rapi.
- Hapus branch setelah merge.

## Catatan hari H
Saat hari H, alur kerja ini dipakai dalam versi ringan: PRD sudah ada, jadi review cukup cepat (AI review + satu anggota, maksimal 10 menit).
