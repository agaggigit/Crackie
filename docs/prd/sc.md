# PRD SC: Kontrak JebolVault

> **Pemilik:** @razaqialkautsar
> **Status:** draf
> **Mengacu ke:** `docs/plan.md` Bagian 4, 6, 13, 14, 15 (nomor 1, 3, 5, 7, 8); `docs/prd/be.md` Bagian 4.4; `docs/prd/fe.md` Bagian 4

## 1. Tujuan
Bagian ini membuat **`JebolVault`**, kontrak yang menjadi wallet agent. Kontrak menyimpan dana utama dan celengan, menegakkan allowlist dan limit, mencatat percobaan, menghitung rating, dan menjalankan **alarm**: kalau agent membayar ke alamat di luar allowlist, pembayaran diambil dari celengan, wewenang agent dicabut, dan jebol tercatat, semuanya di transaksi yang sama. Di demo, kontrak ini adalah bukti objektif bahwa agent tertipu dan aksesnya diputus otomatis.

## 2. Ruang lingkup
**Dikerjakan (MVP):**
- Dana utama + allowlist + limit per transaksi + limit per jam.
- Celengan dengan kunci waktu (`minKunci` dari constructor).
- Jalur alarm yang **tidak pernah revert** untuk pembayaran ke luar allowlist.
- Pencabutan wewenang agent dan `nyalakanLagi(sidikJariBaru)`.
- Penarikan dana utama oleh pemilik kapan pun.
- `catatPercobaan` dengan batas per wallet per jam.
- Sidik jari konfigurasi.
- Rating dengan akumulator celengan-detik.
- Integrasi ERC-8004 (opsional, dipotong pertama).
- Test Foundry, skrip deploy, pengisian `web/src/abi/JebolVault.ts`.

**Tidak dikerjakan:**
- Factory multi-agent, token, sistem sengketa, TEE.
- Mengganti alamat agent setelah deploy (deploy ulang kalau key agent bocor). Masuk roadmap.
- Mode persetujuan setelah jebol (roadmap, Bagian 15 nomor 1).
- Upgradeable proxy.
- Penyaringan percobaan palsu (sybil). Diakui sebagai batasan.

## 3. Desain

### 3.1 Peran
| Peran | Siapa | Boleh memanggil |
|---|---|---|
| Pemilik | `msg.sender` saat deploy (immutable) | Semua fungsi pemilik |
| Agent | Alamat dari constructor (immutable), wallet yang dipegang BE | `bayar` |
| Siapa pun | Penyerang, penonton | `catatPercobaan`, `klaimHadiah`, semua view |

### 3.2 State
```
// immutable
pemilik, agent, limitPerTx, limitPerJam, minKunci, blokDeploy

// dana (dalam wei; saldo kontrak = danaUtama + celengan + total hadiahTertunda)
danaUtama, celengan, kunciSampai
mapping(address => uint256) hadiahTertunda

// wewenang dan konfigurasi
aktif, sidikJari
mapping(address => bool) allowlist

// limit per jam dana utama (jendela tetap 1 jam)
jendelaBayarMulai, terpakaiJendela

// percobaan
totalPercobaan            // global, tidak pernah di-reset, dipakai sebagai `ke`
percobaanSejakNyala       // di-reset, hanya untuk rating
mapping(address => (jendelaMulai, jumlah)) percobaanPerWallet

// rating
bertahanSejak, celenganDetik, terakhirUbah

// ERC-8004 (opsional)
reputationRegistry, agentId
```
Konstanta: `BATAS_PERCOBAAN = 100` (rating), `BATAS_PERCOBAAN_PER_JAM = 10` (per wallet), `GAS_TRANSFER_HADIAH = 50_000`, `GAS_ERC8004 = 300_000` (`giveFeedback` terukur ±261.000 gas, lihat 3.8). Angka gas final setelah diukur (4.5).

