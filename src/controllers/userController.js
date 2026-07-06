const { supabaseAdmin } = require('../config/supabase');

// GET /api/me
exports.me = async (req, res) => {
  res.json(req.user.profile);
};

// PUT /api/user/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone } = req.body;
    
    // Update profile in the database
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, phone })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
};

// GET /api/user/dashboard
exports.dashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: pesanans } = await supabaseAdmin
      .from('pesanans')
      .select('id, status, status_bayar, berat, total_bayar, tanggal, tanggal_selesai, catatan, created_at, pakets(nama_paket, harga)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const stats = {
      total: pesanans?.length || 0,
      baru: pesanans?.filter(p => p.status === 'Baru').length || 0,
      proses: pesanans?.filter(p => p.status === 'Proses').length || 0,
      selesai: pesanans?.filter(p => p.status === 'Selesai').length || 0,
      diambil: pesanans?.filter(p => p.status === 'Diambil').length || 0,
    };

    res.json({ stats, pesanans: pesanans || [] });
  } catch (err) { next(err); }
};

// POST /api/user/pesan
exports.createPesanan = async (req, res, next) => {
  try {
    const { paket_id, catatan } = req.body;

    // Verify paket exists
    const { data: paket } = await supabaseAdmin
      .from('pakets')
      .select('id')
      .eq('id', paket_id)
      .single();

    if (!paket) {
      return res.status(404).json({ error: 'Paket tidak ditemukan' });
    }

    const { data, error } = await supabaseAdmin
      .from('pesanans')
      .insert({
        user_id: req.user.id,
        paket_id,
        catatan: catatan || '',
        tanggal: new Date().toISOString().split('T')[0],
      })
      .select('*, pakets(nama_paket, harga)')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
};

// GET /api/user/pesanan/:id
exports.getPesanan = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pesanans')
      .select('*, pakets(nama_paket, harga, estimasi)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    res.json(data);
  } catch (err) { next(err); }
};

// POST /api/user/bayar/:id
exports.uploadBuktiBayar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File bukti bayar wajib diupload' });
    }

    // Verify pesanan belongs to user
    const { data: pesanan } = await supabaseAdmin
      .from('pesanans')
      .select('id, status_bayar')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!pesanan) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    if (pesanan.status_bayar === 'Lunas') {
      return res.status(400).json({ error: 'Pesanan sudah lunas' });
    }

    // Upload to Supabase Storage
    const ext = req.file.originalname.split('.').pop();
    const filePath = `${req.user.id}/${req.params.id}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('bukti-bayar')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Update pesanan
    const { data, error } = await supabaseAdmin
      .from('pesanans')
      .update({
        bukti_bayar_url: filePath,
        status_bayar: 'Menunggu Verifikasi',
      })
      .eq('id', req.params.id)
      .select('*, pakets(nama_paket, harga)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
};
