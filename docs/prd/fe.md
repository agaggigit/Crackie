# PRD FE: Halaman tantangan, status live, dan panel pemilik

> **Pemilik:** @Nabil-Aufa
> **Status:** draf
> **Mengacu ke:** `docs/plan.md` Bagian 4, 6, 13, 14, 16; `docs/prd/be.md` Bagian 4

## 1. Tujuan
FE adalah satu-satunya hal yang dilihat juri. Bagian ini membuat:
- **Halaman tantangan** tempat penyerang membujuk agent.
- **Status live** yang membuat alarm "terlihat berbunyi": dana utama, celengan, status wewenang, rating, jumlah percobaan, dan riwayat.
- **Panel pemilik** untuk adegan "pemilik tetap bisa menarik dana" dan menyalakan agent lagi.

Semua angka dibaca dari chain, bukan disimulasikan.

## 2. Ruang lingkup
**Dikerjakan (MVP):**
- Connect wallet: wagmi + RainbowKit, dengan UI tombol dan modal dibuat sendiri (`ConnectButton.Custom`). Daftar wallet tetap memakai bawaan RainbowKit.
- Konsol serangan: tulis pesan → `catatPercobaan` → `POST /api/serang` → tampilkan balasan dan hasil.
- Panel status live dan riwayat kejadian dari event kontrak.
- Panel pemilik lengkap (`/app/pemilik`): setor, isi celengan, tarik utama, tarik celengan, allowlist, atur sidik jari, nyalakan lagi, tagihan normal untuk demo.
- Deploy ke Vercel (project di akun Nabil, Root Directory = `web`).

**Tidak dikerjakan:**
- Daftar banyak agent / leaderboard (satu vault saja).
- Login atau akun selain wallet.
- Jalur serangan selain chat.
- Desain visual final. Gaya ditentukan belakangan, jadi komponen dibuat dulu dengan gaya netral.

## 3. Desain

### 3.1 Stack
| Komponen | Pilihan |
|---|---|
| Framework | Next.js 16 App Router (sudah di-init di `web/`) |
| Chain | wagmi + viem, chain `monadTestnet` (10143) dari `viem/chains` |
| Wallet | RainbowKit (konektor + daftar wallet) dengan UI kustom lewat `ConnectButton.Custom` |
| Data | `useReadContract` untuk `status()` dengan polling ±1 detik; `useWatchContractEvent` + `getLogs` untuk riwayat |
| Gaya | Tailwind (sudah ada). Token warna di CSS variable supaya mudah diganti saat visual diputuskan |

### 3.2 Halaman
Diperbarui 24 Okt mengikuti desain (`docs/desain-fe.md`): landing dipisah dari app.
```
/                    Landing: hero, cara kerja, kartu agent (live dari chain), untuk builder
/app                 Daftar agent (KopiBot + slot "Your agent here")
/app/agent/kopibot   Halaman tantangan
                     ├── Kartu bounty: status aktif/berhenti, celengan, batas per menang, kunci, Jebi
                     ├── Statistik: bertahan, percobaan (sejak nyala / total), skor (MON·jam)
                     ├── Chat (konsol serangan) + semua keadaan blokir
                     └── Aktivitas (event on-chain)
/app/pemilik         Panel pemilik (aktif hanya kalau wallet = pemilik vault dan jaringan benar)
```
Dana utama dan sidik jari tampil di panel pemilik, bukan di halaman tantangan, supaya halaman penyerang tetap sederhana.