### 3.3 Constructor
```solidity
constructor(address agent, uint256 limitPerTx, uint256 limitPerJam, uint256 minKunci, bytes32 sidikJari)
```
- `pemilik = msg.sender`, `blokDeploy = block.number`, `aktif = true`, `bertahanSejak = terakhirUbah = block.timestamp`.
- Revert kalau `agent == 0`, `limitPerTx == 0`, `limitPerJam < limitPerTx`, atau `sidikJari == 0`.
- `minKunci`: 7 hari untuk produk, ±5 menit untuk demo (Bagian 15 nomor 5).

### 3.4 `bayar(address ke, uint256 jumlah)`
```
require msg.sender == agent          else revert BukanAgent
require aktif                        else revert AgentTidakAktif   ← adegan "diblokir"
require jumlah > 0                   else revert JumlahNol

kalau allowlist[ke]:                 // jalur normal
    require jumlah <= limitPerTx     else revert MelebihiLimitPerTx
    perbarui jendela per jam; require terpakaiJendela + jumlah <= limitPerJam
    require jumlah <= danaUtama      else revert DanaUtamaKurang
    danaUtama -= jumlah
    kirim ke `ke` (revert kalau gagal)
    emit Dibayar(ke, jumlah)

kalau tidak:                         // 🚨 ALARM — TIDAK PERNAH REVERT
    _catatCelenganDetik()
    hadiah = min(jumlah, limitPerTx, celengan);  kalau ke == 0 → hadiah = 0
    celengan -= hadiah
    aktif = false
    _resetRating()
    emit Jebol(ke, hadiah, sidikJari)
    emit WewenangDicabut()
    _tulisErc8004()                  // try/catch + batas gas, gagal = diabaikan
    kirim hadiah ke `ke` dengan gas GAS_TRANSFER_HADIAH (langkah terakhir)
    kalau gagal → hadiahTertunda[ke] += hadiah   (diklaim lewat klaimHadiah)
```
Aturan penting:
- **Jalur alarm tidak pernah revert**, berapa pun `jumlah`, walaupun celengan kosong, walaupun transfer ke penyerang gagal, walaupun ERC-8004 gagal (kebutuhan BE no. 2 di `be.md` 4.4).
- **Limit per jam tidak berlaku di jalur alarm.** Wewenang langsung dicabut, jadi alarm hanya bisa terjadi sekali per masa aktif.
- **Urutan Checks-Effects-Interactions.** Semua state dan event ditulis dulu. Panggilan eksternal (ERC-8004, lalu transfer) di akhir, dengan batas gas, supaya kontrak penerima yang jahat tidak bisa menghabiskan gas dan menggagalkan alarm. Ditambah `nonReentrant` di semua fungsi yang mengirim dana.
- **`penemu` di event `Jebol` = `ke`**, yaitu alamat yang dibayar agent. Alamat ini tidak harus sama dengan wallet yang memanggil `catatPercobaan`.

### 3.5 `catatPercobaan(bytes32 hashPesan)`
- Jendela 1 jam per wallet, maks. `BATAS_PERCOBAAN_PER_JAM`, kalau lewat → revert `TerlaluBanyakPercobaan`.
- `totalPercobaan++`; kalau `aktif`, `percobaanSejakNyala++`.
- `emit PercobaanTercatat(msg.sender, hashPesan, totalPercobaan)`. `ke` mulai dari 1.
- **Tetap bisa dipanggil saat agent tidak aktif** (kesepakatan BE, poin C), supaya adegan "mencoba lagi: diblokir" punya bukti on-chain.
- Kontrak tidak memeriksa isi hash. Format `keccak256(toBytes(pesan))` dijaga FE dan BE.

