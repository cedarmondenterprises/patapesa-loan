import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildRegistrationPdf } from '../core/registration-pdf';

async function main() {
  const output = path.resolve(__dirname, '../../../output/pdf/PataPesa-registration-sample.pdf');
  await mkdir(path.dirname(output), { recursive: true });
  const pdf = await buildRegistrationPdf({
    reference: 'PPR-20260913-SAMPLE2026',
    formVersion: '2026-09-13',
    submittedAt: '2026-09-13T15:24:00Z',
    status: 'PENDING',
    answers: {
      firstName: 'Amina',
      lastName: 'Wanjiku',
      dateOfBirth: '1994-06-18',
      nationality: 'KEN',
      email: 'amina.wanjiku@example.com',
      phone: '+254712345678',
      addressLine1: '12 Market Road',
      addressLine2: 'Kilimani',
      city: 'Nairobi',
      county: 'Nairobi',
      postalCode: '00100',
      country: 'Kenya',
      employmentType: 'SALARIED',
      occupation: 'Field technician',
      employerName: 'Mwangaza Energy Limited',
      industry: 'Renewable energy',
      yearsOfEmployment: 4,
      incomeRange: '50000_99999',
      sourceOfIncome: 'Employment salary',
      educationLevel: 'DIPLOMA',
      maritalStatus: 'PREFER_NOT_TO_SAY',
      dependants: 1,
    },
    declarations: {
      accuracyConfirmed: true,
      privacyAcknowledged: true,
      eligibilityAssessmentAcknowledged: true,
      electronicCommunicationsConsent: true,
      marketingConsent: false,
      acceptedAt: '2026-09-13T15:24:00Z',
      version: '2026-09-13',
    },
  });
  await writeFile(output, pdf);
  process.stdout.write(`${output}\n`);
}

void main();
