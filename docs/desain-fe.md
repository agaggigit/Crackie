# Desain FE Crackie

Hasil M1 (`docs/prd/fe.md` Bagian 8).

- **File desain:** `docs/desain/crackie.pen`, dibuka di pen.dev. Gambar PNG/WEBP di folder yang sama dipakai oleh frame v1 (arsip).
- **Aset maskot untuk kode:** `web/public/maskot/*.svg`, diekspor dari frame "03 Export assets".

## 1. Arah visual
- Minimalis ala Apple: latar krem, panel putih, banyak ruang kosong.
- **Satu tone gradien (oranye) dipadukan dengan satu warna solid (navy).** Komposisi gradien berbeda di tiap kartu.
- Gradien dibuat dengan cara "bentuk lalu blur": bentuk solid digambar dulu, lalu diberi blur 50 sampai 140 sampai melebur. Lihat frame "00 Gradient lab".
- **Maskot Jebi** (celengan 2D, flat, tanpa outline) dipasang besar, sengaja terpotong tepi kartu, lalu di-*mask* dengan gradien supaya melebur ke warna kartu.
- KopiBot (cangkir kopi 2D) adalah avatar agent contoh, bukan maskot Crackie.

## 2. Token
| Token | Nilai | Dipakai untuk |
|---|---|---|
| `navy` | `#0E1B3D` | Warna solid utama, teks, tombol sekunder gelap |
| `orange` | `#FF6A1F` | Tombol utama, aksen, gradien |
| `tangerine` | `#FF8F4D` | Gradien |
| `ember` | `#E24E0A` | Bagian gelap gradien alarm |
| `peach` | `#FFC9A0` | Gradien, pipi Jebi |
| `cream` | `#FFF1E6` | Latar ilustrasi |
| `bg` | `#F4F2EE` | Latar halaman |
| `field` | `#F6F2EC` | Input, gelembung chat agent |
| `ink-2` | `#5E6683` | Teks sekunder |
| `success` | `#DDFBE9` / `#0B7A45` | Status Active |
| `warn` | `#FFE6DA` / `#B4471A` | Status Stopped |

Font: **Inter Tight** (judul dan angka), **Inter** (isi), **JetBrains Mono** (alamat dan hash).
Radius: chip 8, input 16 sampai 26, kartu 28 sampai 36, hero 44, tombol pill.

## 3. Aturan copy (dari Forepay, wajib di UI)
1. Bahasa Inggris, kalimat pendek, langsung ke inti.
2. Tidak ada em dash, titik dua, titik koma, dan titik tengah.
3. Tidak ada teks huruf besar semua. Status memakai sentence case (`Active`, bukan `ACTIVE`).
4. Kata awam, bukan istilah teknis: *try* (bukan attempt), *approved suppliers* (bukan allowlist), *can no longer pay* (bukan authority revoked), *setup* (bukan fingerprint). Hash tidak ditampilkan.
5. Tidak ada kata "bet", "gamble", "jackpot", "ticket", "lottery", "trustless", "the only".
6. Tanggal tanpa jam (`24 Oct 2026`).

## 4. Daftar layar
| Frame | Isi |
|---|---|
| A1 Agents | Daftar agent: kartu KopiBot + slot "Your agent here" |
| A2 Agent / Ready v2 | Kartu bounty navy + Jebi, chat, aktivitas |
| A3 Agent / Sending | Stepper 4 bar (Locked, Recorded, Reading, Result), komposer terkunci |
| A4 Agent / Held out | Kartu "KopiBot held out" + varian "Paid an approved supplier" |
| A5 Agent / Broke v2 | Modal alarm oranye penuh, Jebi pose broken, hadiah, tombol receipt |
| A6 Agent / Stopped | Banner berhenti, hasil "Payment refused", varian "Claim bounty" |
| A7 My agents / KopiBot | Panel pemilik: dana utama, bounty, supplier, invoice demo, setup, reputasi, try terbaru |
| A8 Get test MON | Modal faucet |
| A9 States | Semua keadaan komposer: belum connect, salah jaringan, tidak ada MON, kuota habis, agent offline, sibuk, menunggu konfirmasi, dibatalkan, mode demo |
| M2, M5 | Mobile 390: halaman agent (tab Chat/Activity) dan momen alarm |
| L1 Landing v2 | Landing (dikerjakan terakhir) |

## 5. Responsif
- **≥ 1280:** tiga kolom (kartu bounty 400, chat, aktivitas 330).
- **768 sampai 1279:** dua kolom (kartu bounty di kiri, chat di kanan). Aktivitas pindah ke bawah chat.
- **< 768:** satu kolom. Kartu bounty mendatar (tinggi 220), statistik 3 kotak, tab Chat/Activity. Modal alarm jadi layar penuh.
