# LaundryApp Backend

REST API untuk sistem manajemen Laundry, dibangun dengan Express.js dan terintegrasi dengan Supabase.

## Prerequisites

- Node.js (v18+)
- Project Supabase aktif (Database & Storage)

## Setup & Instalasi

1. Clone repositori ini.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy template environment:
   ```bash
   cp .env.example .env
   ```
4. Buka file `.env` dan isi dengan konfigurasi Supabase Anda:
   ```
   PORT=3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   *(Dapatkan key ini dari Supabase Dashboard > Settings > API)*

## Database Setup

1. Buka Supabase Dashboard.
2. Masuk ke menu **SQL Editor**.
3. Copy isi file `supabase/schema.sql`.
4. Paste dan **Run** di SQL Editor untuk membuat tabel dan RLS.

## Menjalankan Server

Development mode (dengan hot-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`.

## API Endpoints Utama

- `POST /api/auth/register` - Daftar user baru
- `POST /api/auth/login` - Login user
- `GET /api/pakets` - List paket laundry
- `POST /api/pesanans` - Buat pesanan baru
- `POST /api/pesanans/:id/bayar` - Upload bukti bayar
