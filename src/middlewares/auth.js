const { supabaseAdmin } = require('../config/supabase');

// Verify Supabase JWT and attach user to req
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const token = header.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa' });
  }

  // Fetch profile for role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return res.status(401).json({ error: 'Profil tidak ditemukan' });
  }

  req.user = { ...user, profile };
  next();
}

// Role check middleware factory
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.profile?.role || !roles.includes(req.user.profile.role)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
