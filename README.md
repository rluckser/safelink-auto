# SafelinkEarn Auto — Lewati Safelink + Percepat Timer, Otomatis

Satu script Tampermonkey untuk melewati safelink **SafelinkEarn** (`sfe.ad`) secara otomatis: percepat timer, blokir popup iklan, klik tombol lanjut, scroll, sampai tombol akhir **Open Link**.

Dibuat karena link `sfe.ad` yang sama bisa mendarat di domain yang berbeda-beda dan teks tombolnya berubah-ubah tiap kunjungan. Script ini tidak mengunci nama domain — dia aktif kalau halaman cocok pola SafelinkEarn.

> **Status:** v3.0.0 — gabungan Timer Speeder + Skipper dalam 1 script. Sudah dicoba live 7 November 2026 (Start → Step 1/3 → Step 2/3 → Step 3/3 → Open Link) dan sudah diperbaiki supaya ringan di Firefox.

## Yang dibutuhkan

| Kebutuhan | Keterangan |
|---|---|
| Browser | Chrome, Edge, Brave, atau **Firefox** (semua bisa; script ini diuji di Firefox) |
| Ekstensi Tampermonkey | Gratis. Pasang dari toko ekstensi browser kamu (lihat bawah) |
| Akun apa pun | **Tidak perlu.** Tidak perlu akun GitHub, tidak perlu login ke mana pun |
| Aplikasi lain | Tidak ada |

### Pasang Tampermonkey dulu

- **Chrome / Edge / Brave:** buka [Tampermonkey di Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo), klik **Add to Chrome**.
- **Firefox:** buka [Tampermonkey di Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/), klik **Add to Firefox**.
- Setelah terpasang, ikon Tampermonkey muncul di toolbar browser. Itu saja — tidak perlu pengaturan lain.

## Cara pasang script (pilih 1)

### Cara 1 — Pasang 1 klik (paling mudah, disarankan)

1. Buka link ini di browser yang sudah terpasang Tampermonkey:
   **https://github.com/rluckser/safelink-auto/raw/main/safelink-auto-combined.user.js**
2. Tampermonkey akan membuka halaman instalasi dan menampilkan isi script.
3. Klik **Install**.
4. Selesai. Script langsung aktif, tidak perlu restart browser.

> Kalau nanti ada pembaruan, Tampermonkey akan menawarkannya secara otomatis dari link yang sama.

### Cara 2 — Salin-tempel manual

1. Buka file [`safelink-auto-combined.user.js`](safelink-auto-combined.user.js) di repo ini, klik **Raw**, lalu salin semua isinya (`Ctrl + A`, `Ctrl + C`).
2. Klik ikon Tampermonkey → **Create a new userscript** / **Buat script baru**.
3. Hapus semua isi bawaan di editor, tempel script yang tadi disalin (`Ctrl + V`).
4. Tekan `Ctrl + S` untuk menyimpan. Pastikan statusnya **Enabled**.

### Kalau sebelumnya sudah memasang script lama

Nonaktifkan / hapus dulu script-script lama ini, supaya tidak bentrok dan tidak dobel klik:

- `Safelink Skipper` (v1, pola umum)
- `SafelinkEarn Skipper` (v2.x)
- `SafelinkEarn Timer Speeder` (v1.x)

Cukup **satu** script yang aktif: `SafelinkEarn Auto v3.0.0` ini.

## Cara pakai

1. Buka link `sfe.ad` seperti biasa, di **satu tab**. Biarkan saja.
2. Script bekerja sendiri dari awal sampai akhir. Kamu bisa menonton panel kecil di kiri bawah yang menunjukkan statusnya.
3. Jangan buka `/v/start` langsung di tab baru, dan jangan pindah tab di tengah jalan — halaman safelink terikat sesi, jadi harus tetap di tab yang sama dari awal.

Tidak ada yang perlu diklik manual kalau semuanya berjalan normal.

### Panel di kiri bawah

| Tombol | Fungsi |
|---|---|
| **Percepat: ON 10x** | Ketuk untuk mematikan percepatan timer (timer jadi normal, auto-klik tetap jalan) |
| **Auto-klik: ON** | Ketuk untuk mematikan auto-klik (timer tetap dipercepat, kamu klik sendiri) |
| **2x / 5x / 10x** | Ganti kecepatan timer |
| **Jam dipercepat: OFF** | Cadangan eksperimental, hanya nyalakan kalau timer tetap lambat (lihat Batasan) |
| **Lanjut** | Tombol manual kalau di satu step otomatisnya macet |

