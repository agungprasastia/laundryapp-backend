import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('App', () => {
  it('should start and return 404 for unknown route', async () => {
    const res = await request(app).get('/unknown-route-123');
    expect(res.status).toBe(404);
  });
});
