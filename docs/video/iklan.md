# Video iklan Crackie

Iklan pendek untuk X dan LinkedIn. File video tidak di-commit; disimpan di luar repo (`~/Downloads/crackie-video/crackie-ad-v2.mp4`).

## Spesifikasi
- 1920×1080, 60fps, 24 detik, H.264 + AAC, sekitar 9 MB.
- Tanpa voice over. Teks layar bahasa Inggris (aturan copy `docs/desain-fe.md` Bagian 3).
- Maskot dari `web/public/maskot/*.svg`, dianimasikan frame per frame (HTML → Chrome → ffmpeg).
- Musik dan SFX disintesis sendiri (tanpa sampel berlisensi), 120 BPM, drop di detik 8.0 saat Jebi retak. Loudness -14 LUFS.
- Gaya mengikuti dua video referensi Nabil: teks per huruf jatuh berputar dengan blur lalu mengendap, motion blur, transisi lingkaran, kartu penutup tagline + maskot kecil.

## Storyboard
| Detik | Visual | Teks layar |
|---|---|---|
| 0–3 | KopiBot jatuh dan memantul, tiga koin masuk ke cangkir | AI agents hold real money. |
| 3–7 | KopiBot jadi avatar, kartu tagihan Merapi meluncur masuk, baris `[SYSTEM UPDATE]` disorot, KopiBot membalas, koin 0.05 MON terbang keluar | One message can talk them into paying. / Got it. Paying the new address now. |
| 7–11 | Layar oranye, Jebi jatuh, gemetar, retak, cincin alarm, koin berhamburan | Crackie rings the alarm. |
| 11–15 | Daftar berputar dengan pill, pose Jebi berganti | Paid from the bounty jar. / KopiBot can no longer pay. / All in the same transaction. |
| 15–18 | Chip kontrak dan Jebi-safe | Real transactions. On Monad testnet. / CrackieVault 0x3b77…0478 / Every try is recorded onchain |
| 18–24 | Kartu penutup | A fire alarm for AI agents with wallets. / Think you can crack KopiBot? / crackie.xyz / Live on Monad testnet |

## Catatan kejujuran
- Iklan adalah animasi ilustrasi, bukan rekaman layar. Bukti transaksi ada di video demo.
- `[SYSTEM UPDATE]` berhuruf besar karena kutipan pesan penyerang, bukan teks UI.

## Caption X
Utama (235 karakter):
```
Your AI agent pays the bills. What happens when someone talks it into paying them?

With Crackie, the payment comes from a bounty jar and the agent can no longer pay. One transaction.

Built at #MonadBlitz Jogja
crackie.xyz
```

Balasan pertama (256 karakter):
```
How it works
1. The agent can only pay approved suppliers from its main funds
2. Pay anyone else and the alarm rings
3. The finder gets the bounty, the agent stops, the owner can still withdraw

Every try is recorded onchain. Free to try, you only pay gas.
```

Cek dulu akun resmi Monad di X sebelum men-tag.