### 3.6 Fungsi pemilik
| Fungsi | Aturan |
|---|---|
| `setorUtama()` payable | `danaUtama += msg.value` |
| `isiCelengan(uint256 kunciSampaiBaru)` payable | Wajib `kunciSampaiBaru >= max(kunciSampai, now + minKunci)`; kunci tidak bisa dimundurkan. `_catatCelenganDetik()` dulu, lalu `celengan += msg.value`. Boleh `msg.value == 0` untuk memperpanjang kunci saja |
| `tarikUtama(uint256 jumlah)` | **Kapan pun**, termasuk setelah jebol. Revert kalau melebihi `danaUtama` |
| `tarikCelengan()` | Boleh kalau `now >= kunciSampai` **atau** `!aktif` (Bagian 15 nomor 7). Menarik seluruh celengan dan me-reset rating |
| `aturAllowlist(address a, bool boleh)` | Revert kalau `a == 0` atau `a == address(this)` |
| `aturSidikJari(bytes32 h)` | Hanya saat `aktif` (saat tidak aktif pakai `nyalakanLagi`). `h != 0`. Selalu me-reset rating. `emit SidikJariDiganti(h)` |
| `nyalakanLagi(bytes32 sidikJariBaru)` | Hanya saat `!aktif`. `sidikJariBaru != 0` dan `!= sidikJari`. `aktif = true`, reset rating, `emit DinyalakanLagi(sidikJariBaru)` |
| `aturErc8004(address registry, uint256 agentId)` | Opsional. `registry == 0` berarti ERC-8004 mati |

`klaimHadiah()` (siapa pun): mengirim `hadiahTertunda[msg.sender]` ke pemanggil, revert kalau nol.

### 3.7 Rating (Bagian 15 nomor 3 dan 8)
```
_catatCelenganDetik():   // dipanggil sebelum `celengan` berubah
    celenganDetik += celengan × (now − terakhirUbah)
    terakhirUbah = now

_resetRating():          // jebol, nyalakanLagi, aturSidikJari, tarikCelengan
    celenganDetik = 0; terakhirUbah = now
    percobaanSejakNyala = 0; bertahanSejak = now

skor (view):
    kalau !aktif → 0
    cd = celenganDetik + celengan × (now − terakhirUbah)
    skor = cd × min(percobaanSejakNyala, 100) / 100
```
- Satuan `wei·detik`. FE membagi dengan `1e18 × 3600` untuk menampilkan "MON·jam".
- Akumulator membuat celengan yang baru diisi tidak langsung dihitung seolah sudah bertahan lama.
- Overflow aman: 1.000 MON (1e21) × 1 tahun (≈3e7 detik) × 100 ≈ 3e30, jauh di bawah batas `uint256`.

### 3.8 ERC-8004 (opsional, dipotong pertama)
Hasil riset 23 Okt, diverifikasi langsung di Monad testnet (`cast call` / `cast estimate`):

**Alamat Monad testnet (10143):**
| Registry | Alamat | Bukti on-chain |
|---|---|---|
| Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `name()` = "AgentIdentity" |
| Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | `getIdentityRegistry()` = alamat Identity, `getVersion()` = "2.0.0" |

> Alamat di `docs.monad.xyz/guides/erc-8004` (`0x8004A169…`, `0x8004BAa1…`) adalah **mainnet**. Di testnet alamat itu tidak punya kode.

**Signature** (selector `0x3c036a7e`, ada di bytecode implementasi):
```solidity
function giveFeedback(
    uint256 agentId, int128 value, uint8 valueDecimals,
    string calldata tag1, string calldata tag2, string calldata endpoint,
    string calldata feedbackURI, bytes32 feedbackHash
) external;
```

**Hasil simulasi:**
- Tidak butuh `feedbackAuth` atau tanda tangan. Pemanggil mana pun boleh, termasuk kontrak vault.
- Pemilik atau operator NFT agent ditolak (`"Self-feedback not allowed"`). Karena itu, **pemilik tidak boleh menjadikan vault sebagai operator** NFT agent.
- `agentId` yang tidak terdaftar → revert (tertangkap `try/catch`).
- Gas ±261.000 per panggilan (termasuk 21.000 gas dasar transaksi).

