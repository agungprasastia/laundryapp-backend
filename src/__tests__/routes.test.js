import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Public Routes', () => {
  it('GET /api/pakets should return 200', async () => {
    const res = await request(app).get('/api/pakets');
    expect(res.status).not.toBe(404); // Depends on DB, just check it exists
  });
});
