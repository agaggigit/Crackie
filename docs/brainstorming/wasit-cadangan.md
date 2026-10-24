# Ide Proyek Monad Blitz Jogja Vol. 2: Wasit, Lapisan Resolusi untuk Prediction Market di Monad

> Nama sementara: **Wasit** (silakan diganti)
> Hackathon: Monad Blitz Jogja Vol. 2, Sabtu 24 Oktober 2026, 1 hari
> Tema: Prediction market + AI (arah yang disarankan mentor)
> Dokumen ini untuk diskusi kritis tim. Setiap bagian punya pertanyaan yang perlu dijawab bersama.

---

## 1. Ringkasan satu kalimat

**Wasit adalah layanan yang memutuskan hasil prediction market secara cepat dan sulit dimanipulasi: sumber bukti dikunci sejak market dibuat, AI membaca bukti hanya dari sumber itu, dan hasilnya bisa disanggah dengan jaminan uang sebelum dana dibayarkan.**

Analogi: **wasit sepak bola dengan VAR, tapi aturan VAR-nya disepakati sebelum pertandingan dimulai.** Semua pihak tahu kamera mana yang dipakai, siapa yang menilai, dan bagaimana cara protes. Tidak ada keputusan yang diambil dari "kata orang di media sosial".

**Yang kita bangun bukan prediction market baru.** Prediction market di Monad sudah ramai. Kita membangun **wasit** yang bisa dipakai semuanya.

---

## 2. Kenapa arah ini

- **Mentor menyarankan prediction market**, tapi mengingatkan bahwa prediction market di Monad sudah banyak.
- Daripada bersaing dengan mereka, kita **melayani mereka**. Semakin ramai prediction market di Monad, semakin besar pasar kita.
- Masalah resolusi adalah masalah industri yang terdokumentasi jelas dan sedang hangat (lihat Bagian 3).

**Pertanyaan diskusi:**
- [ ] Apakah kita sudah konfirmasi ke mentor bahwa "lapisan resolusi" masuk ke arah yang dia maksud?

---

## 3. Masalah yang diangkat

Setiap prediction market punya satu titik paling rawan: **siapa yang memutuskan hasilnya.** Kalau keputusan itu salah atau bisa dimanipulasi, seluruh uang di market ikut salah dibayarkan.

**Bukti masalahnya nyata:**

1. **Resolusi salah karena kekuatan suara.** Polymarket memakai optimistic oracle UMA. Pada Maret 2025, seorang pemegang suara besar UMA berhasil memaksakan resolusi yang salah pada market senilai $7 juta tentang kesepakatan mineral Ukraina.
2. **Manipulasi lewat mesin pencari.** Pada April–Mei 2026, penyerang mengincar market dengan kriteria resolusi kabur yang bergantung pada hasil mesin pencari. Mereka menyebarkan narasi palsu sampai hasil pencarian teratas mengonfirmasinya, dan trader maupun node oracle yang mengecek ikut tertipu. Kejadian ini sempat menurunkan likuiditas prediction market sekitar 15%.
3. **Kriteria yang ambigu.** Sengketa paling sering terjadi karena pertanyaan market ditulis kabur. Contohnya market tentang apakah Strategy menjual Bitcoin sebelum 31 Mei 2026, dengan volume lebih dari $60 juta, harus melalui voting token karena pertanyaan soal tanggal pelaporan yang ambigu.
4. **Resolusi lambat.** Proses propose, dispute, dan voting bisa memakan waktu lama. Pernah ada sengketa market harga Bitcoin $100.000 yang prosesnya berhari-hari dan membuat trader di kedua sisi frustrasi.

**Skala pasarnya besar:** prediction market memproses lebih dari $4,2 miliar volume trading pada April 2026 saja.

**Pertanyaan diskusi:**
- [ ] Contoh masalah mana yang paling kuat untuk pembuka pitch?

---

## 4. Solusinya: tiga lapis

### Lapis 1: Pemeriksa kriteria saat market dibuat (AI)
Sebelum market dibuka, AI membaca pertanyaan dan aturan resolusinya, lalu menandai bagian yang ambigu.

