import { buildRegistrationPdf, registrationIdentityRows } from '../src/core/registration-pdf';

describe('registration PDF', () => {
  it('includes the authorised National ID and KYC state in its identity section', () => {
    const rows = registrationIdentityRows({
      reference: 'PPR-TEST',
      formVersion: '2026-09-15',
      submittedAt: '2026-09-15T12:00:00Z',
      status: 'ACTIVE',
      nationalIdNumber: '12345678',
      identityStatus: 'PENDING',
      answers: { firstName: 'Jane', lastName: 'Doe' },
      declarations: {},
    });
    expect(rows).toContainEqual(['National ID number', '12345678']);
    expect(rows).toContainEqual(['Identity review status', 'PENDING']);
  });

  it('creates a branded multi-section PDF from a registration snapshot', async () => {
    const pdf = await buildRegistrationPdf({
      reference: 'PPR-20260913-ABC1234567',
      formVersion: '2026-09-13',
      submittedAt: '2026-09-13T12:00:00Z',
      status: 'PENDING',
      nationalIdNumber: '12345678',
      identityStatus: 'PENDING',
      answers: {
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '1992-04-12',
        nationality: 'KEN',
        email: 'jane@example.com',
        phone: '+254712345678',
        addressLine1: '12 Market Road',
        city: 'Nairobi',
        county: 'Nairobi',
        country: 'Kenya',
        employmentType: 'SALARIED',
        occupation: 'Technician',
        industry: 'Energy',
        yearsOfEmployment: 4,
        incomeRange: '50000_99999',
        sourceOfIncome: 'Employment salary',
        educationLevel: 'DIPLOMA',
        dependants: 1,
      },
      declarations: {
        accuracyConfirmed: true,
        privacyAcknowledged: true,
        eligibilityAssessmentAcknowledged: true,
        electronicCommunicationsConsent: true,
        marketingConsent: false,
        acceptedAt: '2026-09-13T12:00:00Z',
        version: '2026-09-13',
      },
    });
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(5_000);
  });
});
