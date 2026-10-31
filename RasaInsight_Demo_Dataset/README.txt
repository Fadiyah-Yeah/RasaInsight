# RasaInsight — Demo Dataset

Seluruh data dalam paket ini adalah **data sintetis/fiktif** untuk prototipe, demo, dan pengujian. Data bukan data pelanggan atau transaksi bisnis sungguhan.

## Isi dataset
- customers.csv: 100 pelanggan
- products.csv: 18 produk makanan dan minuman
- transactions.csv: 400 transaksi (Mei–Oktober 2026)
- transaction_details.csv: detail item setiap transaksi
- feedbacks.csv: 90 feedback dengan label sentimen/topik contoh
- complaints.csv: 25 keluhan dengan status penanganan
- loyalty_points.csv: ledger perolehan poin dari transaksi
- users_demo.csv: contoh role Owner, Admin, Staff (tanpa password)
- schema_postgresql.sql: DDL tabel PostgreSQL/Supabase

## Relasi utama
- transactions.customer_id -> customers.customer_id
- transaction_details.transaction_id -> transactions.transaction_id
- transaction_details.product_id -> products.product_id
- feedbacks.customer_id -> customers.customer_id
- feedbacks.transaction_id -> transactions.transaction_id
- complaints.customer_id -> customers.customer_id
- complaints.transaction_id -> transactions.transaction_id
- loyalty_points.customer_id -> customers.customer_id
- loyalty_points.transaction_id -> transactions.transaction_id

## Catatan penggunaan
1. Import tabel induk lebih dulu: customers, products.
2. Lanjutkan dengan transactions.
3. Import transaction_details, feedbacks, complaints, loyalty_points.
4. users_demo.csv hanya data contoh tampilan role, bukan kredensial login.
5. Label sentiment_label dan topic_label pada feedbacks adalah label dummy untuk demo. Jika menguji AI, jalankan analisis ulang dari feedback_text dan bandingkan hasil AI dengan label contoh.
6. Mata uang menggunakan Rupiah (IDR). Nilai harga dan transaksi berupa angka tanpa simbol mata uang.
7. Dataset ini dibuat untuk satu outlet F&B fiktif. Tanggal transaksi berada pada Mei–Oktober 2026.

## Saran KPI
- Revenue: SUM(total_amount) untuk transaksi Completed.
- Transactions: COUNT(transaction_id) untuk transaksi Completed.
- AOV: Revenue / jumlah transaksi Completed.
- Repeat customers: pelanggan dengan lebih dari satu transaksi Completed.
- RFM: Recency dari tanggal transaksi terakhir; Frequency dari jumlah transaksi; Monetary dari total_amount.
- Feedback average: AVG(rating).
- Complaint resolution rate: jumlah complaint Resolved / seluruh complaint.

## Keterbatasan demo
Data dibuat secara acak-terkontrol untuk kebutuhan prototipe. Distribusi pelanggan, transaksi, feedback, dan keluhan tidak merepresentasikan pola bisnis nyata. Validasi hasil analitik sebelum digunakan untuk keputusan bisnis sungguhan.