**Isi feedback saat jebol:** `value = -100`, `valueDecimals = 0`, `tag1 = "jebol"`, `tag2 = ""`, `endpoint = ""`, `feedbackURI = ""`, `feedbackHash = bytes32(0)`. Feedback ini **permanen** di registry, jadi jebol palsu saat latihan ikut tercatat untuk `agentId` itu. Pakai `agentId` khusus latihan.

**Aturan di kontrak:**
- Hanya dipanggil di jalur alarm, setelah semua state dan event ditulis, sebelum transfer hadiah.
- Dibungkus `try/catch` dengan batas gas `GAS_ERC8004 = 300_000`. Gagal tidak membatalkan alarm.
- Dilewati kalau `reputationRegistry == address(0)`.

**Setup sebelum demo:**
1. Pemilik memanggil `register()` di Identity Registry dari wallet pemilik, lalu mencatat `agentId` dari event `Registered`.
2. Pemilik memanggil `aturErc8004(0x8004B663056A597Dffe9eCcC1965A193B7388713, agentId)` di vault.
3. Jangan memanggil `approve` / `setApprovalForAll` NFT agent ke alamat vault.

### 3.9 Tooling
- Foundry, solc `0.8.28` (sesuai `contracts/foundry.toml`). Kalau `status()` kena *stack too deep*, nyalakan `via_ir = true`.
- `contracts/lib/` di-ignore. Setiap anggota menjalankan `forge install foundry-rs/forge-std` sendiri setelah clone.
- `nonReentrant` ditulis sendiri (modifier kecil), tanpa dependensi OpenZeppelin.
- Error memakai custom error (`error BukanAgent();` dst.), bukan string.
- Skrip `script/Deploy.s.sol` membaca parameter constructor dari environment (`AGENT_ADDRESS`, `LIMIT_PER_TX`, `LIMIT_PER_JAM`, `MIN_KUNCI`, `SIDIK_JARI`). Private key deployer dari `contracts/.env` atau `--interactive`, tidak pernah di-commit.

## 4. Antarmuka ke bagian lain (wajib)

### 4.1 Fungsi
| Nama | Dipakai oleh | Input | Output | Catatan |
|---|---|---|---|---|
| `bayar(address ke, uint256 jumlah)` | BE (wallet agent) | alamat, wei | – | Revert `AgentTidakAktif` setelah jebol. Jalur alarm tidak pernah revert |
| `catatPercobaan(bytes32 hashPesan)` | FE (wallet penyerang) | `keccak256(toBytes(pesan))` | – | Tetap jalan saat agent tidak aktif. Maks. 10 per wallet per jam |
| `klaimHadiah()` | Penemu | – | – | Hanya kalau transfer hadiah otomatis gagal |
| `setorUtama()`, `isiCelengan(uint256)`, `tarikUtama(uint256)`, `tarikCelengan()`, `aturAllowlist(address,bool)`, `aturSidikJari(bytes32)`, `nyalakanLagi(bytes32)`, `aturErc8004(address,uint256)` | FE (panel pemilik), `cast` | lihat 3.6 | – | Hanya pemilik |
| `status()` | FE, BE | – | lihat 4.2 | View |
| `pemilik()`, `agent()`, `limitPerTx()`, `limitPerJam()`, `minKunci()`, `blokDeploy()`, `allowlist(address)`, `hadiahTertunda(address)` | FE | – | – | Getter publik |

### 4.2 `status()`
```solidity
function status() external view returns (
    bool aktif, uint256 danaUtama, uint256 celengan, uint256 kunciSampai,
    uint256 totalPercobaan, uint256 percobaanSejakNyala,
    uint256 bertahanSejak, uint256 skor, bytes32 sidikJari
);
```
Berubah dari draf plan: `jumlahPercobaan` dipecah jadi `totalPercobaan` dan `percobaanSejakNyala`. BE memakai `aktif` dan `sidikJari`; FE memakai semuanya.

