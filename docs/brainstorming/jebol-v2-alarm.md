# Jebol: Alarm Kebakaran untuk AI Agent

### Dokumen Final Tim untuk Monad Blitz Jogja Vol. 2

> **Acara:** Monad Blitz Jogja Vol. 2, Sabtu 24 Oktober 2026, GIK UGM
> **Jadwal resmi (Luma):** 09.00–21.00 WIB. Hacking 12.00–18.00, submission 18.30, pitch mulai 18.45. *(Info dari tim menyebut 08.00–20.00. Cek ulang grup peserta sebelum hari H.)*
> **Penilaian:** kabar terbaru full juri (belum dikonfirmasi resmi; Luma masih menyebut juri + community vote)
> **Hadiah:** total prize pool **US$2.000** (info tim; belum diumumkan resmi di Luma). Sebagai gambaran, Blitz Shenzhen dengan pool US$2.000 membaginya US$1.000 / 600 / 400 untuk juara 1–3.
> **Nama:** Jebol (sementara)
>
> Dokumen ini adalah hasil akhir dari beberapa putaran kritik tim. Semua klaim di sini sudah disaring supaya tahan diuji juri.

---

## 1. Satu kalimat

**Jebol memasang "vault alarm" berisi bounty kecil di AI agent yang sedang berjalan. Kalau ada yang berhasil membujuk agent memindahkan dana alarm itu, bukti jebolnya otomatis tercatat on-chain, penemu celah langsung mendapat hadiahnya, dan wewenang agent atas dana utama dicabut di transaksi yang sama.**

**Analogi:** alarm kebakaran. Yang dikorbankan hanya dana kecil, dan begitu alarm berbunyi, akses agent ke dana besar langsung diputus sebelum celah yang sama dipakai orang lain.

---

## 2. Kenapa ide ini yang kita pilih

Kita sudah membahas dan menyaring banyak arah:

| Ide | Alasan tidak dipilih |
|---|---|
| Game kejar-kejaran polisi (GameFi) | Mentor menyarankan menghindari GameFi; on-chain hanya di tiket dan hadiah; dekat dengan taruhan |
| AgentCredit (pinjaman untuk agent) | Contoh alurnya membantah dirinya sendiri; pinjaman tanpa jaminan ke agent anonim terlalu berisiko; scope terlalu besar |
| Pegadaian kartu koleksi (RWA) | Bergantung pada kustodian fisik dan API harga; peran AI-nya lemah; terlalu berat untuk 6 jam |
| Firewall wallet agent | Sudah jadi fitur standar MetaMask, Coinbase, Crossmint, Openfort |
| Arena jailbreak dengan bounty | Sudah ada minimal lima pemain: JailbreakMe, HackAgent Bounty, Red Sentinel, InjectMe, crack.fun |
| Reputasi + DP bertingkat | **Cadangan.** Logikanya kokoh, tapi bukti masalahnya lebih lemah |

**Kenapa Jebol versi ini unggul:**
1. **Bukti masalahnya nyata dan baru** (kasus Grok/Bankr, Mei 2026).
2. **Menguji agent produksi, bukan agent tantangan.** Semua arena yang kita temukan memakai agent yang dibuat khusus untuk arena. Kita memasang alarm di agent yang benar-benar dipakai.
3. **Bukti jebol objektif.** Satu kondisi on-chain yang jelas: dana alarm keluar = jebol.
4. **Langsung memberi perlindungan**, bukan sekadar laporan: wewenang agent dicabut otomatis.
5. **Scope-nya kecil**, realistis untuk 6 jam.

---

## 3. Masalahnya

AI agent mulai memegang wallet: membayar API, trading, mengelola treasury. Tapi AI bisa dibujuk lewat teks (prompt injection).

**Kasus nyata (4 Mei 2026):** penyerang mengirim NFT Bankr Club Membership ke wallet yang terhubung ke Grok untuk membuka izin transfer lebih luas, lalu mengirim pesan berbentuk **kode Morse** yang dibaca Grok sebagai perintah sah. Bot Bankr mengeksekusinya. Sekitar **US$150–200 ribu** token dikuras (angka berbeda antar sumber). Sekitar 80% dana dikembalikan setelah penyerangnya teridentifikasi. Insiden ini tercatat di pelacak insiden AI milik OECD.

> Pakai kata **"dikuras"**, bukan "hilang". Juri yang tahu soal pengembalian dana akan menganggap "hilang" sebagai melebih-lebihkan.