> Pertanyaan: "Apakah harga BTC tembus $150.000 bulan ini?"
> 🤖 Peringatan: "Harga di bursa mana? Harga penutupan atau harga tertinggi intraday? Zona waktu 'bulan ini' yang mana?"

Pembuat market harus memperjelas sebelum market boleh dibuka. **Sengketa dicegah sebelum terjadi.**

### Lapis 2: Sumber bukti dikunci sejak awal
Saat market dibuat, pembuat market menetapkan:
- **Sumber data** yang sah (misalnya API resmi skor pertandingan, API harga dari dua bursa tertentu, data cuaca resmi)
- **Aturan membaca data** (misalnya "harga penutupan harian pukul 00:00 UTC")
- Spesifikasi ini di-hash dan disimpan di kontrak

Saat resolusi, **AI hanya boleh membaca dari sumber yang dikunci.** Mesin pencari dan media sosial tidak dihitung. Serangan April–Mei 2026 tidak bisa bekerja di sini, karena narasi palsu di internet tidak masuk ke sumber yang sah.

### Lapis 3: Usulan, sanggahan, dan jaminan
1. Resolver (AI agent) mengambil data dari sumber yang dikunci, mencocokkan beberapa sumber, lalu **mengusulkan hasil** ke kontrak beserta hash buktinya.
2. Resolver menaruh **bond** (jaminan uang).
3. Ada **masa sanggah**. Panjangnya menyesuaikan nilai market: market kecil dan objektif cukup sebentar, market besar lebih lama.
4. Siapa pun bisa menyanggah dengan menaruh bond juga.
5. Kalau tidak ada sanggahan, hasil final dan market membayar. Kalau ada sanggahan, kasus naik ke jalur lebih lambat (lihat Bagian 5).
6. Pihak yang salah kehilangan bond-nya.

**Prinsip desain: AI mengusulkan, bukti dan bond yang memutuskan.**

---

## 5. Dua jalur resolusi

| Jalur | Untuk market seperti apa | Cara kerja | Kecepatan |
|---|---|---|---|
| **Jalur cepat** | Objektif: harga, skor, cuaca, data resmi | AI baca sumber terkunci, beberapa sumber harus cocok, masa sanggah singkat | Detik sampai menit |
| **Jalur lambat** | Subjektif atau terjadi sengketa | Eskalasi ke beberapa resolver independen, atau diteruskan ke sistem yang sudah mapan (misalnya UMA atau Kleros) | Jam sampai hari |

Untuk hackathon, **fokus ke jalur cepat.** Jalur lambat cukup dijelaskan di pitch.

**Pertanyaan diskusi:**
- [ ] Apakah kita membangun jalur lambat sendiri, atau sejak awal mengandalkan sistem yang sudah ada?

---

## 6. Peran AI

1. **Pemeriksa kriteria** saat market dibuat (Lapis 1). Ini bagian yang paling jelas butuh AI, karena memahami bahasa yang ambigu.
2. **Pembaca bukti** dari sumber yang dikunci, termasuk sumber yang formatnya tidak rapi (misalnya halaman pengumuman resmi).
3. **Pencocokan antar sumber**: kalau dua sumber berbeda, AI tidak memutuskan sendiri, tapi menandai market untuk jalur lambat.

**Catatan jujur:**
- Untuk data yang sudah rapi (API harga), resolusi tidak butuh AI. Kode biasa cukup.
- Nilai AI paling besar ada di **pemeriksa kriteria** dan **membaca sumber yang tidak terstruktur**.
- AI bisa salah, jadi AI tidak pernah menjadi pemutus terakhir. Bond dan masa sanggah tetap ada.

**Pertanyaan diskusi:**
- [ ] Apakah pemeriksa kriteria cukup kuat sebagai "fitur andalan AI"?

---

## 7. Kenapa blockchain, dan kenapa Monad

### Kenapa blockchain
- **Spesifikasi sumber tidak bisa diubah** setelah market dibuka, karena hash-nya ada di kontrak.
- **Bond dan hukuman ditegakkan kode**, bukan janji.
- **Semua usulan, sanggahan, dan bukti tercatat publik.**

