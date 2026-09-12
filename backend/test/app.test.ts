import request from 'supertest';

process.env.NODE_ENV = 'test';

const queryMock = jest.fn();
jest.mock('../src/core/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
  transaction: jest.fn(),
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));

import app from '../src/app';
import { createToken } from '../src/core/auth';

describe('API security and authentication surface', () => {
  beforeEach(() => queryMock.mockReset());

  it('reports liveness without exposing server details', async () => {
    const response = await request(app).get('/api/health/live');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'healthy' });
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('rejects protected endpoints without a session', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('rejects state changes from an untrusted browser origin', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Origin', 'https://attacker.example');
    expect(response.status).toBe(403);
  });

  it('creates a pending registration without authenticating it', async () => {
    queryMock
      .mockResolvedValueOnce([
        {
          id: '8f95d132-4665-4c15-8623-652e76f18c70',
          email: 'user@example.com',
          phone: '+254712345678',
          first_name: 'Jane',
          last_name: 'Doe',
          auth_version: 0,
        },
      ])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'http://localhost:3000')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'user@example.com',
        phone: '+254712345678',
        password: 'StrongPass1!',
        remember: true,
      });
    expect(response.status).toBe(201);
    expect(response.body.data.token).toBeUndefined();
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body.message).toContain('administrator must approve');
  });

  it('denies the staff queue when the authenticated user lacks permission', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const token = createToken({ id, email: 'user@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'user@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .get('/api/admin/applications')
      .set('Cookie', `patapesa_session=${token}`);
    expect(response.status).toBe(403);
  });

  it('allows a permitted staff member to read the review queue', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const token = createToken({ id, email: 'staff@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'staff@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .get('/api/admin/applications')
      .set('Cookie', `patapesa_session=${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('returns the authenticated staff role and permissions', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const token = createToken({ id, email: 'manager@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'manager@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([
        { name: 'MANAGER', permissions: ['dashboard:view', 'users:manage'] },
      ]);
    const response = await request(app)
      .get('/api/admin/me')
      .set('Cookie', `patapesa_session=${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data.roles).toEqual(['MANAGER']);
    expect(response.body.data.permissions).toContain('users:manage');
  });

  it('lets permitted staff approve a pending registration and audits the change', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const customerId = 'a9c8ef3a-b7ac-48e1-b740-b0f52514db02';
    const token = createToken({ id, email: 'staff@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'staff@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: customerId, status: 'ACTIVE' }])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .patch(`/api/admin/users/${customerId}/status`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({ status: 'ACTIVE' });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ACTIVE');
    expect(queryMock.mock.calls[4][0]).toContain('INSERT INTO audit_logs');
  });
});