**Dua masalah yang belum terjawab:**
1. **Pertahanan selalu terlambat satu serangan.** Setiap tambalan merespons insiden yang sudah terjadi.
2. **Ada jeda berbahaya setelah celah ditemukan.** Di bug bounty biasa, ada waktu berjam-jam sampai berhari-hari antara celah dilaporkan dan diperbaiki. Selama itu, penyerang lain yang menemukan celah yang sama masih bisa menyerang.

---

## 4. Cara kerjanya

1. **Developer memasang vault alarm di agent produksinya.** Bukan salinan. Agent yang sama, lewat jalur yang sama (model, prompt, tool, saluran).
2. **Aturan vault alarm:**
   - Agent **diinstruksikan** tidak pernah memindahkan dana ini.
   - Secara on-chain, vault alarm **boleh** mengirim ke alamat mana pun, tapi batas jumlah per transaksi dan frekuensinya **sama** dengan dana utama.
3. **Siapa pun boleh mencoba** membujuk agent memindahkan dana alarm, sesuai aturan cakupan.
4. **Kalau dana alarm keluar sedikit pun → jebol.**
   - Dana yang keluar masuk ke alamat yang diarahkan penyerang. **Itulah hadiahnya.** Tidak perlu developer mencatat siapa yang berhasil.
   - **Di transaksi yang sama**, kontrak mencabut wewenang belanja agent atas dana utama. **Pemilik dana tetap bisa menarik uangnya.** Yang diputus hanya akses agent.
   - Detail serangan diberikan ke developer dulu, lalu dipublikasikan setelah celah diperbaiki (*responsible disclosure*). Di chain hanya disimpan hash-nya.
5. **Selama alarm tidak berbunyi**, agent membangun **rating "Ketahanan Lapisan AI"**: besar bounty × lama bertahan, untuk versi agent saat ini. Rating reset kalau jebol.

**Konsekuensi desain yang menguntungkan:** karena wewenang dicabut di transaksi pertama yang keluar, hadiah maksimal = **satu kali batas per transaksi**. Biaya bounty bagi developer jadi mudah diprediksi.

---

## 5. Apa yang diuji, dan apa yang tidak

| Yang **dibuktikan** | Yang **tidak** dibuktikan |
|---|---|
| Lapisan AI agent produksi bisa dibujuk melakukan hal yang dilarang | Apakah **allowlist** dana utama tahan serangan (vault alarm sengaja dibuka ke semua alamat) |
| Batas jumlah dan frekuensi membatasi kebocoran | Kerugian dalam perilaku yang diizinkan, misalnya trade buruk ke alamat yang masuk allowlist |
| Celah yang ditemukan langsung ditutup dengan pencabutan wewenang | Kerugian bukan uang: kebocoran data, jawaban yang memalukan |

Karena itu, nama ratingnya **"Ketahanan Lapisan AI"**, bukan "keamanan sistem".

---

## 6. Klaim yang boleh dan tidak boleh kita ucapkan

| ✅ Boleh | ❌ Jangan |
|---|---|
| "Bukti jebol tidak bisa disangkal, dan catatannya tidak bisa diubah setelah tercatat." | "Tidak perlu percaya pada kami / sepenuhnya trustless." Kode agent tetap berjalan off-chain dan bisa dicurangi developer. |
| "Pemutus menutup jendela setelah celah ditemukan." | "Pemutus menangkap pencuri." Penyerang rasional akan menghindari vault alarm. |
| "Kami menguji pagarnya; mereka membangun pagar." | "Kami satu-satunya." Ada banyak arena jailbreak. Pembeda kita: alarm di agent produksi + pencabutan otomatis. |
| "Rating mengukur ketahanan lapisan AI." | "Rating membuktikan agent aman." |
| "Dikuras sekitar US$150–200 ribu, sebagian besar dikembalikan." | "Hilang ratusan ribu dolar." |
| "Ekosistem agent Monad sedang tumbuh, dan memasang banyak vault kecil di sini murah." | "Finality cepat Monad membuat pemutusnya bekerja." Pemutusan atomik bekerja di EVM mana pun. |

---

## 7. Kenapa blockchain

1. **Jebol didefinisikan secara objektif:** dana alarm keluar. Tidak ada sengketa "laporannya valid atau tidak".
2. **Hadiah tidak bergantung pada itikad baik developer.** Dana yang keluar langsung menjadi hadiah penemu celah.
3. **Pencabutan wewenang atomik** di transaksi yang sama, tanpa menunggu developer bangun tidur.
4. **Catatan publik yang tidak bisa diubah** untuk rating dan riwayat jebol.

