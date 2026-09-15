import PDFDocument from 'pdfkit';

export type RegistrationPdfRecord = {
  reference: string;
  formVersion: string;
  submittedAt: string | Date;
  status: string;
  nationalIdNumber?: string | null;
  identityStatus?: string | null;
  answers: Record<string, unknown>;
  declarations: Record<string, unknown>;
};

const forest = '#123c32';
const copper = '#c88952';
const ink = '#18211e';
const muted = '#66736e';
const line = '#d9dfdc';
const paper = '#fffdf7';
const stampInk = '#b54735';

const stampMonths = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

export function registrationStampDate(generatedAt: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Africa/Nairobi',
  }).formatToParts(generatedAt);
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const year = parts.find((part) => part.type === 'year')?.value;
  if (!day || !month || !year || !stampMonths[month - 1])
    throw new Error('Invalid PDF generation date');
  return `${day} ${stampMonths[month - 1]} ${year}`;
}

const labels: Record<string, string> = {
  SALARIED: 'Salaried employee',
  SELF_EMPLOYED: 'Self-employed',
  BUSINESS_OWNER: 'Business owner',
  UNEMPLOYED: 'Not currently employed',
  STUDENT: 'Student',
  RETIRED: 'Retired',
  BELOW_15000: 'Below KES 15,000',
  '15000_29999': 'KES 15,000 - 29,999',
  '30000_49999': 'KES 30,000 - 49,999',
  '50000_99999': 'KES 50,000 - 99,999',
  '100000_199999': 'KES 100,000 - 199,999',
  '200000_PLUS': 'KES 200,000 or more',
  PRIMARY: 'Primary school',
  SECONDARY: 'Secondary school',
  CERTIFICATE: 'Certificate',
  DIPLOMA: 'Diploma',
  BACHELORS: "Bachelor's degree",
  POSTGRADUATE: 'Postgraduate',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

const value = (input: unknown): string => {
  if (input === null || input === undefined || input === '') return 'Not provided';
  if (typeof input === 'boolean') return input ? 'Yes' : 'No';
  const text = String(input);
  if (labels[text]) return labels[text];
  if (/^[A-Z][A-Z0-9_]+$/.test(text) && text.length > 3)
    return text
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^./, (x: string) => x.toUpperCase());
  return text;
};

export function registrationIdentityRows(record: RegistrationPdfRecord): [string, unknown][] {
  const a = record.answers;
  return [
    ['Legal name', `${value(a.firstName)} ${value(a.lastName)}`],
    ['Date of birth', a.dateOfBirth],
    ['National ID number', record.nationalIdNumber],
    ['Identity review status', record.identityStatus],
    ['Nationality', a.nationality],
    ['Email address', a.email],
    ['Mobile number', a.phone],
  ];
}

