const { Router } = require('express');
const publicCtrl = require('../controllers/publicController');
const userCtrl = require('../controllers/userController');
const adminCtrl = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { validate, pesananSchema, updatePesananSchema, paketSchema } = require('../validators');

const router = Router();

// ── Public ──
router.get('/pakets', publicCtrl.list);
router.get('/cek-status', publicCtrl.cekStatus);

// ── Auth ──
router.get('/me', authMiddleware, userCtrl.me);

// ── Pelanggan ──
router.get('/user/dashboard', authMiddleware, requireRole('pelanggan'), userCtrl.dashboard);
router.post('/user/pesan', authMiddleware, requireRole('pelanggan'), validate(pesananSchema), userCtrl.createPesanan);
router.get('/user/pesanan/:id', authMiddleware, requireRole('pelanggan'), userCtrl.getPesanan);
router.post('/user/bayar/:id', authMiddleware, requireRole('pelanggan'), upload.single('bukti_bayar'), userCtrl.uploadBuktiBayar);

// ── Admin ──
router.get('/admin/dashboard', authMiddleware, requireRole('admin'), adminCtrl.dashboard);
router.get('/admin/pakets', authMiddleware, requireRole('admin'), adminCtrl.listPakets);
router.post('/admin/pakets', authMiddleware, requireRole('admin'), upload.single('foto'), (req, res, next) => {
  // Parse numeric fields from multipart
  if (req.body.harga) req.body.harga = parseFloat(req.body.harga);
  next();
}, validate(paketSchema), adminCtrl.createPaket);
router.put('/admin/pakets/:id', authMiddleware, requireRole('admin'), upload.single('foto'), (req, res, next) => {
  if (req.body.harga) req.body.harga = parseFloat(req.body.harga);
  next();
}, validate(paketSchema), adminCtrl.updatePaket);
router.delete('/admin/pakets/:id', authMiddleware, requireRole('admin'), adminCtrl.deletePaket);

router.get('/admin/pesanan', authMiddleware, requireRole('admin'), adminCtrl.listPesanan);
router.put('/admin/pesanan/:id', authMiddleware, requireRole('admin'), validate(updatePesananSchema), adminCtrl.updatePesanan);
router.delete('/admin/pesanan/:id', authMiddleware, requireRole('admin'), adminCtrl.deletePesanan);

router.get('/admin/laporan', authMiddleware, requireRole('admin'), adminCtrl.laporan);
router.get('/admin/bukti-bayar/{*path}', authMiddleware, requireRole('admin'), adminCtrl.getBuktiBayar);

module.exports = router;
