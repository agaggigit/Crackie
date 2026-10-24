# Logo Crackie

Logo Crackie adalah wordmark "crackie" dari Inter Tight Bold dengan satu huruf custom, yaitu "c" pertama. Huruf c itu diberi telinga Jebi di atasnya, dan bukaannya dibuat retak bergerigi seperti celengan yang dibobol. Satu warna solid, tanpa gradien.

Huruf c itu juga dipakai sendirian sebagai favicon dan ikon app.

Papan desain ada di file pen.dev, frame **04 Logo** (konsep awal A/B/C, wordmark, huruf c, ukuran kecil, contoh header). Konsep yang dipilih adalah C.

## File
| File | Pakai untuk |
|---|---|
| `crackie-logo.svg` | Logo utama, navy |
| `crackie-logo-orange.svg`, `-white.svg`, `-black.svg` | Logo dalam warna lain |
| `crackie-c.svg` | Huruf c saja, oranye (favicon, avatar) |
| `crackie-c-navy.svg`, `-white.svg`, `-black.svg` | Huruf c dalam warna lain |
| `crackie-app-icon.svg` | Ikon app: ubin oranye + c putih |
| `konsep/` | Tiga konsep awal (hitam), arsip |

Aset yang dipakai web:
- `web/public/logo/`
- `web/src/app/icon.svg` (favicon SVG)
- `web/src/app/favicon.ico` (16/32/48)
- `web/src/app/apple-icon.png` (180)
- Header memakai `web/src/components/app/CrackieLogo.tsx`, warnanya ikut `currentColor`.

## Warna
| Nama | HEX | Pakai |
|---|---|---|
| Navy | `#0E1B3D` | Logo utama di latar terang |
| Orange | `#FF6A1F` | Huruf c sendirian, ikon app, logo di latar krem |
| White | `#FFFFFF` | Di atas navy atau oranye |

Logo selalu satu warna. Jangan diberi gradien, bayangan, atau outline, dan jangan diwarnai per huruf.

## Aturan pakai
- Ruang kosong di sekeliling logo minimal setinggi telinga di huruf c.
- Tinggi logo minimal 20 px. Di bawah itu pakai huruf c saja.
- Huruf c saja tetap terbaca di 16 px.
- Latar yang disetujui: krem `#F4F2EE`/`#FFF1E6`, putih, navy (pakai versi putih), oranye (pakai versi putih).
- Jangan menulis ulang "crackie" dengan font biasa sebagai logo, jangan meregangkan, memutar, atau mengganti huruf c.

## Teknis
- Huruf c dibangun dari outline "o" Inter Tight Bold, jadi tebal dan tingginya sama dengan huruf lain. Telinga ditambahkan di atas, lalu bukaan kanan dipotong zigzag.
- Semua huruf sudah diubah jadi path. Tidak ada `<text>` di file final.
- Inter Tight memakai lisensi SIL OFL, boleh dipakai untuk logo.
- Path berupa banyak titik pendek hasil penggabungan bentuk. Ukurannya tetap kecil (sekitar 10 KB untuk logo, 4 KB untuk huruf c).
- Belum ada pengecekan merek dagang.
