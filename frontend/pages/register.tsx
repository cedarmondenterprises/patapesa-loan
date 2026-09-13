import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthShell from '../components/AuthShell';
import { api } from '../lib/api';

type FormState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
  postalCode: string;
  employmentType: string;
  occupation: string;
  employerName: string;
  industry: string;
  yearsOfEmployment: string;
  incomeRange: string;
  sourceOfIncome: string;
  educationLevel: string;
  maritalStatus: string;
  dependants: string;
  password: string;
  confirm: string;
  accuracyConfirmed: boolean;
  privacyAcknowledged: boolean;
  eligibilityAssessmentAcknowledged: boolean;
  electronicCommunicationsConsent: boolean;
  marketingConsent: boolean;
};

const initial: FormState = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  nationality: 'KEN',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  county: '',
  postalCode: '',
  employmentType: '',
  occupation: '',
  employerName: '',
  industry: '',
  yearsOfEmployment: '',
  incomeRange: '',
  sourceOfIncome: '',
  educationLevel: '',
  maritalStatus: '',
  dependants: '0',
  password: '',
  confirm: '',
  accuracyConfirmed: false,
  privacyAcknowledged: false,
  eligibilityAssessmentAcknowledged: false,
  electronicCommunicationsConsent: false,
  marketingConsent: false,
};
const steps = ['About you', 'Home & work', 'Financial profile', 'Review & declare'];
const employmentOptions = [
  ['SALARIED', 'Salaried employee'],
  ['SELF_EMPLOYED', 'Self-employed'],
  ['BUSINESS_OWNER', 'Business owner'],
  ['UNEMPLOYED', 'Not currently employed'],
  ['STUDENT', 'Student'],
  ['RETIRED', 'Retired'],
];
const incomeOptions = [
  ['BELOW_15000', 'Below KES 15,000'],
  ['15000_29999', 'KES 15,000 - 29,999'],
  ['30000_49999', 'KES 30,000 - 49,999'],
  ['50000_99999', 'KES 50,000 - 99,999'],
  ['100000_199999', 'KES 100,000 - 199,999'],
  ['200000_PLUS', 'KES 200,000 or more'],
];
const educationOptions = [
  ['PRIMARY', 'Primary school'],
  ['SECONDARY', 'Secondary school'],
  ['CERTIFICATE', 'Certificate'],
  ['DIPLOMA', 'Diploma'],
  ['BACHELORS', "Bachelor's degree"],
  ['POSTGRADUATE', 'Postgraduate'],
  ['OTHER', 'Other'],
];
const choiceLabel = (options: string[][], selected: string) =>
  options.find(([value]) => value === selected)?.[1] || selected || 'Not provided';