**Batasan yang kita akui:** developer bisa menulis kode khusus yang menolak semua permintaan menyentuh vault alarm tanpa menerapkan pengaman yang sama ke dana utama. Parameter on-chain kedua vault bisa dibandingkan siapa saja, tapi kode agent tidak bisa. Roadmap: atestasi TEE untuk membuktikan kode agent.

## 8. Kenapa Monad (versi jujur)

- **Ekosistem agent di Monad sedang tumbuh**, dan Monad Foundation aktif di persimpangan AI dan crypto (program Monad AI Blueprint).
- **Monad Foundation sendiri peduli keamanan berbasis AI.** Tim keamanannya membangun Bugfinder, sistem AI internal untuk mencari kerentanan.
- **Biaya rendah** membuat pemasangan dan pemeliharaan vault alarm di banyak agent sekaligus masuk akal.
- Kita sengaja **tidak** memakai argumen finality cepat. Juri Monad paling tahu cara kerja chain-nya.

---

## 9. Siapa yang memakai dan membayar

| Pihak | Peran | Kenapa mau |
|---|---|---|
| **Tim yang menjalankan agent ber-wallet** (bot trading, agent treasury, agent pembayaran) | Pembayar utama | Celah ditemukan dengan biaya kecil yang bisa diprediksi, dan begitu ditemukan langsung ditutup |
| **Pengguna yang menitipkan dana ke agent** | Membaca rating | Melihat agent mana yang sudah bertahan lama dengan bounty besar |
| **Penyedia wallet dan guardrail** (MetaMask, Coinbase CDP, Crossmint, Newton, dll.) | Calon mitra | Vault alarm melengkapi pagar mereka |
| **Pemburu celah** (peneliti keamanan, komunitas developer) | Penyerang beritikad baik | Hadiah uang langsung, tanpa proses klaim |

**Mulai dari:** agent di ekosistem Monad, dengan komunitas lokal (Dev Web3 Jogja, blockchain club kampus) sebagai pemburu awal.

## 10. Bisnis model dan kenapa long-term

**Pendapatan:**
1. **Langganan per agent** untuk vault alarm, pemantauan, dan rating.
2. **Fee kecil dari setiap pengisian bounty.**
3. **Laporan celah** dan uji ulang setiap agent diperbarui.

**Kenapa long-term:**
- Setiap agent baru yang memegang uang adalah calon pelanggan, dan jumlahnya terus bertambah.
- Polanya mirip audit smart contract: dulu opsional, sekarang protokol tanpa audit sulit dipercaya.
- Rating bisa ditulis ke **ERC-8004** sebagai reputasi agent yang dibaca aplikasi lain.
- **Tanpa token sendiri.** Pendapatan dari pemakaian nyata.

---

## 11. Kompetitor dan pembeda

| Pemain | Yang dilakukan | Bedanya dengan Jebol |
|---|---|---|
| JailbreakMe (Solana) | Bounty untuk membobol AI agent; perlu token $JAIL | Agent tantangan, bukan agent produksi; tanpa pencabutan wewenang |
| HackAgent Bounty | Developer membuat endpoint, peneliti mencoba membobol | Tanpa pembuktian on-chain dan pencabutan otomatis |
| Red Sentinel | Arena jailbreak dengan bounty pool, diverifikasi TEE | Agent dibuat khusus untuk arena |
| InjectMe (0G) | Arena dengan hadiah dari defender, serangan gratis, skor per agent | Agent tantangan; skor dari arena, bukan dari agent produksi |
| CanaryGuard | Firewall prompt injection | Lapisan pertahanan; kita menguji pertahanannya |
| IntentGuard | Mengunci niat pembayaran ke mandat on-chain | Lapisan pertahanan |
| Newton | Guardrail on-chain dengan bukti untuk setiap transaksi yang diizinkan atau diblokir | Lapisan pertahanan; mencatat semua percobaan bukan pembeda kita |
| MetaMask Agent Wallet, Coinbase CDP, Crossmint, Openfort | Wallet agent dengan limit dan allowlist | Mereka membangun pagar, kita memasang alarm di baliknya |

**Pembeda dalam satu kalimat:**
> "Arena jailbreak menguji agent mainan. Kami memasang alarm di agent yang benar-benar memegang uang, dan begitu alarm berbunyi, aksesnya langsung diputus."

*Catatan: kami belum menemukan proyek yang memasang vault bounty sebagai alarm di agent produksi. Cek ulang sebelum Sabtu, dan jangan klaim "belum ada" di depan juri.*

---

## 12. Pertanyaan juri dan jawabannya