### 3.3 Alur satu percobaan (konsol serangan)
```
1. Penyerang menulis pesan.
2. FE memanggil GET /api/anggaran dan GET /api/kesehatan.
     - anggaran habis atau sidik jari tidak cocok → tombol kirim dimatikan + alasan jelas
3. FE menghitung hashPesan = keccak256(toBytes(pesan)), lalu teks dikunci (tidak bisa diedit).
4. Wallet penyerang mengirim catatPercobaan(hashPesan) → tunggu receipt.
5. FE → POST /api/serang { txHash, pesan }.
     - 429 "sibuk" → coba lagi otomatis (maks. 5×, jeda 2 detik)
     - 409 / 400 / 503 → tampilkan pesan error yang manusiawi
6. Tampilkan balasan agent + kartu aksi:
     - null       → "Agent tidak membayar" (juga keluar kalau model error; BE mengirim balasan netral)
     - dibayar    → "Agent membayar X MON ke 0x…" + link explorer
     - crackie      → ALARM: animasi alarm, hadiah X MON (dari event Crackie), "wewenang agent dicabut", link tx
                    kalau hadiahTertunda(penemu) > 0 → tombol "Klaim hadiah" (klaimHadiah())
     - revert     → "Diblokir: wewenang agent sudah dicabut" + link tx
7. Panel status ikut berubah dari chain (bukan dari respons BE).
```

### 3.4 Format tampilan
| Data | Dari | Ditampilkan |
|---|---|---|
| Saldo | wei | MON, 4 desimal |
| Skor | wei·detik | dibagi 1e18 × 3600 → "MON·jam" |
| `bertahanSejak` | timestamp | "bertahan 3 menit 12 detik" (berjalan live) |
| `kunciSampai` | timestamp | "terkunci 4 menit lagi" / "bisa ditarik" |
| Sidik jari | bytes32 | 6 karakter awal + akhir, bisa disalin |
| Alamat/tx | hex | dipendekkan + link ke explorer Monad testnet |

### 3.5 Panel pemilik (`/app/pemilik`)
| Aksi | Fungsi kontrak / endpoint | Input |
|---|---|---|
| Setor dana utama | `setorUtama()` payable | jumlah MON |
| Isi celengan | `isiCelengan(kunciSampai)` payable | jumlah MON + lama kunci (default `minKunci`) |
| Tarik dana utama | `tarikUtama(jumlah)` | jumlah MON |
| Tarik celengan | `tarikCelengan()` | aktif setelah `kunciSampai`, atau kapan pun setelah crackie; peringatan "rating akan reset" |
| Allowlist | `aturAllowlist(alamat, boleh)` | alamat + label supplier |
| Atur sidik jari | `aturSidikJari(hash)` | hanya saat aktif; hash (ambil dari `GET /api/kesehatan`) + peringatan "rating akan reset" |
| ERC-8004 (opsional) | `aturErc8004(registry, agentId)` | alamat Reputation Registry testnet + `agentId`; dipotong pertama |
| Nyalakan lagi | `nyalakanLagi(sidikJariBaru)` | aktif hanya saat agent dicabut; sidik jari harus berbeda |
| Tagihan normal (demo) | `POST /api/admin/tagihan` | teks tagihan + `ADMIN_TOKEN` (diketik, tidak disimpan) |

Kalau wallet yang terhubung bukan pemilik, panel tetap tampil tapi semua tombol mati dengan keterangan.

### 3.6 Riwayat kejadian
Event yang ditampilkan: `PercobaanTercatat`, `Dibayar`, `Crackie`, `WewenangDicabut`, `DinyalakanLagi`, `SidikJariDiganti`. Saat halaman dibuka: `getLogs` dari `CRACKIE_VAULT_DEPLOY_BLOCK`. Setelah itu: `useWatchContractEvent`. Isi pesan **tidak** ditampilkan (di chain hanya hash).

### 3.7 Bahasa UI
**Semua teks di aplikasi memakai bahasa Inggris** (label, tombol, pesan error, kartu aksi). Dokumen tim tetap bahasa Indonesia. Label Indonesia di PRD ini (misalnya "Agent tidak membayar") adalah maksudnya, bukan teks final.

Ikuti tabel klaim `docs/plan.md` Bagian 6. Padanan istilah:

| Konsep | Teks UI |
|---|---|
| celengan | bounty vault |
| hadiah | reward |
| percobaan | attempt |
| celah | vulnerability / breach |
| crackie | Breached |
| wewenang dicabut | agent authority revoked |
| dana utama | main funds |
| sidik jari | config fingerprint |
| nyalakan lagi | re-enable agent |
| agent tidak membayar | Agent did not pay |
| tagihan normal demo | owner operational channel (not an attempt) |