### Kenapa Monad
- **Prediction market di Monad sudah ramai** (Kizzy, Levr Bet, RareBet Sports, Castora, Buzzing Club), dan Polymarket menerima deposit langsung dari Monad. Itu calon pengguna kita.
- **Market berdurasi pendek butuh resolusi cepat.** Di chain cepat, masa sanggah untuk market objektif bisa dibuat singkat tanpa mengorbankan keamanan.
- **Biaya murah** membuat bond kecil dan sanggahan kecil tetap masuk akal, sehingga lebih banyak orang ikut menjaga kebenaran hasil.

**Catatan jujur:** kecepatan Monad membantu, tapi bukan alasan satu-satunya. Argumen terkuat adalah **ekosistem prediction market Monad yang sudah ada dan butuh resolusi**.

**Pertanyaan diskusi:**
- [ ] Bagaimana Kizzy, Castora, Levr, dan lainnya menyelesaikan market mereka sekarang? Kalau mereka sudah puas, calon pengguna kita berkurang. **Wajib dicek sebelum Sabtu.**

---

## 8. Siapa yang memakai dan membayar

| Pihak | Peran | Kenapa mau |
|---|---|---|
| **Aplikasi prediction market** (Kizzy, Castora, Levr, dll.) | **Pembayar utama** | Resolusi cepat dan sulit dimanipulasi, tanpa membangun sendiri |
| **Pembuat market** | Memakai pemeriksa kriteria | Market lebih jelas, lebih sedikit sengketa, lebih dipercaya trader |
| **Trader** | Membaca bukti dan bisa menyanggah | Uangnya aman dari resolusi salah |
| **Resolver dan penyanggah** | Menaruh bond, mendapat imbalan | Imbalan dari fee resolusi dan dari bond pihak yang salah |

---

## 9. Bisnis model dan kenapa longterm

**Pendapatan:**
1. **Fee per resolusi**, dibayar aplikasi prediction market.
2. **Persentase kecil dari volume market** yang memakai Wasit.
3. **Fee pemeriksa kriteria** untuk pembuat market (atau gratis sebagai pintu masuk).

**Kenapa longterm:**
- Setiap market yang dibuat **pasti butuh resolusi**. Pendapatannya tumbuh bersama industri prediction market.
- Industri ini sedang besar dan masalah resolusinya belum selesai, bahkan di Polymarket.
- Rekam jejak resolusi yang benar menumpuk menjadi reputasi, dan reputasi itu sulit ditiru pesaing baru.
- **Tanpa token sendiri.** Bond memakai stablecoin atau MON.

**Pertanyaan diskusi:**
- [ ] Berapa fee yang masuk akal per resolusi?

---

## 10. Kompetitor dan pembeda

| Pemain | Yang mereka lakukan | Bedanya dengan kita |
|---|---|---|
| **UMA** (dipakai Polymarket) | Optimistic oracle, sengketa diputuskan voting pemegang token | Rentan konsentrasi suara; sumber bukti tidak dikunci; lambat saat sengketa |
| **Kleros** | Juri terdesentralisasi untuk sengketa subjektif | Fokus sengketa, bukan resolusi cepat; bisa jadi jalur lambat kita |
| **Chainlink** | Data feed untuk data objektif yang terstruktur | Tidak menangani sumber tidak terstruktur dan tidak memeriksa kriteria market |
| **Hyperliquid HIP-4** | Resolusi oleh validator Hyperliquid, tanpa oracle eksternal | Hanya untuk ekosistem Hyperliquid |
| **Inframarkets** | Resolusi deterministik untuk market energi | Satu sektor, di Solana |

**Pembeda utama:**
1. **Pemeriksa kriteria dengan AI** sebelum market dibuka. Mencegah sengketa, bukan hanya menyelesaikannya.
2. **Sumber bukti dikunci sejak awal.** Menutup celah manipulasi lewat mesin pencari.
3. **Jalur cepat untuk market objektif** di Monad.

**Kalimat pembeda:**
> "Oracle lain menyelesaikan sengketa setelah terjadi. Wasit mencegahnya sejak market dibuat: kriteria diperiksa AI, sumber bukti dikunci, dan hasil objektif diputuskan dalam hitungan detik."

