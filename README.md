# RasaInsight
Capstone Project IBM Skillsbuild University Education - UPNV Yogyakarta | DATA - 30 Oktober

# RasaInsight — CRM & Business Intelligence untuk ADA RASA

RasaInsight adalah aplikasi web untuk membantu pengelolaan operasional dan pemantauan performa bisnis F&B **ADA RASA**. Aplikasi menggabungkan fitur Customer Relationship Management (CRM) dan Business Intelligence (BI) dalam satu antarmuka yang dapat dijalankan langsung melalui browser.

RasaInsight dibuat menggunakan HTML, CSS, dan JavaScript murni (Vanilla JavaScript). Aplikasi tidak membutuhkan Node.js, npm, framework frontend, maupun backend server. Data disimpan secara lokal di browser menggunakan LocalStorage.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Arsitektur Aplikasi](#arsitektur-aplikasi)
- [Struktur Folder](#struktur-folder)
- [Cara Menjalankan](#cara-menjalankan)
- [Pengelolaan Data](#pengelolaan-data)
- [Panduan Setiap Halaman](#panduan-setiap-halaman)
- [Catatan dan Batasan](#catatan-dan-batasan)

---

## Fitur Utama

### 1. Dashboard
Menampilkan ringkasan kondisi bisnis, seperti indikator kinerja utama (KPI), aktivitas terbaru, dan visualisasi data. Dashboard membantu pengguna memperoleh gambaran umum tanpa harus membuka setiap modul.

### 2. Customers
Mengelola informasi pelanggan, termasuk:
- Melihat daftar dan detail pelanggan.
- Mencari dan menyaring data pelanggan.
- Menambahkan, mengubah, dan menghapus data pelanggan.
- Melihat informasi transaksi dan keterkaitan pelanggan dengan program loyalitas.

### 3. Transactions
Mengelola transaksi penjualan, termasuk:
- Melihat, mencari, dan memfilter transaksi.
- Membuat transaksi baru melalui alur pemilihan pelanggan dan produk.
- Mengatur jumlah item serta informasi transaksi.
- Melihat detail transaksi.
- Memperbarui status, mengubah informasi, dan menghapus transaksi.

Perubahan status transaksi juga diperhitungkan dalam pencatatan poin loyalitas agar poin yang diperoleh dari transaksi yang tidak lagi berstatus selesai dapat disesuaikan.

### 4. Products
Mengelola katalog produk F&B, meliputi:
- Menambah, mengubah, dan menghapus produk.
- Mengatur informasi produk, kategori, harga, dan biaya.
- Mengubah status aktif produk.
- Melihat detail serta ringkasan performa produk.

Penghapusan produk yang masih digunakan dalam riwayat transaksi dibatasi untuk menjaga konsistensi data historis.

### 5. Loyalty
Menyediakan pengelolaan program loyalitas pelanggan, seperti:
- Melihat saldo dan riwayat poin.
- Melihat tingkat atau tier membership.
- Mengetahui pelanggan dengan poin tertinggi.
- Memfilter dan mengurutkan riwayat poin.
- Melakukan penukaran poin dengan validasi saldo.

### 6. Feedback
Membantu bisnis memantau tanggapan pelanggan melalui:
- Daftar feedback dan pencarian/filter.
- Ringkasan statistik rating.
- Pengelompokan atau klasifikasi sentimen.
- Penambahan, pengubahan, dan penghapusan feedback.

### 7. Complaints
Membantu pencatatan dan tindak lanjut keluhan pelanggan, termasuk:
- Melihat dan memfilter daftar keluhan.
- Mengelompokkan keluhan berdasarkan prioritas dan status.
- Membuat serta mengubah data keluhan.
- Memperbarui status penanganan hingga penyelesaian.
- Menghapus data keluhan.

### 8. Business Intelligence (BI)
Menyediakan analisis untuk mendukung pengambilan keputusan bisnis, antara lain:
- Analisis pendapatan.
- Analisis performa produk.
- Analisis pelanggan.
- Segmentasi pelanggan menggunakan pendekatan RFM (Recency, Frequency, Monetary).

Hasil analisis dihitung dari data yang tersedia di browser. Transaksi yang tidak berstatus selesai dikecualikan dari perhitungan performa produk yang relevan.

### 9. AI Insights
Menyajikan ringkasan dan rekomendasi bisnis berdasarkan kondisi data yang sedang tersimpan. Insight dihasilkan melalui aturan dan perhitungan pada aplikasi, bukan melalui layanan AI eksternal atau respons AI generatif.

### 10. Settings
Menyediakan pengelolaan data aplikasi:
- Melihat jumlah record pada setiap tabel data.
- Mengunduh backup seluruh data dalam format JSON.
- Mengekspor data per tabel dalam format CSV.
- Membuka kembali proses import data.
- Mereset seluruh data setelah konfirmasi.
- Melihat informasi aplikasi dan penyimpanan.

---

## Teknologi

| Teknologi | Penggunaan |
|---|---|
| HTML5 | Struktur halaman dan komponen aplikasi |
| CSS3 | Tampilan, layout, dan responsive design |
| Vanilla JavaScript | Navigasi, interaksi, validasi, dan logika aplikasi |
| LocalStorage | Penyimpanan data pada browser |
| Chart.js 4.4.0 | Visualisasi grafik pada halaman analitik |
| Google Fonts (Inter) | Tipografi antarmuka |

---

## Arsitektur Aplikasi

Aplikasi menggunakan pemisahan tanggung jawab berbasis layer agar kode lebih mudah dipelihara.

1. **Utilities & UI Helpers**  
   Berisi fungsi umum, pemformatan data, helper antarmuka, modal, dan toast.

2. **Data Layer**  
   Mengelola LocalStorage, repository data, serta proses import. Halaman dan service tidak perlu mengakses LocalStorage secara langsung.

3. **Application Layer — Services**  
   Menangani aturan bisnis dan operasi data untuk dashboard, customer, transaksi, produk, loyalty, feedback, complaint, dan BI.

4. **Core**  
   Mengatur routing, kerangka aplikasi, navigasi, serta layar import.

5. **Presentation Layer — Pages**  
   Berisi tampilan dan interaksi masing-masing halaman.

6. **Application Entry Point**  
   Menginisialisasi aplikasi dan menghubungkan seluruh bagian melalui `js/core/app.js`.

---

## Cara Menjalankan

### Persiapan
- Unduh dan ekstrak folder project.
- Gunakan browser modern seperti Google Chrome, Microsoft Edge, atau Firefox.
- Koneksi internet diperlukan untuk memuat Chart.js dari CDN dan Google Fonts. Fitur lain yang tidak bergantung pada resource eksternal tetap berjalan secara lokal.

### Menjalankan aplikasi
1. Buka folder `rasainsight`.
2. Klik dua kali file `index.html`, atau pilih **Open with** lalu gunakan browser.
3. Tunggu proses inisialisasi selesai.
4. Ikuti layar import apabila aplikasi meminta data awal.
5. Gunakan menu navigasi untuk membuka modul yang tersedia.

---

## Pengelolaan Data

### Penyimpanan
Data disimpan pada LocalStorage browser dengan prefix key `rasainsight_`. Data tidak otomatis dikirim ke server karena aplikasi tidak menggunakan backend.

Tabel data utama meliputi:
- Customers
- Products
- Transactions
- Transaction Details
- Feedbacks
- Complaints
- Loyalty Points
- Users Demo

### Import data
Gunakan layar import untuk memasukkan data CSV sesuai format dan kolom yang dikenali oleh importer aplikasi. Saat import ulang, data digabung berdasarkan primary key yang digunakan oleh proses import.

Pastikan file CSV sesuai dengan struktur data yang diharapkan agar proses import berjalan dengan benar.

### Backup dan restore
- Gunakan **Settings → Ekspor & Backup → Unduh Backup JSON** untuk menyimpan seluruh data.
- Ekspor per tabel tersedia dalam format CSV.
- Simpan file backup di lokasi yang aman.
- Sebelum melakukan reset, buat backup terlebih dahulu.

### Reset
Fitur reset menghapus seluruh data RasaInsight yang tersimpan pada LocalStorage browser tersebut. Tindakan ini tidak dapat dibatalkan melalui aplikasi. Konfirmasi dilakukan dengan mengetik `RESET`.

**Penting:** LocalStorage terikat pada browser dan origin yang digunakan. Menghapus data browser, menggunakan profil browser lain, atau membuka aplikasi pada konteks origin yang berbeda dapat membuat data sebelumnya tidak tersedia. Backup JSON disarankan secara berkala.

---

## Panduan Setiap Halaman

| Halaman | Kegunaan |
|---|---|
| Dashboard | Melihat ringkasan performa dan aktivitas bisnis |
| Customers | Mengelola data pelanggan |
| Transactions | Mencatat dan mengelola transaksi penjualan |
| Products | Mengelola katalog dan performa produk |
| Loyalty | Memantau serta mengelola poin pelanggan |
| Feedback | Memantau penilaian dan masukan pelanggan |
| Complaints | Mencatat dan menindaklanjuti keluhan |
| Business Intelligence | Menganalisis performa bisnis dan segmentasi RFM |
| AI Insights | Membaca ringkasan dan rekomendasi berbasis data |
| Settings | Mengimpor, mengekspor, dan mengelola penyimpanan data |

---

## Catatan dan Batasan

- RasaInsight merupakan aplikasi browser-side; belum menggunakan autentikasi server, database terpusat, atau sinkronisasi antarperangkat.
- Data hanya tersedia pada browser/perangkat tempat data tersebut disimpan, kecuali dipindahkan melalui file backup.
- AI Insights merupakan insight berbasis aturan/perhitungan lokal, bukan integrasi model AI eksternal.
- Chart.js dan Google Fonts dimuat dari layanan CDN, sehingga koneksi internet diperlukan agar resource tersebut dapat dimuat.
- Untuk penggunaan operasional multi-user atau produksi, diperlukan backend, database terpusat, autentikasi, otorisasi, dan mekanisme backup terkelola.

---

## Informasi Aplikasi

- **Nama:** RasaInsight
- **Jenis:** Customer Relationship Management (CRM) & Business Intelligence
- **Versi:** 1.0.0
- **Platform:** Browser
- **Teknologi utama:** HTML5, CSS3, Vanilla JavaScript, LocalStorage, Chart.js