## Cara kerjanya (alur yang sudah diverifikasi live)

Link `sfe.ad` → redirect ke halaman **Start** (`/v/start`), lalu 3 langkah artikel, lalu tombol akhir.

**Start**
- Tombol hijau `Please wait 3` → jadi `Click here to continue` / `Continue →` setelah ~3–5 detik.
- Klik pertama hampir selalu membuka tab iklan (Shopee / Stake.com) — script memblokir popup itu. Klik kedua yang memajukan halaman.

**Step 1/3, 2/3, 3/3** (ditulis juga sebagai `Step 1 of 3`)
- Tombol atas `Click to Verify >>` / `Click to Continue` → timer (pernah terlihat 11 detik, 7 detik, kadang tanpa timer) → `Scroll down to continue`.
- Script scroll otomatis ke bawah artikel, klik tombol `Next` → timer ~5 detik → tombol jadi `Go to the Next Step` / `Click Here to Continue`.
- Tombol **`DOWNLOAD CLICK 2X` tidak pernah diklik** — itu tombol iklan / decoy.

**Step 3 / akhir**
- Kadang pindah domain di tengah jalan (misal Step 1–2 di `crm.urlwebsite.com`, Step 3 di `insurance.cekresi.me`), kadang tanpa tombol Verify dan langsung `Scroll down to continue`.
- Tombol akhir oranye **`Open Link`** (tombol JavaScript, tanpa link yang terlihat) — script mengkliknya juga.

**Rotasi domain (terkonfirmasi)**
- Link `sfe.ad` yang sama, dibuka 3 kali di tab baru, mendarat 2 kali di `crm.urlwebsite.com/v/start` dan 1 kali di `invest.datapendidikan.com/v/start`. Judul dan alurnya sama (`SafelinkEarn`, `Verify you are human`). Sekali mendarat, domain tidak pindah lagi sampai Step 3, yang bisa pindah sekali lagi.
- Karena itu script mendeteksi pola halaman (judul `SafelinkEarn`, `/v/start`, teks `Step X/3`), bukan nama domain.

**Percepat timer**
- Timer countdown SafelinkEarn umumnya dibuat dengan `setInterval` 1 detik. Script mempercepat interval itu 10x (bawaan): 11 detik jadi ~1 detik, 7 dan 5 detik jadi kurang dari 1 detik.
- Hanya delay 1 detik ke atas yang dipercepat. Delay cepat (animasi) dibiarkan normal.
- Timer internal script sendiri memakai fungsi asli, jadi tidak ikut dipercepat dan tidak menumpuk. Tidak ada `MutationObserver` berat — polling 1 detik saja. Ini perbaikan setelah v1.0 sempat membuat Firefox lambat / crash.

## Batasan — dibaca dulu supaya tidak kaget

- **Timer yang dicek di server tidak bisa dipercepat.** Kalau timer tetap jalan normal walau percepatan ON, berarti timernya tipe jam (`Date.now`) atau dicek server. Coba nyalakan `Jam dipercepat` di panel. Kalau tetap lambat, biarkan saja — script lengkap ini tetap menunggu timer normal sambil mengklik otomatis.
- **Tidak ada captcha yang terlihat** di pemeriksaan 7 November 2026 (Start sampai Step 3). Kalau suatu hari muncul captcha, script tidak bisa dan tidak akan mencoba melewatinya — itu harus diisi manusia.
- **Link tujuan tidak ada di HTML.** Tombol-tombolnya tombol JavaScript tanpa `href`, dan `/v/start` terikat sesi. Jadi script tidak bisa melompat langsung ke link asli — dia harus mengikuti klik demi klik di tab yang sama. Itu memang cara kerja sistemnya.
- **Anti-adblock:** di pemeriksaan, tidak muncul peringatan anti-adblock karena iklan dibiarkan tampil. Script hanya memblokir *popup tab baru*, bukan iklannya. Kalau kamu memakai pemblokir iklan, tambahkan domain tujuannya ke daftar putih (whitelist) supaya detektornya tidak muncul.
- **Tombol akhir `Open Link` tidak menampilkan tujuannya** sebelum diklik. Periksa alamat tujuan di address bar setelah diklik, sebelum mengunduh apa pun.

