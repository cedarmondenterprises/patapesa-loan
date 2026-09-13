import request from 'supertest';

process.env.NODE_ENV = 'test';

const queryMock = jest.fn();
const transactionMock = jest.fn();
jest.mock('../src/core/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
  transaction: (...args: unknown[]) => transactionMock(...args),
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));

import app from '../src/app';
import { createToken } from '../src/core/auth';

describe('API security and authentication surface', () => {
  beforeEach(() => {
    queryMock.mockReset();
    transactionMock.mockReset();
  });

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

  it('creates an active registration and starts an authenticated session', async () => {
    const clientQuery = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: '8f95d132-4665-4c15-8623-652e76f18c70',
            email: 'user@example.com',
            phone: '+254712345678',
            first_name: 'Jane',
            last_name: 'Doe',
            auth_version: 0,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    transactionMock.mockImplementation(async (work) => work({ query: clientQuery }));
    queryMock.mockResolvedValueOnce([]);
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'http://localhost:3000')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'user@example.com',
        phone: '+254712345678',
        dateOfBirth: '1992-04-12',
        nationality: 'KEN',
        addressLine1: '12 Market Road',
        addressLine2: '',
        city: 'Nairobi',
        county: 'Nairobi',
        postalCode: '00100',
        employmentType: 'SALARIED',
        occupation: 'Technician',
        employerName: 'Example Limited',
        industry: 'Energy',
        yearsOfEmployment: 4,
        incomeRange: '50000_99999',
        sourceOfIncome: 'Employment salary',
        educationLevel: 'DIPLOMA',
        maritalStatus: 'SINGLE',
        dependants: 1,
        accuracyConfirmed: true,
        privacyAcknowledged: true,
        eligibilityAssessmentAcknowledged: true,
        electronicCommunicationsConsent: true,
        marketingConsent: false,
        password: 'StrongPass1!',
        remember: true,
      });
    expect(response.status).toBe(201);
    expect(response.body.data.token).toBeUndefined();
    expect(response.headers['set-cookie']?.[0]).toContain('patapesa_session=');
    expect(response.body.message).toContain('account is active');
    expect(response.body.data.registrationReference).toMatch(/^PPR-/);
    expect(clientQuery).toHaveBeenCalledTimes(3);
  });

  it('rejects registration when the date of birth is today', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'http://localhost:3000')
      .send({
        firstName: 'Baby',
        lastName: 'Applicant',
        email: 'baby@example.com',
        phone: '+254711111111',
        dateOfBirth: today,
        nationality: 'KEN',
        addressLine1: '12 Market Road',
        addressLine2: '',
        city: 'Nairobi',
        county: 'Nairobi',
        postalCode: '00100',
        employmentType: 'STUDENT',
        occupation: 'Student',
        employerName: '',
        industry: 'Education',
        yearsOfEmployment: 0,
        incomeRange: 'BELOW_15000',
        sourceOfIncome: 'Family support',
        educationLevel: 'SECONDARY',
        maritalStatus: 'SINGLE',
        dependants: 0,
        accuracyConfirmed: true,
        privacyAcknowledged: true,
        eligibilityAssessmentAcknowledged: true,
        electronicCommunicationsConsent: true,
        marketingConsent: false,
        password: 'StrongPass1!',
        remember: true,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('between 18 and 100');
    expect(transactionMock).not.toHaveBeenCalled();
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

  it('submits an eligible loan application without requiring KYC first', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const token = createToken({ id, email: 'user@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'user@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([
        { age_years: 34, profile_completed_at: '2026-09-13', income_range: '50000_99999' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: '1c4c0f53-e4e1-4e1c-b54f-5403fa1b2bc2',
          min_amount: '10000',
          max_amount: '500000',
          min_term: 3,
          max_term: 24,
          interest_rate: '15',
          processing_fee: '2.5',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'd7663877-533c-4c37-ab4b-d5cf9daf42bb',
          applicationNumber: 'PPL-TEST',
          status: 'SUBMITTED',
        },
      ])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .post('/api/loans/applications')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({
        productId: '1c4c0f53-e4e1-4e1c-b54f-5403fa1b2bc2',
        amount: 30000,
        term: 12,
        purposeCategory: 'BUSINESS',
        purpose: 'Purchase additional stock for my retail shop',
        repaymentSource: 'Monthly retail business income',
        existingMonthlyDebt: 0,
        declarationAccepted: true,
        requestId: '3deae218-2879-4f3e-80b2-90bfd252708f',
      });
    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('SUBMITTED');
    expect(queryMock.mock.calls[5][0]).toContain("'SUBMITTED'");
  });

  it('returns the original loan when a timed-out submission is replayed', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const requestId = '3deae218-2879-4f3e-80b2-90bfd252708f';
    const token = createToken({ id, email: 'user@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'user@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([
        { age_years: 34, profile_completed_at: '2026-09-13', income_range: '50000_99999' },
      ])
      .mockResolvedValueOnce([
        { id: 'd7663877-533c-4c37-ab4b-d5cf9daf42bb', applicationNumber: 'PPL-TEST', status: 'SUBMITTED' },
      ]);
    const response = await request(app)
      .post('/api/loans/applications')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({
        productId: '1c4c0f53-e4e1-4e1c-b54f-5403fa1b2bc2',
        amount: 30000,
        term: 12,
        purposeCategory: 'BUSINESS',
        purpose: 'Purchase additional stock for my retail shop',
        repaymentSource: 'Monthly retail business income',
        existingMonthlyDebt: 0,
        declarationAccepted: true,
        requestId,
      });
    expect(response.status).toBe(200);
    expect(response.body.data.applicationNumber).toBe('PPL-TEST');
    expect(queryMock).toHaveBeenCalledTimes(3);
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
      .mockResolvedValueOnce([{ eligible: 1 }])
      .mockResolvedValueOnce([{ id: customerId, status: 'ACTIVE' }])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .patch(`/api/admin/users/${customerId}/status`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({ status: 'ACTIVE' });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ACTIVE');
    expect(queryMock.mock.calls[5][0]).toContain('INSERT INTO audit_logs');
  });
});