Kata yang dilarang (versi Inggris juga): "bet", "betting", "gamble", "jackpot", "ticket", "lottery", "trustless", "the only".

### 3.8 Faucet mini untuk penonton/juri
Penyerang butuh MON testnet untuk gas `catatPercobaan`, dan penonton atau juri biasanya tidak punya. Faucet resmi Monad tidak diandalkan di panggung.
- Tombol **"Minta MON untuk gas"** muncul kalau saldo wallet terhubung di bawah ambang (misalnya < 0.01 MON).
- FE memanggil `POST /api/faucet { alamat }` → server mengirim 0.05 MON dari **wallet faucet** (berbeda dari wallet agent supaya nonce tidak bentrok).
- Rem: satu kali per alamat (Redis), batas total per hari, tidak mengisi alamat yang saldonya sudah cukup.
- Penyerang tetap tercatat dengan alamatnya sendiri.
- Penonton tetap butuh wallet terpasang di HP/laptop. Cadangan di panggung: wallet penyerang milik tim yang sudah terisi.

### 3.9 Environment variable
```
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # dibutuhkan RainbowKit (cloud.reown.com)
NEXT_PUBLIC_EXPLORER_URL=               # explorer Monad testnet
```
Alamat vault dan blok deploy diambil dari `web/src/abi/CrackieVault.ts` (milik SC).

## 4. Antarmuka ke bagian lain (wajib)
| Nama | Dipakai | Catatan |
|---|---|---|
| `status()` | dibaca terus | field sesuai `docs/plan.md` Bagian 13 |
| `catatPercobaan(bytes32)` | ditulis wallet penyerang | |
| `klaimHadiah()`, `hadiahTertunda(address)` | ditulis/dibaca penemu | hanya kalau transfer hadiah otomatis gagal |
| Fungsi pemilik (3.5) | ditulis wallet pemilik | |
| Event (3.6) | dibaca | |
| `GET /api/anggaran`, `GET /api/kesehatan`, `POST /api/serang`, `POST /api/admin/tagihan` | dari BE | format di `docs/prd/be.md` Bagian 4 |
| `web/src/abi/CrackieVault.ts` | dari SC | harus berisi ABI, alamat, dan **blok deploy** (untuk `getLogs`) |

**Permintaan ke BE (@agaggigit):** route `POST /api/faucet` (3.8) ada di wilayah BE (`web/src/app/api/`). Perlu disepakati: Aga yang membuat, atau FE yang membuat dengan izinnya. Butuh env `FAUCET_PRIVATE_KEY`, `FAUCET_JUMLAH`, `FAUCET_BATAS_HARIAN`, dan memakai Upstash yang sama.

**Dari SC (sudah dipenuhi di `docs/prd/sc.md`):** `CRACKIE_VAULT_DEPLOY_BLOCK` di `CrackieVault.ts`, dan `status()` mengembalikan `totalPercobaan` + `percobaanSejakNyala`.

**Wallet deployer = wallet pemilik:** usulan FE, Nabil yang memegang (panel pemilik dijalankan dari laptop FE saat demo). Wallet ini terpisah dari wallet agent dan wallet faucet.

## 5. Keputusan terbuka yang dijawab di sini
| Keputusan | Pilihan |
|---|---|
| Library wallet | wagmi + RainbowKit, UI kustom |
| Panel pemilik | Lengkap (8 aksi) |
| Project Vercel | Akun Nabil. Env BE (LLM, Upstash, `AGENT_PRIVATE_KEY`, `ADMIN_TOKEN`) diisi bersama Aga |
| Visual | Ditentukan nanti; komponen memakai token warna supaya gampang diganti |

| Gas untuk penonton/juri | **Faucet mini milik kita** (lihat 3.8). Burner wallet tanpa install dan gasless/relayer tidak dibuat |