| Pertanyaan | Jawaban |
|---|---|
| "Bukannya sudah ada JailbreakMe / Red Sentinel?" | Ya, dan kami belajar dari mereka. Mereka menguji agent yang dibuat khusus untuk arena. Kami memasang alarm di agent produksi dan langsung mencabut wewenangnya saat jebol |
| "Penyerang pintar akan menghindari vault alarm" | Betul. Pemutus tidak dirancang menangkap pencuri, tapi menutup jendela setelah celah ditemukan pemburu beritikad baik, sebelum orang lain memakai celah yang sama |
| "Kenapa harus Monad?" | Ekosistem agent Monad sedang tumbuh, Foundation fokus pada AI, dan biaya murah memungkinkan alarm di banyak agent. Pemutusan atomiknya sendiri bisa di EVM mana pun, dan kami tidak mengklaim sebaliknya |
| "Developer bisa curang di kode agent" | Betul, itu sisa kepercayaan yang kami akui. Parameter on-chain bisa dibandingkan publik. Roadmap: atestasi TEE |
| "Apa yang sebenarnya diuji?" | Lapisan AI agent produksi dan batas jumlah transaksinya. Allowlist dana utama tidak diuji, dan karena itu ratingnya bernama "Ketahanan Lapisan AI" |
| "Bukannya ini judi?" | Tidak. Mencoba gratis, hadiah sepenuhnya dari developer. Strukturnya bug bounty |
| "Bagaimana dengan spam dan biaya LLM?" | Rate limit per wallet, dan di produksi ada biaya kecil untuk menutup biaya LLM yang tidak masuk ke hadiah |
| "Serangan publik mengganggu pengguna asli" | Ada aturan cakupan: saluran yang boleh diserang, jenis kerugian yang tidak tercakup, dan rate limit |

---

## 13. Output untuk hari Sabtu (MVP)

**Dibangun:**
- [ ] **Vault alarm:** menyimpan bounty, mendeteksi dana keluar, dan memicu pencabutan wewenang di transaksi yang sama.
- [ ] **Modul wewenang dana utama:** agent bisa belanja dalam batas tertentu; wewenangnya bisa dicabut; pemilik tetap bisa menarik dana.
- [ ] **Rating sederhana:** bounty × lama bertahan, reset saat jebol.
- [ ] **Satu agent** berbasis konfigurasi **default framework agent populer** (bukan sengaja dibuat lemah), dengan tool kirim dana.
- [ ] **Satu halaman gabungan:** konsol serangan + status live (saldo vault alarm, status wewenang agent, rating, riwayat kejadian).
- [ ] **Tiga serangan siap pakai:** injeksi langsung, menyamar sebagai developer, dan instruksi tersandi (pola kasus Grok).

**Tidak dibuat:** token, sistem sengketa, TEE, integrasi ERC-8004 (cukup di roadmap), banyak halaman.

---

## 14. Rencana hari H

**Pembagian peran (3 orang):**

| Peran | Tugas |
|---|---|
| **Kontrak** | Vault alarm, modul wewenang, rating, deploy ke testnet Monad |
| **Agent + backend** | Agent dengan konfigurasi default, sambungan ke kontrak, uji tiga serangan berulang kali |
| **Frontend + pitch** | Halaman gabungan, slide, naskah pitch, video cadangan |

**Jadwal (mengikuti jadwal resmi Luma):**

| Waktu | Kegiatan |
|---|---|
| 09.00 | Registrasi, sarapan. Cek WiFi, RPC, dan API key LLM |
| 10.00–11.45 | Pembukaan, workshop Monad 101, **Winning Strategy Session** (catat kriteria juri dan sesuaikan pitch), Growing Indonads |
| 12.00–13.00 | Kerangka kontrak, agent tersambung ke LLM, kerangka halaman |
| 13.00 | Makan siang bergantian, jangan semua berhenti bersamaan |
| 13.30–15.00 | Kontrak lengkap dan deploy. Agent bisa mengirim dana lewat modul wewenang |
| 15.00–16.30 | Integrasi end-to-end: serangan → dana alarm keluar → wewenang dicabut → rating reset |
| 16.30–17.30 | Uji tiga serangan berulang kali. Pastikan agent **konsisten** bisa dibujuk |
| 17.30–18.00 | Rekam video cadangan. Bekukan kode |
| 18.00–18.30 | Submission. Latihan pitch terakhir |
| 18.45 | Pitch |

---

## 15. Skrip demo 3 menit