## Keamanan & privasi

- Script ini **hanya aktif di halaman yang cocok pola SafelinkEarn**. Di situs lain dia langsung berhenti dan tidak menyentuh apa pun.
- **Tidak mengumpulkan, menyimpan, atau mengirim data apa pun** ke mana pun. Tidak ada pelacakan, tidak ada akun, tidak ada server.
- Kodenya terbuka di repo ini — silakan dibaca sebelum dipasang. Kalau ragu, pasang dengan Cara 2 (salin-tempel) setelah membaca isinya.
- Script ini hanya mengklik tombol yang sudah ada di halaman dan mempercepat timer di browser kamu sendiri. Gunakan dengan bijak dan periksa selalu file yang kamu unduh dari link tujuan.

## Troubleshooting

| Gejala | Coba ini |
|---|---|
| Script tidak jalan sama sekali | Pastikan Tampermonkey **Enabled** dan script `SafelinkEarn Auto v3.0.0` **Enabled**. Refresh halaman (`F5`). Buka link `sfe.ad` dari awal, jangan buka `/v/start` langsung. |
| Firefox lambat / crash | Pastikan hanya **satu** script safelink yang aktif (hapus v1 / v2 / Timer Speeder lama). Pakai v3.0.0 ini — v1.0 yang berat sudah diperbaiki. Restart Firefox sekali. |
| Macet di satu step | Lihat panel kiri bawah: statusnya menunjukkan step dan tombolnya. Klik tombol **Lanjut** di panel. Kalau tetap macet, catat teks tombol dan URL-nya, lalu laporkan sebagai issue. |
| Timer tetap lambat (11 detik tetap 11 detik) | Nyalakan `Jam dipercepat` di panel. Kalau tetap lambat, timernya dicek server — biarkan saja, auto-klik tetap jalan. |
| Tab iklan tetap terbuka | Itu tab iklan dari klik pertama (Shopee / Stake). Tutup saja tab itu, tab safelink tetap berjalan. Script sudah memblokir popup, tapi sebagian popup lolos lewat klik — itu normal. |
| Muncul modal anti-adblock | Script mencoba menutupnya (maks. 1x per 2 detik). Kalau tetap muncul, whitelist domain tujuannya di pemblokir iklanmu. |

## File di repo ini

| File | Isi |
|---|---|
| `safelink-auto-combined.user.js` | **Script utama v3.0.0** — gabungan skip + percepat timer, otomatis |
| `README.md` | Dokumen ini |
| `LICENSE` | Lisensi MIT |

## Riwayat versi

- **v1.0.0** — Skipper pola umum (parameter `?url=` / base64, klik `Continue` / `Get Link`).
- **v2.0–v2.3** — Skipper khusus SafelinkEarn (`sfe.ad` → `invest.datapendidikan.com` / `crm.urlwebsite.com`, Start + Step 1–3, `Open Link`). v2.2 menangani `Step 1 of 3` dan `Click here to continue`. v2.3 menangani tombol akhir `Open Link` dan Step 3 tanpa Verify.
- **Timer Speeder v1.0–v1.1** — Hanya percepat timer, tanpa auto-klik. v1.1 memperbaiki Firefox lambat / crash.
- **v2.4** — Skipper dengan perbaikan performa yang sama (polling 1 detik, tanpa observer berat).
- **v3.0.0** — **Gabungan keduanya dalam 1 script, otomatis penuh** (file di repo ini).

## Lisensi

MIT — bebas dipakai, diubah, dan dibagikan, dengan menyertakan lisensi ini. Lihat [`LICENSE`](LICENSE).

## Berkontribusi

Ketemu domain baru, teks tombol baru, atau timer yang beda? Buka **Issue** di repo ini dengan menyertakan:

1. Link `sfe.ad`-nya (atau domain tujuan + path `/v/start` / Step-nya),
2. Di step berapa macetnya dan teks apa yang tertulis di tombolnya,
3. Tangkapan layar panel kiri bawah kalau ada.

Jangan sertakan kata sandi, kode verifikasi, atau data pribadi apa pun.
