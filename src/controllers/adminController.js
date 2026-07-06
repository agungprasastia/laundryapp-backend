const { supabaseAdmin } = require('../config/supabase');

// GET /api/admin/dashboard
exports.dashboard = async (req, res, next) => {
  try {
    const { data: pesanans } = await supabaseAdmin
      .from('pesanans')
      .select('id, status, status_bayar, total_bayar, tanggal, created_at, user_id (full_name), pakets(nama_paket)')
      .order('created_at', { ascending: false });

    const all = pesanans || [];
    const today = new Date().toISOString().split('T')[0];

    const stats = {
      total_pesanan: all.length,
      pesanan_baru: all.filter(p => p.status === 'Baru').length,
      pesanan_proses: all.filter(p => p.status === 'Proses').length,
      pesanan_selesai: all.filter(p => p.status === 'Selesai' || p.status === 'Diambil').length,
      menunggu_verifikasi: all.filter(p => p.status_bayar === 'Menunggu Verifikasi').length,
      total_pendapatan: all
        .filter(p => p.status_bayar === 'Lunas')
        .reduce((sum, p) => sum + parseFloat(p.total_bayar || 0), 0),
      pesanan_hari_ini: all.filter(p => p.tanggal === today).length,
    };

    // Last 7 days chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOrders = all.filter(p => p.tanggal === dateStr);
      chartData.push({
        tanggal: dateStr,
        jumlah: dayOrders.length,
        pendapatan: dayOrders
          .filter(p => p.status_bayar === 'Lunas')
          .reduce((sum, p) => sum + parseFloat(p.total_bayar || 0), 0),
      });
    }

    const recent_orders = all.slice(0, 5); // top 5 recent orders

    res.json({ stats, chartData, recent_orders });
  } catch (err) { next(err); }
};

// CRUD /api/admin/pakets
exports.listPakets = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pakets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
};

exports.createPaket = async (req, res, next) => {
  try {
    let foto_url = null;
    if (req.file) {
      const ext = req.file.originalname.split('.').pop();
      const filePath = `paket_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('paket-photos')
        .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseAdmin.storage
        .from('paket-photos')
        .getPublicUrl(filePath);
      foto_url = urlData.publicUrl;
    }

    const { data, error } = await supabaseAdmin
      .from('pakets')
      .insert({ ...req.body, foto_url })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
};

exports.updatePaket = async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const ext = req.file.originalname.split('.').pop();
      const filePath = `paket_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('paket-photos')
        .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseAdmin.storage
        .from('paket-photos')
        .getPublicUrl(filePath);
      updateData.foto_url = urlData.publicUrl;
    }

    const { data, error } = await supabaseAdmin
      .from('pakets')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Paket tidak ditemukan' });
    res.json(data);
  } catch (err) { next(err); }
};

exports.deletePaket = async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('pakets')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Paket berhasil dihapus' });
  } catch (err) { next(err); }
};

// Pesanan management
exports.listPesanan = async (req, res, next) => {
  try {
    let query = supabaseAdmin
      .from('pesanans')
      .select('*, profiles(full_name, phone), pakets(nama_paket, harga)')
      .order('created_at', { ascending: false });

    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.status_bayar) query = query.eq('status_bayar', req.query.status_bayar);
    if (req.query.dari) query = query.gte('tanggal', req.query.dari);
    if (req.query.sampai) query = query.lte('tanggal', req.query.sampai);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
};

exports.updatePesanan = async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    // Auto-calculate total if berat changed
    if (updateData.berat !== undefined) {
      const { data: pesanan } = await supabaseAdmin
        .from('pesanans')
        .select('paket_id, pakets(harga)')
        .eq('id', req.params.id)
        .single();

      if (pesanan?.pakets?.harga) {
        updateData.total_bayar = parseFloat(updateData.berat) * parseFloat(pesanan.pakets.harga);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('pesanans')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, profiles(full_name, phone), pakets(nama_paket, harga)')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    res.json(data);
  } catch (err) { next(err); }
};

exports.deletePesanan = async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('pesanans')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Pesanan berhasil dihapus' });
  } catch (err) { next(err); }
};

// GET /api/admin/laporan
exports.laporan = async (req, res, next) => {
  try {
    let query = supabaseAdmin
      .from('pesanans')
      .select('id, total_bayar, status, status_bayar, tanggal, pakets(nama_paket)')
      .eq('status_bayar', 'Lunas');

    if (req.query.dari) query = query.gte('tanggal', req.query.dari);
    if (req.query.sampai) query = query.lte('tanggal', req.query.sampai);

    const { data, error } = await query.order('tanggal', { ascending: true });
    if (error) throw error;

    const pesanans = data || [];
    const total_pendapatan = pesanans.reduce((s, p) => s + parseFloat(p.total_bayar || 0), 0);

    // Group by date
    const byDate = {};
    pesanans.forEach(p => {
      if (!byDate[p.tanggal]) byDate[p.tanggal] = { tanggal: p.tanggal, jumlah: 0, pendapatan: 0 };
      byDate[p.tanggal].jumlah++;
      byDate[p.tanggal].pendapatan += parseFloat(p.total_bayar || 0);
    });

    res.json({
      total_pendapatan,
      total_pesanan: pesanans.length,
      detail_harian: Object.values(byDate),
      pesanans,
    });
  } catch (err) { next(err); }
};

// GET /api/admin/bukti-bayar/:path - signed URL for payment proof
exports.getBuktiBayar = async (req, res, next) => {
  try {
    const filePath = req.params[0] || req.params.path; // fallback for Express 5 compatibility
    const { data, error } = await supabaseAdmin.storage
      .from('bukti-bayar')
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) throw error;
    res.json({ url: data.signedUrl });
  } catch (err) { next(err); }
};

// CRM: List Customers
exports.listCustomers = async (req, res, next) => {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, created_at, pesanans(id, total_bayar, status, status_bayar)')
      .eq('role', 'pelanggan')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const customers = profiles.map(p => {
      const orders = p.pesanans || [];
      const completedOrders = orders.filter(o => o.status === 'Selesai' || o.status === 'Diambil');
      const totalSpent = orders
        .filter(o => o.status_bayar === 'Lunas')
        .reduce((sum, o) => sum + parseFloat(o.total_bayar || 0), 0);
      
      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        created_at: p.created_at,
        total_orders: orders.length,
        completed_orders: completedOrders.length,
        total_spent: totalSpent
      };
    });

    res.json(customers);
  } catch (err) { next(err); }
};

const reviewsUtil = require('../utils/reviews');

// GET /api/admin/ulasan
exports.listUlasan = async (req, res, next) => {
  try {
    const reviews = await reviewsUtil.getReviews();
    res.json(reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (err) {
    next(err);
  }
};
