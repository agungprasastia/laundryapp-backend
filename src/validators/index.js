const { z } = require('zod');

const pesananSchema = z.object({
  paket_id: z.number({ required_error: 'Paket harus dipilih' }).int().positive(),
  catatan: z.string().max(500).optional().default(''),
});

const updatePesananSchema = z.object({
  berat: z.number().min(0).optional(),
  status: z.enum(['Baru', 'Proses', 'Selesai', 'Diambil']).optional(),
  status_bayar: z.enum(['Belum Lunas', 'Menunggu Verifikasi', 'Lunas']).optional(),
  tanggal_selesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

const paketSchema = z.object({
  nama_paket: z.string({ required_error: 'Nama paket wajib diisi' }).min(1).max(100),
  harga: z.number({ required_error: 'Harga wajib diisi' }).positive('Harga harus lebih dari 0'),
  estimasi: z.string().max(50).optional().default(''),
  deskripsi: z.string().max(500).optional().default(''),
});

function validate(schema) {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}

module.exports = { pesananSchema, updatePesananSchema, paketSchema, validate };
