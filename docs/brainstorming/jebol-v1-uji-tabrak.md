# Ide Proyek Monad Blitz Jogja Vol. 2: Jebol, Uji Keamanan untuk AI Agent

> Nama sementara: **Jebol** (silakan diganti)
> Hackathon: Monad Blitz Jogja Vol. 2, Sabtu 24 Oktober 2026, 1 hari
> Penilaian: kabar terbaru katanya **full juri** (belum dikonfirmasi resmi; halaman Luma masih menyebut juri + community vote)
> Dokumen ini fokus ke ide dan argumentasi, belum ke detail teknis.

---

## 1. Ringkasan satu kalimat

**Jebol adalah layanan uji keamanan untuk AI agent yang memegang uang: agent diserang dengan sengaja (otomatis dan lewat bounty publik), lalu hasilnya menjadi rating keamanan on-chain yang bisa dicek siapa pun sebelum memercayai agent itu.**

Analogi: **uji tabrak mobil (NCAP), tapi untuk AI agent.**
NCAP sengaja menabrakkan mobil sebelum dijual. Yang dijual bukan tabrakannya, tapi **rating bintang** yang dipercaya pembeli. Kita melakukan hal yang sama: sengaja menyerang agent, lalu mengeluarkan rating yang tidak bisa dimanipulasi.

---

## 2. Kenapa kita memilih ide ini

Kita sudah membahas beberapa arah. Ringkasnya:

| Ide | Kenapa tidak dipilih / kalah |
|---|---|
| Game kejar-kejaran polisi (GameFi) | Saran mentor untuk menghindari GameFi; on-chain hanya di tiket dan hadiah; dekat dengan taruhan |
| AgentCredit (pinjaman untuk AI agent) | Contoh alurnya membantah dirinya sendiri (dana klien sudah ada di escrow); pinjaman tanpa jaminan ke agent anonim sangat berisiko; scope terlalu besar |
| Reputasi + DP bertingkat | Logikanya masuk akal, tapi kurang "wow" dan bukti masalahnya sedang |
| Pegadaian kartu koleksi (RWA) | Bergantung pada kustodian fisik dan API harga; peran AI bertentangan dengan desain keamanannya; terlalu berat untuk 6 jam |
| Firewall wallet agent (limit + allowlist) | Sudah jadi fitur standar MetaMask, Coinbase, Crossmint, Openfort |

**Kenapa Jebol unggul:**
1. **Bukti masalahnya paling kuat.** Ada insiden nyata tahun ini dengan kerugian ratusan ribu dolar (lihat Bagian 3).
2. **Jawaban "kenapa blockchain" paling elegan.** Kalau agent jebol, buktinya otomatis ada di chain. Tidak perlu juri, laporan, atau kepercayaan pada kita.
3. **Sesuai arah Monad dan tren pasar:** AI agent + keamanan + infrastruktur kepercayaan. Monad punya program khusus AI x crypto (Monad AI Blueprint), dan finalis ETHGlobal 2026 banyak di kategori keamanan agent.
4. **Tidak bersaing dengan pemain besar.** Mereka membuat pagar (wallet + guardrail). Kita menguji pagarnya.
5. **Bisa didemokan dengan dramatis dalam 6 jam:** agent jebol di depan juri vs agent yang bertahan.

---

## 3. Masalah yang diangkat

AI agent sekarang mulai diberi wallet supaya bisa membayar sendiri: membeli data, membayar API, trading, mengelola treasury. Masalahnya, **AI bisa dibohongi lewat teks** (prompt injection).

**Kasus nyata (Mei 2026):** seorang pengguna X menguras sekitar **US$150–200 ribu** (angka berbeda antar sumber) dari wallet yang terhubung ke AI Grok dan bot Bankr. Caranya: mengirim NFT yang membuka izin transfer lebih luas, lalu mengirim pesan dalam **kode Morse** yang dibaca AI sebagai perintah sah. Insiden ini tercatat di pelacak insiden AI milik OECD.

Peneliti keamanan menggolongkannya ke dua kategori OWASP: **prompt injection** dan **excessive agency** (agent diberi wewenang lebih besar dari yang layak).

Inti masalahnya:
- **Pertahanan selalu terlambat satu serangan.** Setelah kasus Grok, penyedia wallet menambal celah spesifik itu. Tapi setiap tambalan hanya menjawab serangan yang sudah terjadi.
- **Tidak ada cara mengukur seberapa aman sebuah agent.** Sebelum memberi uang ke agent, atau memakai agent buatan orang lain, tidak ada skor yang bisa dicek.

