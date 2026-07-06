import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../middlewares/auth';

describe('Auth Middleware', () => {
  it('requireRole("admin") -> panggil next() jika role admin', () => {
    const req = { user: { profile: { role: 'admin' } } }; // Fix: add profile nest
    const res = {};
    const next = vi.fn();
    
    const middleware = requireRole('admin');
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('requireRole("admin") -> return 403 jika role bukan admin', () => {
    const req = { user: { profile: { role: 'pelanggan' } } }; // Fix: add profile nest
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();
    
    const middleware = requireRole('admin');
    middleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Akses ditolak' });
    expect(next).not.toHaveBeenCalled();
  });
});
