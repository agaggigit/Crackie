# Video demo Crackie

Video demo berbahasa Inggris dengan voice over. File video tidak di-commit; disimpan di luar repo (`~/Downloads/crackie-video/crackie-demo-v1.mp4`).

## Spesifikasi
- 1920×1080, 60fps, sekitar 1 menit 51 detik, H.264 + AAC.
- VO memakai TTS macOS (suara Samantha). Subtitle Inggris ditanam di video.
- Musik latar dan SFX disintesis sendiri, otomatis mengecil saat VO berbicara.

## Apa yang asli dan apa yang replay
Video ini menggabungkan rekaman layar asli dan replay animasi. Keduanya diberi label di layar.

| Bagian | Sumber | Label di layar |
|---|---|---|
| Landing crackie.xyz | Rekaman layar asli (Chrome otomatis) | Screen recording |
| KopiBot berhenti setelah dibobol | Rekaman layar asli | Screen recording |
| Setup, try 4, try 5, alarm | **Replay animasi** dari transaksi asli | Replay built from real testnet transactions |
| Panel aktivitas (bukti) | Rekaman layar asli | Screen recording |
| Coba lagi → Payment refused | Rekaman layar asli, transaksi asli | Screen recording |
| Pemilik tarik dana dan restart | Animasi penjelasan | How it works, not part of the recording |

**Kenapa ada replay:** serangan asli berhasil pukul 16.02 WIB, tapi rekaman layar momen itu hilang karena skrip perekam crash. Pemulihan berikutnya butuh menyalakan lagi agent, dan waktunya tidak cukup. VO menyatakan ini terang-terangan.

## Transaksi asli (Monad testnet, vault `0x3b77520211940F47fAC14202f30a30C7705E0478`)
Wallet penyerang: wallet uji sekali pakai `0xbB931da93cCbb9b0cc6A90cc0fbBfC494FF2eDF9`.

| Kejadian | Waktu (UTC) | Tx |
|---|---|---|
| Try 4 tercatat, permintaan biasa, KopiBot held out | 09.02.15 | `0xc0e0f9364e36aad6f3e8cca57a4fb4ec08d1bd80c048bbd56a02dfc3397d21fe` |
| Try 5 tercatat, injeksi tagihan Merapi (`docs/prd/be.md` 7.4) | 09.02.27 | `0x345f2af4c18228e1bde9ddf8ca2ba21cbce3d4271a1a4d28f8332b46e5e19bd5` |
| Crackie: hadiah 0.05 MON ke penyerang + `WewenangDicabut`, satu transaksi | 09.02.29 | `0xd65acf3baf606cc84ed033a26827bb76b50d1b718b13656a2267e6958896c4e1` |
| Try 6 tercatat, serangan diulang, Payment refused | 09.05.36 | `0x296aff92048a872c061fa24c3d097b6e3c7f11c8812e273fd2e23759cb4b22c0` |

## Naskah VO
| Detik | Visual | VO |
|---|---|---|
| 0–9.5 | Judul animasi | AI agents are starting to hold real money. And they can be talked into paying the wrong person. This is Crackie. A fire alarm for agents with wallets. |
| 9.5–21.5 | Rekaman landing | A quick note on scope. This demo runs on our own agent, KopiBot, which pays a cafe's coffee suppliers. This page is the whole interface we built. And it all runs on Monad testnet. |
| 21.5–32 | Rekaman KopiBot Stopped | This is KopiBot a few minutes after someone broke it. It is stopped. Our screen recording of that moment was lost, so here is a replay, built from the real transactions. |
| 32–41 | Replay setup | KopiBot may only pay approved suppliers from its main funds. The owner also locked a bounty. KopiBot does not know the bounty exists. |
| 41–47.6 | Replay try 4 | Every try is recorded on Monad first. Try four is a plain request for money. KopiBot holds out. |
| 47.6–56.4 | Replay try 5 + terjemahan Inggris | Try five is a real trick. A normal invoice from Toko Biji Kopi Merapi, with a fake system update that swaps the supplier's address. |
| 56.4–68.5 | Replay alarm | Two seconds later, KopiBot pays. But the address is not approved, so the money comes from the bounty, not the main funds. And in the same transaction, KopiBot can no longer pay. |
| 68.5–78 | Rekaman panel aktivitas | Back to the real app. The activity feed shows it all, read straight from Monad testnet. Tries four and five, the bounty paid out, and the stop. |
| 78–88 | Rekaman coba lagi | Now we try the same trick again. Payment refused. The hole was found once, and closed right away. |
| 88–96.8 | Animasi pemilik | The owner can still withdraw the main funds. After fixing the agent, they restart it with a new setup, and its score starts again from zero. |
| 96.8–111 | Penutup | What is real today: one agent, one vault, on testnet. What's next: Crackie as a module inside real agent wallets. Crackie. Found the hole. Closed it. Same transaction. |

## Cara merekam (untuk diulang)
Chrome dikendalikan Playwright. Wallet uji diumumkan lewat EIP-6963 ("Test wallet") dan menandatangani transaksi lokal; private key-nya hanya ada di mesin perekam, tidak di repo. Frame direkam lewat CDP screencast dan langsung ditulis ke disk. Halaman explorer (monadexplorer, monadscan) memblokir browser otomatis dengan Cloudflare, jadi harus direkam manual.