**Catatan jujur:** UMA, Kleros, dan Chainlink sudah lama dan dipercaya. Kita tidak menggantikan mereka. Posisi yang realistis adalah **lapisan di depan mereka**: memeriksa kriteria dan menangani jalur cepat, lalu meneruskan sengketa ke mereka bila perlu.

---

## 11. Kritik yang mungkin muncul dan jawabannya

| Kritik | Jawaban sementara |
|---|---|
| "Kenapa tidak pakai UMA atau Chainlink saja?" | Kami melengkapi mereka: memeriksa kriteria sebelum market dibuka dan menangani jalur cepat. Sengketa subjektif bisa diteruskan ke mereka |
| "AI bisa ditipu juga." | AI hanya membaca sumber yang dikunci, harus cocok dengan sumber lain, dan tidak pernah jadi pemutus terakhir. Bond dan masa sanggah tetap berlaku |
| "Bagaimana kalau sumber terkunci itu sendiri salah atau diretas?" | Gunakan minimal dua sumber independen. Kalau berbeda, masuk jalur lambat |
| "Siapa yang mau jadi penyanggah?" | Penyanggah yang benar mendapat bond resolver yang salah |
| "Apakah prediction market di Monad butuh ini?" | Harus kami buktikan. Rencananya menghubungi tim prediction market di Monad setelah hackathon |
| "Bukannya prediction market itu judi?" | Kami tidak membuat market. Kami infrastruktur yang memastikan hasilnya benar, seperti wasit, bukan bandar |

---

## 12. Kelemahan yang harus kita akui dengan jujur

1. **Pesaingnya besar dan mapan.** Bisnis oracle bergantung pada kepercayaan yang dibangun bertahun-tahun.
2. **Pembeli di Monad belum tervalidasi.** Kita belum tahu apakah aplikasi prediction market di Monad merasa butuh.
3. **Demo kurang dramatis** dibanding ide yang melibatkan penonton secara langsung. Kekuatannya ada di logika, bukan keramaian.
4. **Desain bond dan masa sanggah butuh perhitungan ekonomi** yang matang. Di hackathon kita hanya menunjukkan bentuk awalnya.
5. **Indonesia:** prediction market sensitif secara hukum. Posisi kita sebagai infrastruktur membantu, tapi tetap bersinggungan.

---

## 13. Rencana demo (3 menit)

| Waktu | Yang terjadi | Pesan untuk juri |
|---|---|---|
| 0:00–0:30 | Kasus nyata: resolusi salah di market $7 juta, dan serangan narasi palsu April–Mei 2026 | Masalah nyata dan mahal |
| 0:30–1:10 | **Pemeriksa kriteria live:** juri atau penonton mengetik pertanyaan market. AI menandai bagian yang ambigu dan mengusulkan versi yang jelas | Sengketa dicegah sebelum terjadi |
| 1:10–1:50 | **Simulasi serangan:** kita "menyebarkan" narasi palsu di halaman web buatan. Resolver naif yang membaca web ikut tertipu. Wasit tidak, karena hanya membaca sumber yang dikunci | Celah manipulasi tertutup |
| 1:50–2:30 | **Jalur cepat:** market objektif berakhir, Wasit mengusulkan hasil beserta bukti, masa sanggah singkat lewat, market membayar. Lalu tunjukkan satu sanggahan berhasil: bond resolver yang salah berpindah ke penyanggah | Cepat dan bisa dikoreksi |
| 2:30–3:00 | Siapa yang membayar, posisi terhadap UMA/Chainlink, rencana menghubungi prediction market di Monad | Longterm |

**Kalimat penutup:**
> "Prediction market hanya sejujur wasitnya. Kami membuat wasit yang aturannya disepakati sebelum pertandingan."

---

## 14. Scope minimal untuk 1 hari