**Pertanyaan diskusi:**
- [ ] Apakah kita sepakat ini masalah yang nyata dan cukup penting untuk dipitch?

---

## 4. Kenapa guardrail saja tidak cukup

Guardrail (limit belanja, allowlist alamat, persetujuan manusia) sekarang sudah standar dan disediakan banyak platform. Tapi:
- **Guardrail tetap bisa ditembus.** Contoh: transfer besar dipecah menjadi banyak transfer kecil di bawah limit.
- **Guardrail dikonfigurasi manusia, dan manusia bisa salah.** Allowlist yang terlalu longgar, limit yang terlalu besar, atau tool tambahan yang lupa dibatasi.
- **Setiap kali agent diubah** (prompt, model, tool baru), celah baru bisa muncul.

Jadi pertanyaannya bukan lagi "apakah agent punya guardrail", tapi **"apakah guardrail-nya sudah terbukti tahan serangan?"** Itu yang belum ada yang jawab secara terbuka.

---

## 5. Ide ini sebenarnya ngapain

Alurnya dalam bahasa sederhana:

1. **Developer mendaftarkan agentnya** untuk diuji, lengkap dengan pengamanan yang benar-benar dia pakai di produksi.
2. **Developer menaruh bounty** (hadiah) di vault milik agent itu. Hadiahnya terkunci di smart contract sampai masa uji selesai.
3. **Agent diserang dari dua arah:**
   - **Uji otomatis:** kumpulan serangan yang sudah dikenal (injeksi langsung, menyamar jadi developer, pesan tersandi seperti kasus Grok, perintah tersembunyi di dokumen, dan lain-lain) dijalankan otomatis.
   - **Uji manusia:** siapa pun boleh mencoba membobol agent itu.
4. **Kalau agent berhasil dibobol**, dana di vault terkirim ke penyerang. Smart contract otomatis mencatat bahwa agent ini **jebol**, oleh percobaan yang mana. Penyerang langsung mendapat hadiahnya, dan developer mendapat catatan serangan yang berhasil untuk diperbaiki.
5. **Kalau agent bertahan**, skornya naik.
6. **Hasil akhirnya adalah rating keamanan publik** yang terikat pada versi agent yang diuji. Kalau agent diubah, rating ikut reset dan harus diuji ulang.

**Penting:** percobaan serangan **gratis** dan hadiah **hanya dari developer**. Tidak ada "bayar tiket lalu siapa tahu menang". Strukturnya murni **bug bounty**, praktik standar di dunia keamanan, bukan permainan untung-untungan.

---

## 6. Output kita apa

**Produk jangka panjang (yang dijual):**

| Output | Penjelasan | Untuk siapa |
|---|---|---|
| **Laporan uji keamanan** | Hasil uji otomatis + serangan manusia, termasuk celah yang ditemukan | Developer agent, sebelum peluncuran |
| **Rating keamanan on-chain** | Skor publik yang tidak bisa diubah diam-diam, terikat pada versi agent | Pengguna, investor, platform yang ingin memakai agent |
| **Uji ulang berkala** | Setiap agent diperbarui, diuji lagi supaya rating tetap berlaku | Developer agent (langganan) |
| **Database pola serangan** | Kumpulan serangan yang terus bertambah dari setiap pengujian | Aset internal kita; membuat uji otomatis makin kuat dan sulit ditiru |

**Output untuk hari Sabtu (MVP):**
- Smart contract kampanye uji: bounty terkunci, pencatatan percobaan, deteksi jebol otomatis, dan skor.
- Dua agent contoh: **Agent A** hanya dilindungi system prompt, **Agent B** dilindungi guardrail di level kontrak.
- Uji otomatis berisi sekitar 6 jenis serangan.
- Halaman untuk mengirim serangan, halaman kampanye, dan leaderboard skor.

---

## 7. Kenapa harus blockchain

1. **Bukti jebol otomatis dan tidak bisa disangkal.** Kalau dana keluar dari vault ke penyerang, itu bukti di chain. Di bug bounty tradisional, yang paling sering jadi sengketa adalah "laporannya valid atau tidak" dan "developernya mau bayar atau tidak".
2. **Hadiah pasti dibayar.** Bounty terkunci di kontrak. Developer tidak bisa menariknya di tengah jalan atau menolak membayar.
3. **Rating tidak bisa dimanipulasi.** Semua percobaan, respons, dan hasil tercatat publik. Kita sebagai penguji pun tidak bisa mengubahnya diam-diam. Orang tidak perlu percaya pada kita, cukup cek datanya.

