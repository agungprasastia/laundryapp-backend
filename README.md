# LaundryApp Backend

REST API untuk sistem manajemen Laundry, dibangun dengan Express.js dan terintegrasi dengan Supabase.

## Prerequisites
- Node.js (v18+)
- Project Supabase aktif (Database & Storage)

## Setup Lokal
1. Clone repo
2. `npm install`
3. Copy `.env.example` ke `.env` dan isi token Supabase.
4. `npm run dev` (berjalan di localhost:3000)

## Testing
Gunakan vitest + supertest:
```bash
npm run test
npm run test:watch
```
