const { Router } = require('express');
const publicCtrl = require('../controllers/publicController');
const userCtrl = require('../controllers/userController');
const adminCtrl = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { validate, pesananSchema, updatePesananSchema, paketSchema, updateProfileSchema } = require('../validators');

const router = Router();

// ── Public ──
router.get('/pakets', publicCtrl.list);
router.get('/cek-status', publicCtrl.cekStatus);

// ── Auth ──
router.get('/me', authMiddleware, userCtrl.me);
router.put('/user/profile', authMiddleware, validate(updateProfileSchema), userCtrl.updateProfile);

// ── Pelanggan ──
router.get('/user/dashboard', authMiddleware, requireRole('pelanggan'), userCtrl.dashboard);
router.post('/user/pesan', authMiddleware, requireRole('pelanggan'), validate(pesananSchema), userCtrl.createPesanan);
router.get('/user/pesanan/:id', authMiddleware, requireRole('pelanggan'), userCtrl.getPesanan);
router.post('/user/pesanan/:id/rating', authMiddleware, requireRole('pelanggan'), userCtrl.addRating);
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
router.get('/admin/customers', authMiddleware, requireRole('admin'), adminCtrl.listCustomers);
router.get('/admin/ulasan', authMiddleware, requireRole('admin'), adminCtrl.listUlasan);
router.get(/^\/admin\/bukti-bayar\/(.*)$/, authMiddleware, requireRole('admin'), adminCtrl.getBuktiBayar);

module.exports = router;
