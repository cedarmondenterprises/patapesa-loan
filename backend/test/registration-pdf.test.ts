import { buildRegistrationPdf } from '../src/core/registration-pdf';

describe('registration PDF', () => {
  it('creates a branded multi-section PDF from a registration snapshot', async () => {
    const pdf = await buildRegistrationPdf({
      reference: 'PPR-20260913-ABC1234567',
      formVersion: '2026-09-13',
      submittedAt: '2026-09-13T12:00:00Z',
      status: 'PENDING',
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