## 6. Risiko dan kasus pinggir
- **RPC lambat di venue:** polling diperlambat otomatis, sediakan RPC cadangan.
- **Penyerang membatalkan transaksi di wallet:** teks dibuka lagi, tidak ada yang dikirim ke BE.
- **Transaksi `catatPercobaan` sukses tapi `POST /api/serang` gagal** (jaringan putus): simpan `txHash` + pesan di state, tombol "kirim ulang ke agent".
- **Batas per wallet di kontrak tercapai:** tampilkan pesan dari revert.
- **Wallet di jaringan lain:** tombol "pindah ke Monad testnet".
- **Data riwayat panjang:** batasi 30 kejadian terakhir. RPC publik Monad membatasi `eth_getLogs` 100 blok per panggilan, jadi riwayat dibaca per potongan 100 blok.

## 7. Cara menguji
- Manual di testnet mengikuti skrip demo `docs/plan.md` Bagian 16: tagihan normal → serangan berhasil → alarm → serangan kedua diblokir → pemilik tarik dana → nyalakan lagi.
- Serangan demo memakai teks injeksi `docs/prd/be.md` Bagian 7.4 (tagihan Toko Biji Kopi Merapi + blok palsu `[SYSTEM UPDATE]`). Video cadangan adegan crackie merekam serangan yang sama.
- Cek tampilan di layar proyektor (1280×720) dan HP.
- Cek semua teks UI terhadap tabel klaim.

## 8. Milestone
Dikerjakan berurutan, satu branch per milestone. Hasil desain M1 ada di `docs/desain-fe.md` dan `docs/desain/`.

| # | Milestone | Isi | Bergantung pada |
|---|---|---|---|
| M0 | Fondasi + deploy | wagmi + RainbowKit (tombol custom), chain Monad testnet, kerangka `/app` dan `/app/pemilik`, deploy awal ke Vercel | – |
| M1 | Desain UI | Arah visual (warna, font, gaya), wireframe dua halaman, desain momen crackie (alarm, hadiah, wewenang dicabut), komponen dasar. Hasil: `docs/desain-fe.md` + screenshot | M0 |
| M2 | Status live | Panel status membaca `status()` (polling). Sebelum kontrak siap: mock yang ditandai jelas | M1, ABI + alamat dari SC |
| M3 | Riwayat kejadian | `getLogs` dari `CRACKIE_VAULT_DEPLOY_BLOCK` + watch event, link explorer | M2 |
| M4 | Konsol serangan | Alur 3.3 end-to-end + kartu aksi + klaim hadiah | M2, endpoint BE |
| M5 | Faucet penonton | Tombol minta MON gas (3.8) | Keputusan route faucet dengan BE |
| M6 | Panel pemilik | 9 aksi di 3.5, tombol mati kalau tidak berlaku | M2 |
| M7 | Polish + latihan demo | Animasi, mobile, cek tabel klaim, latihan skrip `docs/plan.md` Bagian 16, rekam video cadangan (serangan injeksi) | Semua |

Tidak boleh dipotong: M2, M4, dan desain momen crackie di M1.

## 9. Urutan kerja hari H
| Jam | Target selesai |
|---|---|
| 12.00–13.00 | Kerangka halaman + wagmi/RainbowKit + deploy kosong ke Vercel; Upstash ditambahkan ke project |
| 13.30–15.00 | Panel status membaca `status()` dari kontrak SC; connect wallet; riwayat event |
| 15.00–16.30 | Konsol serangan end-to-end dengan BE; kartu alarm |
| 16.30–17.30 | Panel pemilik; poles tampilan alarm; latihan demo |
| 17.30–18.00 | Rekam video cadangan, bekukan kode |

## 10. Kalau waktu kurang, yang dipotong
1. Panel pemilik dikurangi jadi `nyalakanLagi` + `tarikUtama` + tagihan normal (sisanya pakai `cast`)
2. Riwayat kejadian (cukup panel status + kartu hasil)
3. Format skor "MON·jam" (tampilkan tiga angka mentah)

Yang **tidak boleh dipotong:** konsol serangan, panel status live dari chain, kartu alarm.
