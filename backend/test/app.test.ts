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
import { normalizeMetricsPath, renderMetrics } from '../src/core/metrics';

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

  it('treats a malformed session cookie as unauthenticated', async () => {
    const response = await request(app).get('/api/auth/me').set('Cookie', 'patapesa_session=%ZZ');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('returns only the requested active advertising placement', async () => {
    queryMock.mockResolvedValueOnce([
      {
        slot: 'HOME_BELOW_PLANNER',
        sponsor: 'Example',
        headline: 'Useful service',
        body: 'A factual description',
        ctaLabel: 'Learn more',
        targetUrl: 'https://example.com',
        imageUrl: null,
      },
    ]);
    const response = await request(app).get('/api/ads?slot=HOME_BELOW_PLANNER');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].slot).toBe('HOME_BELOW_PLANNER');
    expect(response.headers['cache-control']).toContain('max-age=60');
  });

  it('rejects unknown advertising placements', async () => {
    const response = await request(app).get('/api/ads?slot=UNKNOWN');
    expect(response.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
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
      .mockResolvedValueOnce({
        rows: [{ id: 'd7663877-533c-4c37-ab4b-d5cf9daf42bb' }],
      })
      .mockResolvedValueOnce({ rows: [] });
    transactionMock.mockImplementation(async (work) => work({ query: clientQuery }));
    queryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'http://localhost:3000')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'user@example.com',
        phone: '+254712345678',
        dateOfBirth: '1992-04-12',
        nationalIdNumber: '12345678',
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
    expect(clientQuery).toHaveBeenCalledTimes(4);
    expect(clientQuery.mock.calls[2][0]).toContain('INSERT INTO kyc_verifications');
    expect(clientQuery.mock.calls[2][1][3]).toBe('5678');
    const storedAnswers = JSON.parse(String(clientQuery.mock.calls[3][1][3])) as Record<
      string,
      unknown
    >;
    expect(storedAnswers.nationalIdLast4).toBe('5678');
    expect(storedAnswers).not.toHaveProperty('nationalIdNumber');
    expect(clientQuery.mock.calls[3][0]).toContain('national_id_ciphertext');
    expect(clientQuery.mock.calls[3][1][5]).not.toBe('12345678');
    expect(clientQuery.mock.calls[3][1][6]).toBe('5678');
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
        nationalIdNumber: '87654321',
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

  it('returns a customer loan balance and repayment schedule', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const token = createToken({ id, email: 'user@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'user@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ id, email: 'user@example.com', firstName: 'Jane' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'd7663877-533c-4c37-ab4b-d5cf9daf42bb',
          loanNumber: 'PPL-10001',
          outstanding: '27500.00',
          status: 'ACTIVE',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: '1c4c0f53-e4e1-4e1c-b54f-5403fa1b2bc2',
          loanNumber: 'PPL-10001',
          sequence: 1,
          remaining: '2500.00',
          status: 'PENDING',
        },
      ]);
    const response = await request(app)
      .get('/api/account/overview')
      .set('Cookie', `patapesa_session=${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data.loans[0].outstanding).toBe('27500.00');
    expect(response.body.data.installments[0].remaining).toBe('2500.00');
    expect(queryMock.mock.calls[5][0]).toContain("payment_status='COMPLETED'");
    expect(queryMock.mock.calls[6][0]).toContain('repayment_schedules');
    expect(queryMock.mock.calls[2][0]).toContain('rejection_reason AS "rejectionReason"');
    expect(queryMock.mock.calls[2][0]).toContain('reviewed_at AS "reviewedAt"');
  });

  it('allows a customer to correct and resubmit rejected identity details', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const kycId = 'd7663877-533c-4c37-ab4b-d5cf9daf42bb';
    const token = createToken({ id, email: 'user@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'user@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([
        { id: kycId, idType: 'NATIONAL_ID', idNumberLast4: '4321', status: 'PENDING' },
      ])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .post('/api/kyc')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({ idType: 'NATIONAL_ID', idNumber: '87654321' });
    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PENDING');
    expect(queryMock.mock.calls[1][0]).toContain("verification_status='PENDING'");
    expect(queryMock.mock.calls[1][0]).toContain('rejection_reason=NULL');
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
        {
          id: 'd7663877-533c-4c37-ab4b-d5cf9daf42bb',
          applicationNumber: 'PPL-TEST',
          status: 'SUBMITTED',
        },
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

  it('explains the exact blocker instead of failing loan approval generically', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const applicationId = 'd7663877-533c-4c37-ab4b-d5cf9daf42bb';
    const token = createToken({ id, email: 'staff@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'staff@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }])
      .mockResolvedValueOnce([
        {
          userStatus: 'ACTIVE',
          adult: true,
          profileComplete: true,
          declarationAccepted: true,
          affordabilityRatio: '0.35',
          kycStatus: 'PENDING',
        },
      ]);
    const response = await request(app)
      .patch(`/api/admin/applications/${applicationId}`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({ status: 'APPROVED' });
    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Cannot approve: KYC is pending');
    expect(response.body.data.blockers).toEqual(['KYC is pending']);
    expect(queryMock).toHaveBeenCalledTimes(3);
  });

  it('approves a loan after every recorded eligibility check passes', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const applicationId = 'd7663877-533c-4c37-ab4b-d5cf9daf42bb';
    const token = createToken({ id, email: 'staff@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'staff@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }])
      .mockResolvedValueOnce([
        {
          userStatus: 'ACTIVE',
          adult: true,
          profileComplete: true,
          declarationAccepted: true,
          affordabilityRatio: '0.35',
          kycStatus: 'APPROVED',
        },
      ])
      .mockResolvedValueOnce([
        { id: applicationId, applicationNumber: 'PPL-TEST', status: 'APPROVED' },
      ])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .patch(`/api/admin/applications/${applicationId}`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({ status: 'APPROVED' });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('APPROVED');
    expect(queryMock.mock.calls[3][0]).toContain("status IN ('SUBMITTED','UNDER_REVIEW')");
    expect(queryMock.mock.calls[3][0]).toContain('$5::boolean');
    expect(queryMock.mock.calls[3][1]).toEqual(['APPROVED', null, id, applicationId, true]);
  });

  it('rejects a loan with a reason without reusing the status SQL parameter', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const applicationId = 'd7663877-533c-4c37-ab4b-d5cf9daf42bb';
    const token = createToken({ id, email: 'staff@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'staff@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }])
      .mockResolvedValueOnce([
        { id: applicationId, applicationNumber: 'PPL-TEST', status: 'REJECTED' },
      ])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .patch(`/api/admin/applications/${applicationId}`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({ status: 'REJECTED', reason: 'Applicant does not meet the minimum age requirement' });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('REJECTED');
    expect(queryMock.mock.calls[2][0]).toContain('$5::boolean');
    expect(queryMock.mock.calls[2][1]).toEqual([
      'REJECTED',
      'Applicant does not meet the minimum age requirement',
      id,
      applicationId,
      false,
    ]);
  });

  it('lets a product manager update customer-facing lending limits', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const productId = '1c4c0f53-e4e1-4e1c-b54f-5403fa1b2bc2';
    const token = createToken({ id, email: 'manager@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'manager@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }])
      .mockResolvedValueOnce([
        { id: productId, code: 'PERSONAL', name: 'Personal loan', status: 'ACTIVE' },
      ])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .patch(`/api/admin/products/${productId}`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({
        name: 'Personal loan',
        description: 'Flexible credit for planned personal expenses.',
        minAmount: 10000,
        maxAmount: 500000,
        minTerm: 3,
        maxTerm: 24,
        interestRate: 15,
        processingFee: 2.5,
        status: 'ACTIVE',
      });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Loan product updated');
    expect(queryMock.mock.calls[2][0]).toContain('UPDATE loan_products');
  });

  it('records disbursement dates without reusing typed SQL parameters', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const applicationId = 'd7663877-533c-4c37-ab4b-d5cf9daf42bb';
    const loanId = '1c4c0f53-e4e1-4e1c-b54f-5403fa1b2bc2';
    const token = createToken({ id, email: 'manager@example.com', authVersion: 0 });
    const clientQuery = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: applicationId,
            user_id: '48d7377b-b92c-4710-862f-a876850234c9',
            loan_amount: '1000',
            loan_term: 2,
            interest_rate: '12',
            processing_fee: '20',
            total_amount_payable: '1120',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: loanId }] })
      .mockResolvedValue({ rows: [] });
    transactionMock.mockImplementation(async (work) => work({ query: clientQuery }));
    queryMock
      .mockResolvedValueOnce([{ id, email: 'manager@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }])
      .mockResolvedValueOnce([]);

    const response = await request(app)
      .post(`/api/admin/applications/${applicationId}/disburse`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Loan recorded as disbursed');
    expect(clientQuery.mock.calls[1][0]).toContain('$10::integer');
    expect(clientQuery.mock.calls[1][1]).toHaveLength(10);
    expect(clientQuery.mock.calls[2][0]).toContain('$7::integer');
    expect(clientQuery.mock.calls[2][1]).toEqual([loanId, 1, 500, 50, 10, 560, 1]);
    expect(clientQuery.mock.calls[3][1]).toEqual([loanId, 2, 500, 50, 10, 560, 2]);
  });

  it('allows an advertising manager to save a disabled placement', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const token = createToken({ id, email: 'manager@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'manager@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ '?column?': 1 }])
      .mockResolvedValueOnce([
        {
          id: 'd7663877-533c-4c37-ab4b-d5cf9daf42bb',
          slot: 'HOME_BELOW_PLANNER',
          enabled: false,
        },
      ])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .put('/api/admin/ads/HOME_BELOW_PLANNER')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({
        sponsor: 'Example partner',
        headline: 'A useful customer offer',
        body: 'Clear terms for customers who choose to learn more.',
        ctaLabel: 'Learn more',
        targetUrl: 'https://example.com/offer',
        imageUrl: '',
        startsAt: '',
        endsAt: '',
        enabled: false,
      });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Ad saved');
    expect(queryMock.mock.calls[2][0]).toContain('INSERT INTO ad_placements');
  });

  it('rejects unsafe advertising links before writing data', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const token = createToken({ id, email: 'manager@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'manager@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }]);
    const response = await request(app)
      .put('/api/admin/ads/HOME_BELOW_PLANNER')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `patapesa_session=${token}`)
      .send({
        sponsor: 'Example partner',
        headline: 'A useful customer offer',
        body: 'Clear terms for customers who choose to learn more.',
        ctaLabel: 'Learn more',
        targetUrl: 'javascript:alert(1)',
        enabled: true,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('HTTPS');
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it('keeps full identity numbers out of the KYC queue', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const token = createToken({ id, email: 'staff@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'staff@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }])
      .mockResolvedValueOnce([
        {
          id: 'd7663877-533c-4c37-ab4b-d5cf9daf42bb',
          idType: 'NATIONAL_ID',
          idNumberLast4: '1234',
          status: 'PENDING',
        },
      ]);
    const response = await request(app)
      .get('/api/admin/kyc')
      .set('Cookie', `patapesa_session=${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data[0].idNumberLast4).toBe('1234');
    expect(response.body.data[0].idNumber).toBeUndefined();
    expect(queryMock.mock.calls[2][0]).not.toContain('id_number_ciphertext');
  });

  it('audits deliberate access to a full identity number', async () => {
    const id = '8f95d132-4665-4c15-8623-652e76f18c70';
    const kycId = 'd7663877-533c-4c37-ab4b-d5cf9daf42bb';
    const token = createToken({ id, email: 'staff@example.com', authVersion: 0 });
    queryMock
      .mockResolvedValueOnce([{ id, email: 'staff@example.com', auth_version: 0 }])
      .mockResolvedValueOnce([{ allowed: 1 }])
      .mockResolvedValueOnce([{ id: kycId, id_number_ciphertext: null, id_number: '12345678' }])
      .mockResolvedValueOnce([]);
    const response = await request(app)
      .get(`/api/admin/kyc/${kycId}/identity`)
      .set('Cookie', `patapesa_session=${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data.idNumber).toBe('12345678');
    expect(queryMock.mock.calls[3][1][1]).toBe('KYC_IDENTITY_VIEWED');
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
  it('publishes privacy-safe Prometheus metrics without a public API route', async () => {
    expect(
      normalizeMetricsPath('/api/admin/kyc/d7663877-533c-4c37-ab4b-d5cf9daf42bb/identity'),
    ).toBe('/api/admin/kyc/:id/identity');
    const response = await request(app).get('/api/metrics');
    expect(response.status).toBe(404);
    const metrics = renderMetrics();
    expect(metrics).toContain('patapesa_http_requests_total');
    expect(metrics).toContain('route="/api/metrics"');
    expect(metrics).not.toContain('d7663877-533c-4c37-ab4b-d5cf9daf42bb');
  });
});
