import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
process.env.NODE_ENV = 'test';
const queryMock = jest.fn();
jest.mock('../src/core/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));
import app from '../src/app';
import { createSession, requireAuth } from '../src/core/auth';
import { config } from '../src/core/config';
import { trustedProxies } from '../src/core/proxy';
const user = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  email: 'user@example.com',
  authVersion: 0,
};
const protectedApp = express();
protectedApp.get('/', requireAuth, (_req, res) => res.sendStatus(204));

describe('server tracked sessions', () => {
  const sessions = new Map<string, Date>();
  beforeEach(() => {
    sessions.clear();
    queryMock.mockReset().mockImplementation(async (sql: string, params: unknown[]) => {
      if (sql.startsWith('INSERT INTO auth_sessions')) {
        sessions.set(params[0] as string, params[2] as Date);
        return [];
      }
      if (sql.startsWith('DELETE FROM auth_sessions')) {
        sessions.delete(params[0] as string);
        return [];
      }
      if (sql.includes('JOIN auth_sessions')) {
        const expires = sessions.get(params[2] as string);
        return expires && expires.getTime() > Date.now()
          ? [{ id: user.id, email: user.email, auth_version: 0 }]
          : [];
      }
      return [];
    });
  });
  it('revokes a copied cookie on logout without signing out another session', async () => {
    const first = await createSession(user),
      second = await createSession(user);
    expect(first).not.toBe(second);
    expect(
      (await request(protectedApp).get('/').set('Cookie', `patapesa_session=${first}`)).status,
    ).toBe(204);
    const result = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', `patapesa_session=${first}`);
    expect(result.status).toBe(204);
    expect(result.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
    expect(
      (await request(protectedApp).get('/').set('Cookie', `patapesa_session=${first}`)).status,
    ).toBe(401);
    expect(
      (await request(protectedApp).get('/').set('Cookie', `patapesa_session=${second}`)).status,
    ).toBe(204);
  });
  it('does not erase a valid cookie when the database is unavailable', async () => {
    const token = await createSession(user);
    queryMock.mockRejectedValueOnce(new Error('database unavailable'));
    const result = await request(protectedApp).get('/').set('Cookie', `patapesa_session=${token}`);
    expect(result.status).toBe(503);
    expect(result.headers['set-cookie']).toBeUndefined();
  });
  it('rejects expired database sessions and older standalone tokens', async () => {
    const token = await createSession(user);
    for (const id of sessions.keys()) sessions.set(id, new Date(0));
    expect(
      (await request(protectedApp).get('/').set('Authorization', `Bearer ${token}`)).status,
    ).toBe(401);
    const old = jwt.sign({ email: user.email, ver: 0, type: 'access' }, config.jwtSecret, {
      subject: user.id,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });
    expect(
      (await request(protectedApp).get('/').set('Authorization', `Bearer ${old}`)).status,
    ).toBe(401);
  });
  it('invalidates sessions when the account auth version changes', async () => {
    const token = await createSession(user);
    queryMock.mockResolvedValueOnce([{ id: user.id, email: user.email, auth_version: 1 }]);
    expect(
      (await request(protectedApp).get('/').set('Authorization', `Bearer ${token}`)).status,
    ).toBe(401);
  });
});

describe('proxy-aware rate limiting', () => {
  it('separates visitors behind one Cloudflare edge and returns a retry delay', async () => {
    queryMock.mockResolvedValue([]);
    const attempt = (ip: string) =>
      request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', `${ip}, 173.245.48.1, 172.20.0.2`)
        .send({ email: 'missing@example.com', password: 'wrong' });
    for (let i = 0; i < 10; i++) expect((await attempt('203.0.113.10')).status).toBe(401);
    const limited = await attempt('203.0.113.10');
    expect(limited.status).toBe(429);
    expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
    expect(limited.body.success).toBe(false);
    expect((await attempt('203.0.113.11')).status).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/auth/logout')
          .set('X-Forwarded-For', '203.0.113.10, 173.245.48.1, 172.20.0.2')
      ).status,
    ).toBe(204);
  });
  it('stops at an untrusted peer instead of accepting a spoofed leftmost address', async () => {
    const proxy = express();
    proxy.set('trust proxy', trustedProxies);
    proxy.get('/', (req, res) => res.json({ ip: req.ip }));
    const response = await request(proxy)
      .get('/')
      .set('X-Forwarded-For', '1.1.1.1, 203.0.113.30, 172.20.0.2');
    expect(response.body.ip).toBe('203.0.113.30');
  });
});