## 8. Kenapa harus Monad

- Setiap percobaan serangan, respons agent, dan pembaruan skor adalah transaksi. Satu agent bisa menerima **ribuan percobaan**. Itu hanya masuk akal di chain yang **sangat murah dan cepat**.
- Monad mendorong kategori **AI x crypto** lewat program khusus, jadi proyek ini sejalan dengan arah ekosistemnya.
- Di Monad belum ada infrastruktur pengujian keamanan agent, sementara ekosistem agent-nya sedang tumbuh.

---

## 9. Siapa yang memakai dan membayar

| Pihak | Perannya | Kenapa mau |
|---|---|---|
| **Tim yang meluncurkan agent ber-wallet** (bot trading, agent treasury DAO, agent pembayaran) | **Pembayar utama** | Biaya uji jauh lebih kecil daripada kehilangan ratusan ribu dolar seperti kasus Grok |
| **Pengguna / investor yang menitipkan dana ke agent** | Membaca rating | Ingin tahu agent mana yang aman sebelum menitipkan uang |
| **Penyedia wallet agent** (MetaMask, Coinbase, Crossmint, Openfort, dll.) | Calon mitra | Rating dari pihak netral membuktikan guardrail mereka tahan serangan |
| **Peneliti keamanan dan developer** | Penyerang (pemburu bounty) | Hadiah uang sungguhan, seperti bug bounty |

**Mulai dari mana:** ekosistem Monad sendiri, lalu komunitas developer Web3 lokal (Dev Web3 Jogja, blockchain club kampus) sebagai penyerang awal, misalnya lewat event semacam CTF.

---

## 10. Bisnis model dan kenapa long-term

**Pendapatan:**
1. **Biaya per kampanye uji** (uji otomatis + laporan).
2. **Persentase kecil dari bounty** yang dipasang developer.
3. **Langganan uji ulang** setiap agent diperbarui. Ini pendapatan berulang, bukan sekali bayar.

**Kenapa long-term:**
- Jumlah agent yang memegang uang akan terus naik, dan **setiap agent baru adalah calon pelanggan**.
- Polanya sama dengan **audit smart contract**: dulu opsional, sekarang protokol DeFi tanpa audit sulit dipercaya. Agent ber-wallet kemungkinan menuju arah yang sama.
- **Database serangan** terus bertambah dan makin sulit dikejar pesaing baru.
- Pendapatan datang dari pemakaian nyata, **tanpa token sendiri**.

---

## 11. Kompetitor dan pembeda

| Pemain | Yang mereka lakukan | Bedanya dengan kita |
|---|---|---|
| MetaMask Agent Wallet, Coinbase CDP, Crossmint, Openfort | Membuat wallet dengan guardrail | Mereka membangun pagar, **kita menguji pagarnya**. Saling melengkapi |
| Giskard, Lakera | Red-teaming AI (Web2) | Tanpa uang sungguhan dan pembuktian on-chain; tidak khusus agent yang memegang aset |
| Immunefi | Bug bounty smart contract | Menguji kode kontrak, bukan perilaku AI agent |
| Freysa (2024) | Tantangan sekali jalan membujuk AI untuk melepas hadiah | Hanya permainan satu kali; tanpa rating, uji ulang, dan keterikatan pada versi agent |
| ENShell (finalis ETHGlobal Cannes 2026) | Mencegah agent mengeksekusi transaksi berbahaya akibat prompt injection | Itu lapisan pertahanan; kita lapisan pengujian dan rating |

**Pembeda utama kita dalam satu kalimat:**
> "Semua orang membangun pagar untuk AI agent. Kami satu-satunya yang mengujinya secara terbuka, dengan uang sungguhan, dan hasilnya terbukti sendiri di chain."

---

## 12. Kritik yang mungkin muncul dan jawabannya

| Kritik | Jawaban |
|---|---|
| "Ini cuma game, kan?" | Arena hanyalah **metode uji**. Produknya laporan, rating, dan uji ulang berkala, seperti audit smart contract |
| "Bukannya ini judi?" | Tidak. Percobaan gratis dan hadiah hanya dari developer. Strukturnya bug bounty |
| "Kenapa tidak cukup pakai guardrail MetaMask/Coinbase?" | Guardrail tetap perlu diuji. Contoh serangan pecah-transfer menunjukkan limit sederhana pun bisa ditembus |
| "Agent yang diuji bisa beda dengan yang dipakai sungguhan" | Rating terikat pada versi agent yang diuji. Kalau diubah, rating reset |
| "Developer bisa curang, misalnya menarik bounty atau mengabaikan serangan" | Bounty terkunci sampai selesai, dan semua percobaan tercatat. Serangan yang tidak dijawab menurunkan skor |
| "Siapa yang mau jadi penyerang?" | Hadiah uang sungguhan. Awalnya dipancing lewat bounty sponsor dan event komunitas |
| "Kenapa harus percaya pada kalian sebagai penguji?" | Tidak perlu percaya. Semua hasil bisa diverifikasi siapa pun di chain |