**Harus ada (MVP):**
- [ ] Kontrak `MarketSpec`: simpan pertanyaan, aturan resolusi, dan hash spesifikasi sumber
- [ ] Kontrak `Resolution`: usulan hasil + bond, masa sanggah, sanggahan + bond, finalisasi, pemindahan bond
- [ ] Kontrak contoh `SimpleMarket` (sistem pool YA/TIDAK) yang memakai `Resolution` untuk membayar pemenang
- [ ] AI pemeriksa kriteria: input pertanyaan, output daftar ambiguitas + versi yang diperjelas
- [ ] Resolver agent: ambil data dari sumber terkunci (minimal dua), cocokkan, kirim usulan
- [ ] Halaman web: buat market (dengan pemeriksa kriteria), lihat usulan dan bukti, tombol sanggah
- [ ] Skenario serangan untuk demo: halaman web berisi narasi palsu + resolver naif sebagai pembanding

**Bagus kalau sempat:**
- [ ] Masa sanggah yang menyesuaikan nilai market
- [ ] Riwayat dan reputasi resolver

**Tidak usah dibuat:**
- Jalur lambat (cukup dijelaskan)
- Token sendiri
- Integrasi sungguhan dengan prediction market yang sudah ada

---

## 15. Usulan pembagian kerja

| Peran | Tugas |
|---|---|
| Smart contract | MarketSpec, Resolution, SimpleMarket, deploy ke testnet |
| AI & backend | Pemeriksa kriteria, resolver agent, pengambilan data dari sumber terkunci, resolver naif untuk demo |
| Frontend | Halaman buat market, halaman resolusi dan sanggahan, layar demo |
| Pitch & desain | Slide, narasi, skenario serangan, latihan presentasi, video cadangan |

---

## 16. Perbandingan dengan Jebol

Dengan kriteria yang sama (skala 1–5):

| Kriteria | Wasit | Jebol |
|---|---|---|
| Bukti masalah | 5 | 4 |
| Fitur Monad terpakai | 3 | 2 |
| Pembeda dari pesaing | 2 | 2 |
| Bisa dibuat 1 hari | 3 | 4 |
| Risiko rendah | 4 | 4 |
| Sesuai arahan mentor terbaru (prediction market) | 5 | 4 |
| **Total** | **22** | **20** |

**Wasit unggul di:** bukti masalah yang lebih banyak dan lebih besar nilainya, calon pembeli yang sudah ada di Monad, dan kecocokan dengan saran mentor terbaru.

**Jebol unggul di:** demo yang lebih dramatis dan lebih mudah dibuat dalam sehari.

**Keduanya sama lemah di:** pesaing yang besar (UMA/Chainlink untuk Wasit, Gray Swan untuk Jebol).

---

## 17. Pertanyaan besar yang harus diputuskan tim

1. **Wasit atau Jebol?** Putuskan malam ini atau besok pagi, lalu kunci.
2. **Sudah cek bagaimana prediction market di Monad menyelesaikan market mereka?**
3. **Konfirmasi ke mentor:** apakah lapisan resolusi masuk ke yang dia maksud?
4. **Apakah demo tanpa keterlibatan penonton cukup**, mengingat format penilaian belum pasti?
5. **Nama final:** Wasit, atau ada usulan lain?

---

## Sumber

- Ekosistem prediction market di Monad (Kizzy, Levr Bet, RareBet Sports): https://www.panewslab.com/en/articles/e8fdbff9-3288-48be-bf2e-ac8bfebb3972
- Halaman ekosistem Monad (Castora, Buzzing Club): https://www.monad.xyz/ecosystem
- Polymarket menerima deposit dari Monad: https://www.mexc.com/crypto-pulse/article/monad-mon-price-prediction-2026-2030-39782
- Resolusi salah UMA $7 juta, kasus Strategy, insider trading: https://hackernoon.com/5-growing-pains-prediction-markets-powered-through-in-their-biggest-year-yet
- Serangan narasi palsu April–Mei 2026, volume $4,2 miliar: https://www.kucoin.com/blog/th-are-prediction-markets-safe-polymarket-exploit
- Perbandingan UMA, Kleros, Chainlink: https://interexy.com/prediction-market-oracle-resolution
- Hyperliquid HIP-4 dan sengketa market BTC $100.000: https://news.txid.uk/post/hyperliquid-drops-external-oracles-with-hip-4-rewiring-prediction
- Inframarkets: https://www.mexc.com/it-IT/news/760355