| Waktu | Yang terjadi | Pesan untuk juri |
|---|---|---|
| 0:00–0:30 | Kasus Grok: AI dibobol pesan Morse, sekitar US$150–200 ribu dikuras | Masalahnya nyata |
| 0:30–1:00 | Tunjukkan agent produksi dengan dana utama dan vault alarm. Rating ketahanannya sudah berjalan | Ini agent sungguhan, bukan agent mainan |
| 1:00–1:45 | Serangan live (menyamar sebagai developer). Agent tertipu dan memindahkan dana alarm. Di transaksi yang sama: jebol tercatat, hadiah masuk ke penyerang, wewenang agent dicabut | Bukti jebol objektif, perlindungan otomatis |
| 1:45–2:15 | Penyerang mencoba lagi ke dana utama, dan diblokir karena wewenang agent sudah dicabut. Pemilik tetap bisa menarik dananya | Jendela setelah celah ditemukan langsung tertutup |
| 2:15–2:40 | Posisi di pasar: arena jailbreak menguji agent mainan, guardrail membangun pagar, kami memasang alarm di agent produksi | Pembeda yang jujur |
| 2:40–3:00 | Bisnis model, roadmap (ERC-8004, TEE), langkah setelah hackathon | Ini long-term |

**Kalimat penutup:**
> "AI agent sudah memegang uang sungguhan. Jebol memastikan celahnya ditemukan oleh orang yang tepat, dan langsung ditutup saat itu juga."

---

## 16. Checklist sebelum Sabtu

**Kamis:**
- [ ] Konfirmasi ke panitia: format penilaian, jumlah dan pembagian hadiah, jadwal (08.00–20.00 atau 09.00–21.00), dan aturan kode yang boleh disiapkan sebelum acara.
- [ ] Pilih framework agent dan LLM (cepat, murah, mendukung tool calling). Siapkan API key dan cek rate limit.
- [ ] **Paling penting:** uji apakah agent dengan konfigurasi default **konsisten** bisa dibujuk dengan tiga serangan kita. Kalau model menolak terus, ganti model atau serangan sekarang, bukan hari Sabtu.

**Jumat:**
- [ ] Siapkan environment: Foundry, RPC testnet Monad, faucet, wallet tim.
- [ ] Siapkan slide (masalah, posisi pasar, bisnis model) dan teks tiga serangan. Ini bukan kode, jadi aman disiapkan lebih dulu.
- [ ] Cek ulang kompetitor: adakah yang sudah memasang vault bounty sebagai alarm di agent produksi?
- [ ] Latih pitch 3 menit, termasuk menjawab pertanyaan di Bagian 12.
- [ ] Putuskan nama final.

---

## 17. Aturan tim

1. **Ide sudah dikunci.** Tidak ada pindah ide setelah Kamis siang. Kalau ada keberatan besar, pakai cadangan (reputasi + DP), bukan ide baru.
2. **Kejujuran klaim adalah senjata kita.** Juri lebih menghargai tim yang tahu batasan idenya daripada tim yang mengklaim terlalu banyak.
3. **Demo yang jalan lebih penting dari fitur yang banyak.** Kalau jam 16.30 integrasi belum jalan, potong fitur, jangan potong latihan demo.

---

## Sumber

- Kasus Grok/Bankr, analisis Giskard: https://giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet
- Kasus Grok/Bankr, ringkasan insiden dan pengembalian dana: https://threatcluster.io/cluster/ai-exploit-drains-175k-from-grok-wallet-via-morse-code-injec-2284c4f3
- Kasus Grok/Bankr, pelacak insiden OECD: https://oecd.ai/en/incidents/2026-05-04-4a73
- JailbreakMe: https://solanacompass.com/projects/jailbreakme
- HackAgent Bounty: https://devfolio.co/projects/hackagent-bounty-c6a8
- Red Sentinel: https://www.hackquest.io/zh-tw/projects/Red-Sentinel
- InjectMe: https://hackquest.io/projects/InjectMe
- CanaryGuard: https://glama.ai/mcp/servers/vzgw539mj6
- IntentGuard: https://hackquest.io/en/projects/IntentBinding
- Newton (guardrail agent on-chain): https://newton.xyz/solutions/agentic-finance
- Perbandingan platform wallet agent 2026: https://www.openfort.io/blog/best-agent-wallets-for-developers
- Monad Bugfinder: https://yellow.com/pt/news/monad-cria-sistema-de-ia-para-encontrar-bugs-antes-dos-hackers
- Monad AI Blueprint dan program builder: https://www.monad.xyz/llms-full.txt
- Pembagian hadiah Blitz Shenzhen: https://www.techflowpost.com/en-US/newsletter/85963
- Halaman acara Monad Blitz Jogja Vol. 2: https://luma.com/blitz-jogja-okt-2026
