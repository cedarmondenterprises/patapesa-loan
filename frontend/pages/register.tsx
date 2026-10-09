import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthShell from '../components/AuthShell';
import { api, ApiError } from '../lib/api';

type FormState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationalIdNumber: string;
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
  nationalIdNumber: '',
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
const draftKey = 'patapesa-registration-draft-v1';
const normalizePhone = (value: string) => {
  const compact = value.replace(/[\s()-]/g, '');
  if (/^0[17]\d{8}$/.test(compact)) return `+254${compact.slice(1)}`;
  if (/^[17]\d{8}$/.test(compact)) return `+254${compact}`;
  if (/^254[17]\d{8}$/.test(compact)) return `+${compact}`;
  return compact;
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
const localIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

export default function Register() {
  const router = useRouter();
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const destination = router.query.next === 'loans' ? '/loans' : '/dashboard';
  const [form, setForm] = useState(initial);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showLoginRecovery, setShowLoginRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  useEffect(() => {
    if (draftReady) stepHeading.current?.focus();
  }, [step, draftReady]);
  const dobLimits = useMemo(() => {
    const today = new Date();
    return {
      max: localIsoDate(new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())),
      min: localIsoDate(new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())),
    };
  }, []);
  const checks = [
    form.password.length >= 10,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(draftKey) || 'null') as {
          form?: Partial<FormState>;
          step?: number;
        } | null;
        if (saved?.form) setForm((current) => ({ ...current, ...saved.form }));
        if (Number.isInteger(saved?.step)) setStep(Math.min(3, Math.max(0, saved?.step || 0)));
      } catch {
        try {
          sessionStorage.removeItem(draftKey);
        } catch {
          /* Optional draft storage. */
        }
      } finally {
        setDraftReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!draftReady || submitted) return;
    const timeout = window.setTimeout(() => {
      const safeForm: Partial<FormState> = { ...form };
      delete safeForm.nationalIdNumber;
      delete safeForm.password;
      delete safeForm.confirm;
      delete safeForm.accuracyConfirmed;
      delete safeForm.privacyAcknowledged;
      delete safeForm.eligibilityAssessmentAcknowledged;
      delete safeForm.electronicCommunicationsConsent;
      delete safeForm.marketingConsent;
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ form: safeForm, step }));
      } catch {
        /* Optional draft storage. */
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [draftReady, form, step, submitted]);

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
    if (loading) return;
    setMessage('');
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    setShowLoginRecovery(false);
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
            phone: normalizePhone(form.phone),
            yearsOfEmployment: Number(form.yearsOfEmployment),
            dependants: Number(form.dependants),
            remember: true,
          }),
        },
      );
      setMessage(result.message);
      setReference(result.data.registrationReference);
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        /* Optional draft storage. */
      }
      try {
        await api('/auth/me');
        const navigated = await router.replace(
          destination === '/loans'
            ? '/loans'
            : { pathname: '/dashboard', query: { welcome: 'registered' } },
        );
        if (!navigated) throw new Error('Navigation was interrupted');
      } catch {
        setSubmitted(true);
        setShowLoginRecovery(true);
        setMessage(
          `${result.message} Your account was created, but the new session could not be confirmed. Sign in to continue.`,
        );
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setMessage(
          `${error.message} If you previously submitted this form, sign in instead of submitting it again.`,
        );
        setShowLoginRecovery(true);
      } else if (error instanceof ApiError && error.status === 0) {
        setMessage(
          'We could not confirm whether your registration was received. Do not submit it repeatedly; first try signing in with the details you entered.',
        );
        setShowLoginRecovery(true);
      } else {
        setMessage(error instanceof Error ? error.message : 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      wide
      title="Borrower registration"
      eyebrow="Create your account"
      heading="Let’s start with your details."
      copy="Complete your profile in four steps. You can review and change your answers before submitting. Creating an account does not guarantee a loan."
    >
      {submitted ? (
        <div className="mx-auto max-w-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center bg-[#e7f4eb] text-2xl text-[#19704b]">
            ✓
          </div>
          <p className="eyebrow">Registration complete</p>
          <h2 className="mt-3 text-3xl font-bold text-pata-950">Your account is active.</h2>
          <p className="mt-4 leading-7 text-slate-600">{message}</p>
          <div className="mt-6 border border-slate-200 bg-[#f7f4ec] p-5">
            <span className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">
              Reference
            </span>
            <strong className="mt-2 block font-mono text-lg text-pata-900">{reference}</strong>
            <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">
              Keep this reference. Staff can use it to locate your original registration record.
            </p>
          </div>
          {showLoginRecovery ? (
            <Link
              href={{ pathname: '/login', query: { registered: '1', next: destination } }}
              className="button button-primary mt-7 w-full"
            >
              Sign in to continue
            </Link>
          ) : (
            <Link href={destination} className="button button-primary mt-7 w-full">
              {destination === '/loans' ? 'Continue my application' : 'Continue to my account'}
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="registration-heading">
            <div>
              <p className="eyebrow">
                New customer · Step {step + 1} of {steps.length}
              </p>
              <h2 ref={stepHeading} tabIndex={-1}>
                {steps[step]}
              </h2>
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
          <p className="mt-4 text-center text-xs text-slate-500">
            Your unfinished answers survive a refresh in this browser tab. National ID, passwords
            and declarations are never saved in browser storage.
          </p>
          {message && (
            <p role="alert" className="notice notice-error mt-6">
              {message}
            </p>
          )}
          {showLoginRecovery && (
            <Link
              href={{ pathname: '/login', query: { registered: '1', next: destination } }}
              className="mt-3 inline-flex font-bold text-pata-700 underline underline-offset-4"
            >
              Go to secure sign in
            </Link>
          )}
          <form onSubmit={submit} className="registration-form">
            <div key={step} className="registration-step">
              {step === 0 && (
                <>
                  <SectionIntro
                    title="Identity and contact"
                    copy="Use the legal name and National ID number shown on your identity document. The number is encrypted and sent directly into the protected KYC review queue."
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
                      min={dobLimits.min}
                      max={dobLimits.max}
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
                      name="nationalIdNumber"
                      label="National ID number"
                      inputMode="numeric"
                      pattern="[0-9]{6,10}"
                      minLength={6}
                      maxLength={10}
                      autoComplete="off"
                      hint="6–10 digits. Encrypted before storage and never saved in your browser draft."
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
                      pattern="^(?:\+?254|0)?[17][0-9]{8}$"
                      placeholder="0712345678"
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
                    <Field
                      state={form}
                      onChange={update}
                      name="industry"
                      label="Industry or field"
                    />
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
                      These answers help staff understand affordability and avoid unsuitable
                      lending. We do not ask for religion, ethnicity, political views or access to
                      your phone contacts.
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
                        `National ID ending ${form.nationalIdNumber.slice(-4)}`,
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
                      I understand that PataPesa may verify information supplied for registration
                      and eligibility. A separate, specific authorisation will be requested before
                      any credit-reference check for a loan application.
                    </Check>
                    <Check state={form} onChange={update} name="electronicCommunicationsConsent">
                      I consent to receive account records, notices and required communications
                      electronically at the email address or mobile number provided.
                    </Check>
                    <Check state={form} onChange={update} name="marketingConsent" required={false}>
                      <strong>Optional:</strong> Send me product news and offers. I can withdraw
                      this choice at any time.
                    </Check>
                  </div>
                </>
              )}
            </div>
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
