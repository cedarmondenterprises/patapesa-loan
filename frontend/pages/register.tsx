import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthShell from '../components/AuthShell';
import { api, ApiError } from '../lib/api';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalIdNumber: string;
  password: string;
  confirm: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
};
const initial: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  nationalIdNumber: '',
  password: '',
  confirm: '',
  termsAccepted: false,
  marketingConsent: false,
};
const normalizePhone = (value: string) => {
  const compact = value.replace(/[\s()-]/g, '');
  if (/^0[17]\d{8}$/.test(compact)) return `+254${compact.slice(1)}`;
  if (/^[17]\d{8}$/.test(compact)) return `+254${compact}`;
  if (/^254[17]\d{8}$/.test(compact)) return `+${compact}`;
  return compact;
};
const localIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function Register() {
  const router = useRouter();
  const destination = router.query.next === 'loans' ? '/loans' : '/dashboard';
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const dobLimits = useMemo(() => {
    const today = new Date();
    return {
      max: localIsoDate(new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())),
      min: localIsoDate(new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())),
    };
  }, []);
  const passwordChecks = [
    form.password.length >= 10,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ];
  function update(event: ChangeEvent<HTMLInputElement>) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setMessage('');
    setRecovery(false);
    if (form.password !== form.confirm) return setMessage('Passwords do not match.');
    if (!passwordChecks.every(Boolean))
      return setMessage('Use 10+ characters with uppercase, lowercase, a number and a symbol.');
    setLoading(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          phone: normalizePhone(form.phone),
          nationality: 'KEN',
          remember: true,
        }),
      });
      await router.replace(
        destination === '/loans'
          ? '/loans'
          : { pathname: '/dashboard', query: { welcome: 'registered' } },
      );
    } catch (error) {
      if (error instanceof ApiError && [0, 409].includes(error.status)) setRecovery(true);
      setMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthShell
      title="Create account"
      eyebrow="New to PataPesa?"
      heading="Create your account in a few minutes."
      copy="Only the essentials are needed now. Employment and income details are requested later, only when you apply for a loan."
    >
      <div className="registration-simple-heading">
        <p className="eyebrow">Secure registration</p>
        <h2>Tell us the basics</h2>
        <p>No long questionnaire. You can review loan costs before sharing financial details.</p>
      </div>
      {message && (
        <p role="alert" className="notice notice-error mt-5">
          {message}
        </p>
      )}
      {recovery && (
        <Link
          href={{ pathname: '/login', query: { registered: '1', next: destination } }}
          className="registration-recovery"
        >
          Already registered? Sign in instead →
        </Link>
      )}
      <form onSubmit={submit} className="registration-simple-form">
        <div className="registration-grid">
          <Field
            form={form}
            name="firstName"
            label="First name"
            autoComplete="given-name"
            onChange={update}
          />
          <Field
            form={form}
            name="lastName"
            label="Last name"
            autoComplete="family-name"
            onChange={update}
          />
          <Field
            form={form}
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            onChange={update}
            wide
          />
          <Field
            form={form}
            name="phone"
            label="Mobile number"
            type="tel"
            inputMode="tel"
            pattern="^(?:\+?254|0)?[17][0-9]{8}$"
            placeholder="0712345678"
            autoComplete="tel"
            onChange={update}
            wide
          />
          <Field
            form={form}
            name="dateOfBirth"
            label="Date of birth"
            type="date"
            min={dobLimits.min}
            max={dobLimits.max}
            onChange={update}
            hint="You must be at least 18 years old."
          />
          <Field
            form={form}
            name="nationalIdNumber"
            label="National ID number"
            inputMode="numeric"
            pattern="[0-9]{6,10}"
            minLength={6}
            maxLength={10}
            autoComplete="off"
            onChange={update}
            hint="Encrypted before storage."
          />
          <label className="field sm:col-span-2">
            <span>Create password</span>
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
              className="registration-password-meter"
              aria-label={`Password strength ${passwordChecks.filter(Boolean).length} of 5`}
            >
              {passwordChecks.map((valid, index) => (
                <span key={index} className={valid ? 'complete' : ''} />
              ))}
            </div>
            <small className="helper">
              10+ characters with uppercase, lowercase, a number and a symbol.
            </small>
          </label>
          <Field
            form={form}
            name="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            onChange={update}
            wide
          />
        </div>
        <div className="registration-simple-checks">
          <label>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={form.termsAccepted}
              onChange={update}
              required
            />
            <span>
              I confirm my details are accurate and agree to the <Link href="/terms">terms</Link>,{' '}
              <Link href="/privacy">privacy notice</Link> and electronic account communications.
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              name="marketingConsent"
              checked={form.marketingConsent}
              onChange={update}
            />
            <span>
              <strong>Optional:</strong> Send me useful product updates.
            </span>
          </label>
        </div>
        <button className="button button-primary registration-submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create my account'} <span aria-hidden="true">→</span>
        </button>
        <p className="registration-signin">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function Field({
  form,
  name,
  label,
  hint,
  wide = false,
  onChange,
  ...input
}: {
  form: FormState;
  name: keyof FormState;
  label: string;
  hint?: string;
  wide?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'form' | 'name' | 'value' | 'onChange'>) {
  return (
    <label className={`field ${wide ? 'sm:col-span-2' : ''}`}>
      <span>{label}</span>
      <input {...input} name={name} value={String(form[name])} onChange={onChange} required />
      {hint && <small className="helper">{hint}</small>}
    </label>
  );
}