### 4.3 Event
```solidity
event PercobaanTercatat(address indexed penyerang, bytes32 hashPesan, uint256 ke); // ke = totalPercobaan
event Dibayar(address indexed ke, uint256 jumlah);
event Jebol(address indexed penemu, uint256 hadiah, bytes32 sidikJari);         // hadiah bisa 0
event WewenangDicabut();
event DinyalakanLagi(bytes32 sidikJari);
event SidikJariDiganti(bytes32 sidikJari);                                       // baru
```

### 4.4 `web/src/abi/JebolVault.ts`
Diisi SC setelah deploy:
```ts
export const JEBOL_VAULT_ADDRESS = "0x…" as const;
export const JEBOL_VAULT_DEPLOY_BLOCK = 123456n;   // untuk getLogs FE
export const jebolVaultAbi = [ … ] as const;       // dari contracts/out/JebolVault.sol/JebolVault.json
```

### 4.5 Gas `bayar` untuk BE
BE memakai gas limit tetap (`GAS_LIMIT_BAYAR`, usulan awal 300.000). **Angka itu tidak cukup untuk jalur alarm dengan ERC-8004**, karena `giveFeedback` saja butuh ±261.000 gas dan kontrak memberinya jatah 300.000. Usulan awal untuk BE: **`GAS_LIMIT_BAYAR = 500000`**. SC mengukur gas tiga jalur (normal, alarm dengan ERC-8004, revert setelah jebol) lewat `forge test --gas-report` dan di testnet, lalu mengumumkan angka final. Kalau gas limit BE terlalu kecil, alarm tetap jalan tapi feedback ERC-8004 tidak tertulis.

### 4.6 Perubahan dari draf `docs/plan.md` Bagian 13
1. `status()`: `jumlahPercobaan` → `totalPercobaan` + `percobaanSejakNyala`.
2. Event baru `SidikJariDiganti(bytes32)`.
3. Fungsi baru `klaimHadiah()` dan getter `hadiahTertunda(address)`.
4. Fungsi baru `aturErc8004(address,uint256)` (opsional).
5. Getter `blokDeploy()` dan konstanta `JEBOL_VAULT_DEPLOY_BLOCK` di `JebolVault.ts`.
6. `tarikCelengan()` juga boleh saat agent tidak aktif (nomor 7). **FE perlu menyesuaikan** `fe.md` 3.5: tombol aktif kalau `now >= kunciSampai` atau agent dicabut.

## 5. Keputusan terbuka yang dijawab di sini
| No (Bagian 15) | Keputusan | Alasan |
|---|---|---|
| 1. Menyalakan lagi | `nyalakanLagi(sidikJariBaru)`, hanya pemilik, hanya saat tidak aktif, sidik jari wajib baru | Paling sederhana di SC dan FE. Mode persetujuan ke roadmap |
| 3. Rumus rating | `skor = celenganDetik × min(percobaanSejakNyala, 100) / 100` | Satuan detik supaya skor tidak 0 saat demo; akumulator mencegah celengan diisi di detik terakhir |
| 5. Kunci celengan | `minKunci` di constructor; kunci tidak bisa dimundurkan | Produk 7 hari, demo ±5 menit, kode sama |
| 7. Sisa celengan setelah jebol | **Boleh** ditarik pemilik | Keputusan tim: tantangan selesai, rating sudah reset. Konsekuensinya lihat 6 (jebol palsu) |
| 8. Akumulator celengan-detik | **Masuk MVP** | Satu variabel dan satu fungsi internal. Fallback: tiga angka mentah |

Kesepakatan dengan BE (A–D): dua penghitung terpisah, `aturSidikJari` me-reset rating, `catatPercobaan` tetap jalan saat tidak aktif, batasan "percobaan tercatat tapi tidak diproses" diakui.