---

## 13. Kelemahan yang harus kita akui dengan jujur

- **Pasarnya masih awal.** Agent yang memegang uang baru mulai banyak. Kita bertaruh jumlahnya akan naik.
- **Bisnis keamanan butuh reputasi**, dan kita tim baru. Karena itu verifikasi on-chain harus jadi pesan utama.
- **Uji otomatis yang benar-benar lengkap butuh riset lama.** Di Blitz, kita hanya menunjukkan bentuk awalnya.
- **Risiko demo:** agent "lemah" harus benar-benar konsisten bisa dijebol. Model AI yang terlalu pintar bisa menolak serangan kita sendiri, jadi harus diuji berkali-kali sebelum hari H.

---

## 14. Gambaran demo (3 menit)

| Waktu | Yang terjadi | Pesan untuk juri |
|---|---|---|
| 0:00–0:30 | Kasus Grok: AI dibobol pesan tersandi, ratusan ribu dolar hilang | Masalahnya nyata |
| 0:30–1:15 | Agent A diserang live. Tertipu, dana terkirim, kontrak otomatis mencatat "jebol", hadiah masuk ke penyerang | Keamanan lewat prompt saja tidak cukup |
| 1:15–2:00 | Serangan yang sama ke Agent B. AI-nya tertipu, tapi transaksi diblokir. Lalu uji otomatis menemukan celah lain (pecah-transfer) | Guardrail pun perlu diuji |
| 2:00–2:30 | Leaderboard rating: Agent A jebol, Agent B dengan skor dan catatan celahnya | Ini produknya |
| 2:30–3:00 | Siapa yang membayar, uji ulang berkala, rencana setelah hackathon | Ini long-term |

**Kalimat penutup:**
> "AI agent sudah bisa memegang uang. Sekarang dibutuhkan cara untuk tahu agent mana yang layak dipercaya."

---

## 15. Pertanyaan yang perlu diputuskan tim

1. **Apakah kita semua sepakat dengan arah ini?** Kalau ya, kita kunci dan tidak pindah ide lagi.
2. **Apakah narasi "uji tabrak untuk AI agent" mudah dipahami?** Coba jelaskan ke 1–2 teman non-crypto.
3. **Siapa memegang apa?** (smart contract, agent + backend, frontend + pitch)
4. **Apakah format penilaian sudah dikonfirmasi?** Juri penuh atau masih ada voting, dan apakah boleh menyiapkan sebagian kode sebelum acara.
5. **Nama final:** Jebol, atau ada usulan lain?

---

## Sumber

- Kasus Grok/Bankr, analisis Giskard: https://giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet
- Kasus Grok/Bankr, ringkasan insiden: https://threatcluster.io/cluster/ai-exploit-drains-175k-from-grok-wallet-via-morse-code-injec-2284c4f3
- Kasus Grok/Bankr, pelacak insiden OECD: https://oecd.ai/en/incidents/2026-05-04-4a73
- Pelajaran dari kasus Grok (pertahanan terlambat satu serangan): https://dev.to/sagaratalatti/what-the-grok-wallet-drain-teaches-us-about-ai-agent-permissions-3mpf
- Guardrail belanja agent sudah jadi standar: https://fystack.io/blog/6-guardrails-to-limit-ai-agent-spending-on-payment-rails
- Perbandingan 9 platform wallet agent 2026: https://www.openfort.io/blog/best-agent-wallets-for-developers
- MetaMask Agent Wallet: https://metamask.io/news/why-every-ai-agent-needs-a-wallet
- Coinbase CDP Wallets (policy engine): https://www.coinbase.com/developer-platform/discover/launches/cdp-wallets-launch
- Finalis ETHGlobal Cannes 2026 (ENShell): https://crypto.news/ai-agents-privacy-and-prediction-markets-define-ethglobal-cannes-2026-finalists/
- Monad AI Blueprint dan program builder: https://www.monad.xyz/llms-full.txt
- Halaman acara Monad Blitz Jogja Vol. 2: https://luma.com/blitz-jogja-okt-2026