export default function Register() {
  const [form, setForm] = useState(initial);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const maxDob = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().slice(0, 10);
  }, []);
  const checks = [
    form.password.length >= 10,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ];

  function update(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]:
        e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
          ? e.target.checked
          : value,
    }));
  }
  function next(e: React.MouseEvent<HTMLButtonElement>) {
    if (!e.currentTarget.form?.reportValidity()) return;
    setMessage('');
    setStep((value) => Math.min(steps.length - 1, value + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    if (form.password !== form.confirm) return setMessage('Passwords do not match');
    if (!checks.every(Boolean))
      return setMessage('Your password does not meet every security requirement');
    setLoading(true);
    try {
      const result = await api<{ message: string; data: { registrationReference: string } }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            yearsOfEmployment: Number(form.yearsOfEmployment),
            dependants: Number(form.dependants),
            remember: true,
          }),
        },
      );
      setMessage(result.message);
      setReference(result.data.registrationReference);
      setSubmitted(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      wide
      title="Borrower registration"
      eyebrow="Responsible lending starts here"
      heading="One clear application. No hidden questions."
      copy="We ask only for information used to create your account, assess eligibility and meet our record-keeping obligations. Your answers are reviewed by authorised staff."
    >
      {submitted ? (
        <div className="mx-auto max-w-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center bg-[#e7f4eb] text-2xl text-[#19704b]">
            ✓
          </div>
          <p className="eyebrow">Registration received</p>
          <h2 className="mt-3 text-3xl font-bold text-pata-950">
            Your application is ready for review.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">{message}</p>
          <div className="mt-6 border border-slate-200 bg-[#f7f4ec] p-5">
            <span className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">
              Reference
            </span>
            <strong className="mt-2 block font-mono text-lg text-pata-900">{reference}</strong>
            <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">
              Keep this reference. Staff can use it to locate the exact registration record you
              submitted.
            </p>
          </div>
          <Link href="/login" className="button button-primary mt-7 w-full">
            Return to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="registration-heading">
            <div>
              <p className="eyebrow">
                New customer · Step {step + 1} of {steps.length}
              </p>
              <h2>{steps[step]}</h2>
            </div>
            <span>{Math.round(((step + 1) / steps.length) * 100)}% complete</span>
          </div>
          <ol className="registration-progress" aria-label="Registration progress">
            {steps.map((label, index) => (
              <li key={label} className={index <= step ? 'complete' : ''}>
                <span>{index + 1}</span>
                <small>{label}</small>
              </li>
            ))}
          </ol>
          {message && (
            <p role="alert" className="notice notice-error mt-6">
              {message}
            </p>
          )}
          <form onSubmit={submit} className="registration-form">
            {step === 0 && (
              <>
                <SectionIntro
                  title="Identity and contact"
                  copy="Use the legal name that appears on your identity document. Identity-document details are collected later through the protected KYC process."
                />
                <div className="registration-grid">
                  <Field
                    state={form}
                    onChange={update}
                    name="firstName"
                    label="Legal first name"
                    autoComplete="given-name"
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="lastName"
                    label="Legal last name"
                    autoComplete="family-name"
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="dateOfBirth"
                    label="Date of birth"
                    type="date"
                    max={maxDob}
                    hint="You must be at least 18 years old."
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="nationality"
                    label="Nationality code"
                    maxLength={3}
                    hint="For example KEN."
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="email"
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    wide
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="phone"
                    label="Kenyan mobile number"
                    type="tel"
                    pattern="^\+254[17][0-9]{8}$"
                    placeholder="+254712345678"
                    autoComplete="tel"
                    wide
                  />
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <SectionIntro
                  title="Home and work"
                  copy="Your residence helps us confirm service eligibility. Work information supports a fair affordability review; it does not guarantee approval."
                />
                <div className="registration-grid">
                  <Field
                    state={form}
                    onChange={update}
                    name="addressLine1"
                    label="Residential address"
                    autoComplete="address-line1"
                    wide
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="addressLine2"
                    label="Building, estate or landmark (optional)"
                    autoComplete="address-line2"
                    required={false}
                    wide
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="city"
                    label="Town or city"
                    autoComplete="address-level2"
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="county"
                    label="County"
                    autoComplete="address-level1"
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="postalCode"
                    label="Postal code (optional)"
                    required={false}
                    autoComplete="postal-code"
                  />
                  <Select
                    state={form}
                    onChange={update}
                    name="employmentType"
                    label="Employment type"
                    options={employmentOptions}
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="occupation"
                    label="Occupation or current work status"
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="employerName"
                    label="Employer or business name (optional)"
                    required={false}
                  />
                  <Field state={form} onChange={update} name="industry" label="Industry or field" />
                  <Field
                    state={form}
                    onChange={update}
                    name="yearsOfEmployment"
                    label="Years in current work"
                    type="number"
                    min="0"
                    max="80"
                  />
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <SectionIntro
                  title="Financial and household profile"
                  copy="Use your regular gross monthly earnings before deductions. A range is enough at registration; supporting evidence may be requested later."
                />
                <div className="registration-grid">
                  <Select
                    state={form}
                    onChange={update}
                    name="incomeRange"
                    label="Monthly earning range"
                    options={incomeOptions}
                    wide
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="sourceOfIncome"
                    label="Main source of income"
                    placeholder="Salary, retail business, farming…"
                    wide
                  />
                  <Select
                    state={form}
                    onChange={update}
                    name="educationLevel"
                    label="Highest education level"
                    options={educationOptions}
                  />
                  <Select
                    state={form}
                    onChange={update}
                    name="maritalStatus"
                    label="Marital status (optional)"
                    required={false}
                    options={[
                      ['SINGLE', 'Single'],
                      ['MARRIED', 'Married'],
                      ['DIVORCED', 'Divorced'],
                      ['WIDOWED', 'Widowed'],
                      ['SEPARATED', 'Separated'],
                      ['PREFER_NOT_TO_SAY', 'Prefer not to say'],
                    ]}
                  />
                  <Field
                    state={form}
                    onChange={update}
                    name="dependants"
                    label="Number of financial dependants"
                    type="number"
                    min="0"
                    max="30"
                    wide
                  />
                </div>
                <div className="data-note">
                  <strong>Why we ask</strong>
                  <p>
                    These answers help staff understand affordability and avoid unsuitable lending.
                    We do not ask for religion, ethnicity, political views or access to your phone
                    contacts.
                  </p>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <SectionIntro
                  title="Review, security and declarations"
                  copy="Check the summary, create your password and record each declaration separately. Your submitted answers will be stored as a versioned registration record."
                />
                <div className="review-grid">
                  <Review
                    title="Applicant"
                    lines={[
                      `${form.firstName} ${form.lastName}`,
                      form.dateOfBirth,
                      form.email,
                      form.phone,
                    ]}
                    edit={() => setStep(0)}
                  />
                  <Review
                    title="Residence and work"
                    lines={[
                      `${form.addressLine1}, ${form.city}, ${form.county}`,
                      choiceLabel(employmentOptions, form.employmentType),
                      form.occupation,
                      form.employerName,
                    ]}
                    edit={() => setStep(1)}
                  />
                  <Review
                    title="Financial profile"
                    lines={[
                      choiceLabel(incomeOptions, form.incomeRange),
                      form.sourceOfIncome,
                      choiceLabel(educationOptions, form.educationLevel),
                      `${form.dependants} dependant(s)`,
                    ]}
                    edit={() => setStep(2)}
                  />
                </div>
                <div className="registration-grid mt-6">
                  <label className="field sm:col-span-2">
                    <span>Password</span>
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={10}
                      maxLength={128}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={update}
                    />
                    <div
                      className="mt-2 grid grid-cols-5 gap-1"
                      aria-label={`Password strength ${checks.filter(Boolean).length} of 5`}
                    >
                      {checks.map((ok, i) => (
                        <span key={i} className={`h-1 ${ok ? 'bg-pata-700' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <small className="helper">
                      10+ characters with uppercase, lowercase, a number and a symbol.
                    </small>
                  </label>
                  <Field
                    state={form}
                    onChange={update}
                    name="confirm"
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    wide
                  />
                </div>
                <div className="declarations">
                  <Check state={form} onChange={update} name="accuracyConfirmed">
                    I declare that the information I supplied is complete and accurate to the best
                    of my knowledge.
                  </Check>
                  <Check state={form} onChange={update} name="privacyAcknowledged">
                    I have read the <Link href="/privacy">privacy notice</Link> and understand why
                    PataPesa collects and uses this information.
                  </Check>
                  <Check state={form} onChange={update} name="eligibilityAssessmentAcknowledged">
                    I understand that PataPesa may verify information supplied for registration and
                    eligibility. A separate, specific authorisation will be requested before any
                    credit-reference check for a loan application.
                  </Check>
                  <Check state={form} onChange={update} name="electronicCommunicationsConsent">
                    I consent to receive account records, notices and required communications
                    electronically at the email address or mobile number provided.
                  </Check>
                  <Check state={form} onChange={update} name="marketingConsent" required={false}>
                    <strong>Optional:</strong> Send me product news and offers. I can withdraw this
                    choice at any time.
                  </Check>
                </div>
              </>
            )}
            <div className="registration-actions">
              {step > 0 ? (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setStep((value) => value - 1)}
                >
                  Back
                </button>
              ) : (
                <Link className="button button-secondary" href="/login">
                  Sign in instead
                </Link>
              )}
              {step < steps.length - 1 ? (
                <button type="button" className="button button-primary" onClick={next}>
                  Continue
                </button>
              ) : (
                <button disabled={loading} className="button button-primary">
                  {loading ? 'Submitting securely…' : 'Submit registration'}
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}

function SectionIntro({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="section-intro">
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}
function Field({
  state,
  onChange,
  name,
  label,
  hint,
  wide = false,
  required = true,
  ...input
}: {
  state: FormState;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  name: keyof FormState;
  label: string;
  hint?: string;
  wide?: boolean;
  required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'onChange' | 'required'>) {
  return (
    <label className={`field ${wide ? 'sm:col-span-2' : ''}`}>
      <span>{label}</span>
      <input
        {...input}
        name={name}
        value={String(state[name])}
        onChange={onChange}
        required={required}
      />
      {hint && <small className="helper">{hint}</small>}
    </label>
  );
}
function Select({
  state,
  onChange,
  name,
  label,
  options,
  wide = false,
  required = true,
}: {
  state: FormState;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  name: keyof FormState;
  label: string;
  options: string[][];
  wide?: boolean;
  required?: boolean;
}) {
  return (
    <label className={`field ${wide ? 'sm:col-span-2' : ''}`}>
      <span>{label}</span>
      <select name={name} value={String(state[name])} onChange={onChange} required={required}>
        <option value="">Select an option</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function Check({
  state,
  onChange,
  name,
  children,
  required = true,
}: {
  state: FormState;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  name: keyof FormState;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label>
      <input
        type="checkbox"
        name={name}
        checked={Boolean(state[name])}
        onChange={onChange}
        required={required}
      />
      <span>{children}</span>
    </label>
  );
}
function Review({
  title,
  lines,
  edit,
}: {
  title: string;
  lines: (string | undefined)[];
  edit: () => void;
}) {
  return (
    <section>
      <div>
        <strong>{title}</strong>
        <button type="button" onClick={edit}>
          Edit
        </button>
      </div>
      {lines.filter(Boolean).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </section>
  );
}