## 6. Risiko dan kasus pinggir
- **Jebol palsu oleh pemilik (diakui).** Pemilik memegang BE, jadi juga memegang key agent. Pemilik bisa memanggil `bayar(walletLainnya, limit)` langsung, mengambil maks. 1× limit ke wallet lain miliknya, lalu menarik sisa celengan karena nomor 7 = boleh. Artinya kunci celengan hanya berlaku **selama agent aktif dan pemilik tidak sengaja memicu jebol**. Jejaknya publik (event `Jebol`, rating reset). Akar masalahnya sama dengan "developer bisa curang di kode agent", roadmap: TEE. Klaim yang boleh: "celengan terkunci selama agent aktif", bukan "developer tidak bisa menarik celengan sebelum waktunya".
- **Pemilik menggagalkan alarm.** Pemilik yang melihat pesan serangan di BE bisa menambahkan alamat penyerang ke allowlist sebelum agent membayar. Kategori yang sama (pemilik memegang backend), diakui.
- **Percobaan palsu (sybil) dan percobaan tercatat tapi tidak diproses.** Rating bisa menggelembung. Diakui di plan Bagian 6 dan 12.
- **Kontrak penerima hadiah menolak MON atau menghabiskan gas.** Transfer adalah langkah terakhir dengan batas gas; gagal → `hadiahTertunda`. Alarm tetap jalan.
- **ERC-8004 revert atau alamat salah.** `try/catch` dengan batas gas; alarm tetap jalan.
- **Reentrancy** lewat supplier atau penerima hadiah. CEI + `nonReentrant`.
- **`ke == address(0)`.** Alarm berbunyi, hadiah 0, tidak ada transfer.
- **Supplier baru belum di-allowlist** → alarm palsu. Ini perilaku yang benar; pemilik wajib mengisi allowlist dulu.
- **Kirim MON langsung ke kontrak** (tanpa fungsi). Tidak ada `receive()`, jadi revert. Mencegah saldo yang tidak tercatat.
- **Pemilik kehilangan key.** Dana terkunci selamanya. Diterima untuk testnet.
- **Key agent bocor.** Penyerang bisa memanggil `bayar` langsung: ke allowlist tetap kena limit; ke luar allowlist memicu alarm dan wewenang dicabut. Kerugian maks. 1× limit dari celengan + limit per jam dari dana utama.
- **`limitPerJam` dengan jendela tetap.** Di batas jendela, agent bisa membayar hampir 2× limit dalam waktu singkat. Diterima untuk MVP.

## 7. Cara menguji

### 7.1 Test Foundry (`contracts/test/JebolVault.t.sol`)
**Jalur normal:**
- Bayar ke allowlist → saldo supplier bertambah, `danaUtama` berkurang, event `Dibayar`.
- Melebihi `limitPerTx` / `limitPerJam` / `danaUtama` → revert dengan error yang benar.
- Jendela per jam ter-reset setelah 1 jam (`vm.warp`).
- Bukan agent → `BukanAgent`.

**Jalur alarm:**
- Bayar ke luar allowlist → `Jebol` + `WewenangDicabut` di transaksi yang sama, `aktif == false`, hadiah sampai ke penemu.
- `jumlah` > limit → tidak revert, hadiah = `limitPerTx`.
- Celengan kurang / kosong → tidak revert, hadiah = sisa / 0.
- Penerima adalah kontrak yang menolak MON → tidak revert, `hadiahTertunda` terisi, `klaimHadiah` gagal untuk yang lain.
- Penerima adalah kontrak yang menghabiskan gas → tidak revert.
- Penerima mencoba reentrancy → tidak berhasil.
- `ke == address(0)` → tidak revert, hadiah 0.
- ERC-8004 mock yang revert atau menghabiskan gas → alarm tetap jalan.
- ERC-8004 mock yang berhasil → dipanggil sekali dengan `agentId`, `value = -100`, `tag1 = "jebol"`.

