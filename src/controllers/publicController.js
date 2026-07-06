const { supabaseAdmin } = require('../config/supabase');

// GET /api/pakets
exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pakets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return next(error);
    return res.json(data);
  } catch (err) { return next(err); }
};

// GET /api/cek-status?query=
exports.cekStatus = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Masukkan nomor HP atau ID pesanan' });
    }

    const trimmed = query.trim();

    // Try by pesanan ID first
    const id = parseInt(trimmed, 10);
    if (!isNaN(id)) {
      const { data } = await supabaseAdmin
        .from('pesanans')
        .select('id, status, status_bayar, berat, total_bayar, tanggal, tanggal_selesai, catatan, pakets(nama_paket, harga)')
        .eq('id', id)
        .single();

      if (data) return res.json([data]);
    }

    // Try by phone
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('phone', `%${trimmed}%`);

    if (!profiles?.length) {
      return res.json([]);
    }

    const userIds = profiles.map(p => p.id);
    const { data: pesanans } = await supabaseAdmin
      .from('pesanans')
      .select('id, status, status_bayar, berat, total_bayar, tanggal, tanggal_selesai, catatan, pakets(nama_paket, harga)')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.json(pesanans || []);
  } catch (err) { return next(err); }
};