export async function buildRegistrationPdf(
  record: RegistrationPdfRecord,
  generatedAt: Date = new Date(),
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
    bufferPages: true,
    info: {
      Title: `PataPesa borrower registration ${record.reference}`,
      Author: 'PataPesa',
      Subject: 'Borrower registration record',
    },
  });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const complete = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const header = () => {
    doc.save().roundedRect(48, 34, 34, 34, 7).fill(forest);
    doc.fillColor(paper).font('Helvetica-Bold').fontSize(20).text('P', 59, 40);
    doc.fillColor(copper).rect(70, 60, 7, 4).fill().restore();
    doc.fillColor(forest).font('Helvetica-Bold').fontSize(18).text('PataPesa', 92, 39);
    doc
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(8)
      .text('BORROWER OPERATIONS', 92, 60, { characterSpacing: 1.2 });
    doc.strokeColor(line).moveTo(48, 80).lineTo(547, 80).stroke();
    doc.y = 96;
  };
  header();
  const newPage = () => {
    doc.addPage();
    header();
  };

  const ensure = (height: number) => {
    if (doc.y + height > 760) newPage();
  };
  const section = (title: string) => {
    ensure(46);
    doc.moveDown(0.7);
    doc
      .fillColor(copper)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(title.toUpperCase(), { characterSpacing: 1.1 });
    doc.moveDown(0.55);
  };
  const row = (label: string, input: unknown) => {
    ensure(35);
    const y = doc.y;
    doc.fillColor(muted).font('Helvetica').fontSize(8.5).text(label, 48, y, { width: 180 });
    doc
      .fillColor(ink)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(value(input), 236, y, { width: 311 });
    const bottom = Math.max(doc.y, y + 18);
    doc
      .strokeColor('#e8ecea')
      .moveTo(48, bottom + 5)
      .lineTo(547, bottom + 5)
      .stroke();
    doc.y = bottom + 11;
  };
  const a = record.answers;
  const d = record.declarations;
  const stampDate = registrationStampDate(generatedAt);

  doc.fillColor(forest).font('Times-Bold').fontSize(25).text('Borrower registration record');
  doc.moveDown(0.3);
  doc
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(10)
    .text('A locked record of the information supplied by the applicant at account registration.');
  doc.moveDown(1.2);
  doc.fillColor(paper).roundedRect(48, doc.y, 499, 64, 6).fill(forest);
  const summaryY = doc.y + 15;
  doc
    .fillColor('#b7c7c2')
    .font('Helvetica')
    .fontSize(8)
    .text('REGISTRATION REFERENCE', 65, summaryY);
  doc
    .fillColor(paper)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(record.reference, 65, summaryY + 16);
  doc.fillColor('#b7c7c2').font('Helvetica').fontSize(8).text('SUBMITTED', 325, summaryY);
  doc
    .fillColor(paper)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(
      new Date(record.submittedAt).toLocaleString('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Nairobi',
      }),
      325,
      summaryY + 16,
    );
  doc.y = summaryY + 63;

  section('Applicant identity and contact');
  registrationIdentityRows(record).forEach(([label, input]) => row(label, input));

  section('Residential address');
  row('Address line 1', a.addressLine1);
  row('Address line 2', a.addressLine2);
  row('Town or city', a.city);
  row('County', a.county);
  row('Postal code', a.postalCode);
  row('Country', a.country);

  section('Employment and affordability profile');
  row('Employment type', a.employmentType);
  row('Occupation or work status', a.occupation);
  row('Employer or business', a.employerName);
  row('Industry or field', a.industry);
  row('Years in current work', a.yearsOfEmployment);
  row('Monthly earning range', a.incomeRange);
  row('Main source of income', a.sourceOfIncome);
  row('Highest education level', a.educationLevel);
  row('Marital status (optional)', a.maritalStatus);
  row('Financial dependants', a.dependants);

  section('Applicant declarations');
  const declarationRows: [string, unknown][] = [
    ['Information is complete and accurate', d.accuracyConfirmed],
    ['Privacy notice acknowledged', d.privacyAcknowledged],
    ['Eligibility assessment explained and acknowledged', d.eligibilityAssessmentAcknowledged],
    ['Electronic records and communications accepted', d.electronicCommunicationsConsent],
    ['Optional marketing communications accepted', d.marketingConsent],
    ['Declaration version', d.version || record.formVersion],
    ['Accepted at', d.acceptedAt],
  ];
  declarationRows.forEach(([label, input]) => row(label, input));

  ensure(230);
  section('Administrative review');
  row('Account status at export', record.status);
  doc.moveDown(0.5);
  doc
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(8.5)
    .text(
      'Reviewer name: __________________________________    Date: __________________    Signature: __________________',
      { lineGap: 6 },
    );
  doc.moveDown(1.2);

  const stampTop = doc.y;
  const stampCenterX = 467;
  const stampCenterY = stampTop + 51;
  doc
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(8)
    .text(
      `Generated on ${stampDate} (Africa/Nairobi). The stamp confirms when this copy was produced; it does not approve the registration, verify identity, or approve a loan.`,
      48,
      stampTop + 14,
      { width: 315, lineGap: 3 },
    );
  doc
    .save()
    .opacity(0.88)
    .rotate(-4, { origin: [stampCenterX, stampCenterY] })
    .strokeColor(stampInk)
    .lineWidth(2.2)
    .circle(stampCenterX, stampCenterY, 48)
    .stroke()
    .lineWidth(0.8)
    .circle(stampCenterX, stampCenterY, 42)
    .stroke()
    .fillColor(stampInk)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('PATAPESA', stampCenterX - 39, stampCenterY - 29, { width: 78, align: 'center' })
    .fontSize(6.6)
    .text('SYSTEM-GENERATED', stampCenterX - 42, stampCenterY - 10, {
      width: 84,
      align: 'center',
      characterSpacing: 0.35,
    })
    .fontSize(11)
    .text(stampDate, stampCenterX - 43, stampCenterY + 3, { width: 86, align: 'center' })
    .fontSize(6.6)
    .text('REGISTRATION COPY', stampCenterX - 42, stampCenterY + 23, {
      width: 84,
      align: 'center',
      characterSpacing: 0.25,
    })
    .restore();
  doc.x = 48;
  doc.y = stampTop + 112;

  doc
    .fillColor(ink)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('CONFIDENTIAL CUSTOMER RECORD', 48, doc.y, { width: 499 });
  doc
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(8)
    .text(
      'Access is limited to authorised PataPesa staff. This registration record is not a loan approval, credit agreement, or proof of identity verification.',
      48,
      doc.y,
      { width: 499, lineGap: 3 },
    );

  const pages = doc.bufferedPageRange();
  for (let index = 0; index < pages.count; index += 1) {
    doc.switchToPage(index);
    doc
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(7.5)
      .text(`PataPesa | ${record.reference} | Page ${index + 1} of ${pages.count}`, 48, 780, {
        width: 499,
        align: 'center',
      });
  }
  doc.end();
  return complete;
}