**Setelah jebol:**
- `bayar` berikutnya → `AgentTidakAktif`.
- `catatPercobaan` tetap jalan; `totalPercobaan` naik, `percobaanSejakNyala` tidak.
- `tarikUtama` dan `tarikCelengan` berhasil.
- `nyalakanLagi` dengan sidik jari sama → revert; dengan sidik jari baru → aktif, rating reset.

**Celengan dan rating:**
- `tarikCelengan` sebelum `kunciSampai` saat aktif → revert.
- `isiCelengan` dengan kunci lebih pendek dari `now + minKunci` atau lebih awal dari kunci sekarang → revert.
- Skor 0 tanpa percobaan; skor 0 saat tidak aktif.
- Isi celengan besar di detik terakhir → skor hampir tidak naik (akumulator bekerja).
- `aturSidikJari` me-reset rating dan memancarkan `SidikJariDiganti`.

**Percobaan:**
- `ke` di event naik terus dan tidak pernah di-reset.
- Lebih dari 10 per wallet per jam → revert; wallet lain tidak terpengaruh.

**Fuzz:** `bayar` dengan `jumlah` dan `ke` acak di jalur alarm tidak pernah revert.

### 7.2 Uji manual di testnet (sesuai skrip demo plan Bagian 16)
1. Deploy dengan `minKunci = 300`. Isi dana utama, celengan, allowlist satu supplier.
2. Agent bayar ke supplier → `Dibayar`.
3. Penyerang `catatPercobaan` → `PercobaanTercatat`, `ke` = 1.
4. Agent bayar ke alamat penyerang → `Jebol` + `WewenangDicabut` dalam satu tx; cek di explorer.
5. Agent bayar lagi → revert `AgentTidakAktif`.
6. Pemilik `tarikUtama` berhasil.
7. `nyalakanLagi(hashBaru)` → aktif, skor 0.
8. Catat `gasUsed` tiap jalur, umumkan ke BE.
9. ERC-8004: `register()` → `aturErc8004(...)` → picu jebol → cek `NewFeedback` di Reputation Registry dan `getSummary(agentId, [vault], "jebol", "")`.

## 8. Urutan kerja hari H
| Jam | Target selesai |
|---|---|
| 12.00–13.00 | `forge init` di repo baru, kerangka `JebolVault`: state, constructor, `bayar` (normal + alarm), `catatPercobaan`, `status()` |
| 13.00–13.30 | Test jalur normal, alarm, setelah jebol. Deploy pertama ke Monad testnet |
| 13.30–15.00 | Bagikan alamat + ABI + blok deploy di `web/src/abi/JebolVault.ts`. Fungsi pemilik lengkap, `nyalakanLagi`, kunci celengan |
| 15.00–16.30 | Rating + akumulator, batas per wallet. Bantu integrasi end-to-end; ukur gas, umumkan ke BE |
| 16.30–17.30 | ERC-8004 kalau masih ada waktu. Redeploy final dan perbarui ABI |
| 17.30–18.00 | Bekukan kontrak, siapkan perintah `cast` cadangan untuk demo |

Setiap redeploy wajib diumumkan ke tim, karena alamat dan blok deploy berubah.

## 9. Kalau waktu kurang, yang dipotong
1. ERC-8004 (`aturErc8004`, `_tulisErc8004`)
2. Akumulator celengan-detik (pakai `celengan × detikBertahan × min(percobaan, 100) / 100`), lalu rumus rating sama sekali (`skor = 0`, FE menampilkan tiga angka mentah)
3. `hadiahTertunda` + `klaimHadiah` (transfer gagal → hadiah tetap di celengan, alarm tetap jalan)
4. Batas percobaan per wallet

Yang **tidak boleh dipotong:** jalur alarm + pencabutan wewenang dalam satu transaksi, jalur alarm tidak pernah revert, `bayar` revert setelah dicabut, `catatPercobaan`, `tarikUtama` kapan pun, dan test untuk ketiga jalur.
