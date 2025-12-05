# Sistem Manajemen Keuangan

Sistem ini adalah aplikasi backend untuk mengelola pencatatan transaksi keuangan dan menyajikan analisis data keuangan sederhana untuk tugas studi kasus.

## 📂 Project Structure

Berikut adalah struktur folder dari proyek ini:

```text
sistem-keuangan-1
├── .env                        # Environment variables
├── app.js                      # Main application file
├── server.js                   # Server startup file
├── package.json                # npm configuration file
├── config
│   └── db.js                   # Database connection and initialization
├── controllers
│   └── transactionsController.js # Handles transaction-related operations
├── models
│   ├── account.js              # User account model
│   ├── transaction.js          # Transaction model
│   └── transaction_history.js  # Transaction history model
├── routes
│   ├── accounts.js             # Account management routes
│   ├── admin.js                # Admin routes
│   ├── index.js                # Entry point for all routes
│   └── transactions.js         # Transaction routes
└── services
    └── transactionsService.js  # Business logic for transactions
```

## 🚀 Fitur & Dokumentasi API

Sistem ini memiliki dua fitur utama: **Pencatatan Transaksi** dan **Analisis Keuangan**. Berikut adalah penjelasan cara kerja dan bukti pengujian (screenshot) dari setiap fitur.

### 1. Membuat Transaksi Baru (POST)
Fitur ini digunakan untuk mencatat pemasukan atau pengeluaran baru ke dalam database.

* **Endpoint:** `POST /transactions`
* **Keterangan:** Menerima input JSON berisi nama akun, jumlah, tipe, kategori, dan catatan.

#### ✅ Berhasil Membuat Transaksi (201 Created)
Ketika data dikirim dengan benar, server akan mengembalikan data transaksi yang baru dibuat beserta *timestamp*.

![Create Transaction Success](Screenshot%20from%202025-12-05%2018-55-48.png)

---

### 2. Analisis Keuangan (GET)
Fitur ini mengolah data transaksi untuk memberikan ringkasan finansial secara *real-time*.

* **Endpoint:** `GET /transactions/analytics`

#### ✅ Berhasil Mengambil Analisis (200 OK)
Server menghitung total pemasukan, pengeluaran, saldo bersih (net), serta memberikan metrik seperti rata-rata transaksi dan rasio pengeluaran.

![Analytics Success](Screenshot%20from%202025-12-05%2019-18-58.png)

#### ❌ Data Kosong / Belum Ada Transaksi (404 Not Found)
Jika belum ada transaksi yang tercatat di database, sistem akan memberitahu bahwa data tidak ditemukan, bukan error server.

![Analytics Not Found](Screenshot%20from%202025-12-05%2019-12-34.png)

---

## 🛡️ Validasi & Error Handling

Untuk menjaga integritas data, sistem menerapkan validasi ketat pada *body request*. Format respon standar untuk setiap kondisi validasi adalah:

* **status:** `fail` (menandakan validasi tidak lolos)
* **message:** Penjelasan spesifik mengenai apa yang salah (sesuai konteks).
* **data:** `null` (karena tidak ada data yang berhasil diolah).

Berikut adalah implementasi validasi yang telah diuji:

### Kasus 1: Input Wajib Tidak Diisi
Contoh: User tidak mengisi `accountName` (string kosong). Sistem akan menolak dan meminta field tersebut diisi.

![Validation Empty AccountName](Screenshot%20from%202025-12-05%2019-19-42.png)

### Kasus 2: Tipe Data Salah
Contoh: User mengisi `amount` dengan format yang salah (bukan angka/kosong) saat seharusnya `integer` atau `float`.

![Validation Invalid Amount](Screenshot%20from%202025-12-05%2019-19-30.png)
