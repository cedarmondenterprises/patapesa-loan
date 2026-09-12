import { FormEvent, useState } from 'react';
import Link from 'next/link';
import AuthShell from '../components/AuthShell';
import { api } from '../lib/api';

export default function Register() {
  const [message, setMessage] = useState(''),
    [submitted, setSubmitted] = useState(false),
    [loading, setLoading] = useState(false),
    [password, setPassword] = useState('');
  const checks = [
      password.length >= 10,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ],
    strength = checks.filter(Boolean).length;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    const f = new FormData(e.currentTarget);
    if (f.get('password') !== f.get('confirm')) {
      setMessage('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const result = await api<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: f.get('firstName'),
          lastName: f.get('lastName'),
          email: f.get('email'),
          phone: f.get('phone'),
          password: f.get('password'),
          remember: true,
        }),
      });
      setMessage(result.message);
      setSubmitted(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthShell
      title="Create account"
      eyebrow="Secure application access"
      heading="Start with your details. We will explain every next step."
      copy="New accounts are reviewed before activation. This protects customer records and keeps lending decisions accountable."
    >
      {submitted ? (
        <div>
          <div className="mb-6 flex h-12 w-12 items-center justify-center bg-[#e7f4eb] text-2xl text-[#19704b]">
            ✓
          </div>
          <p className="eyebrow">Registration received</p>
          <h2 className="mt-3 text-3xl font-bold text-pata-950">
            Your account is awaiting review.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">{message}</p>
          <div className="mt-7 border-l-2 border-copper bg-[#f3eee4] p-5 text-sm leading-6 text-slate-600">
            You will be able to sign in after an authorised staff member activates the account. Do
            not create another registration while this review is pending.
          </div>
          <Link href="/login" className="button button-primary mt-7 w-full">
            Return to sign in
          </Link>
        </div>
      ) : (
        <>
          <p className="eyebrow">New customer</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-.025em] text-pata-950">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Use your legal name and Kenyan mobile number.
          </p>
          {message && (
            <p role="alert" className="notice notice-error mt-6">
              {message}
            </p>
          )}
          <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
            <Field name="firstName" label="First name" autoComplete="given-name" />
            <Field name="lastName" label="Last name" autoComplete="family-name" />
            <Field name="email" label="Email address" type="email" autoComplete="email" wide />
            <Field
              name="phone"
              label="Mobile number"
              type="tel"
              hint="Use +254, for example +254712345678"
              autoComplete="tel"
              wide
            />
            <label className="field sm:col-span-2">
              <span>Password</span>
              <input
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                className="mt-2 grid grid-cols-5 gap-1"
                aria-label={`Password strength ${strength} of 5`}
              >
                {checks.map((ok, i) => (
                  <span key={i} className={`h-1 ${ok ? 'bg-pata-700' : 'bg-slate-200'}`} />
                ))}
              </div>
              <small className="helper">
                10+ characters with upper and lowercase letters, a number and a symbol.
              </small>
            </label>
            <Field
              name="confirm"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              wide
            />
            <label className="flex gap-3 text-sm leading-5 text-slate-600 sm:col-span-2">
              <input type="checkbox" required className="mt-1" />
              <span>
                I accept the{' '}
                <Link className="font-bold text-pata-700" href="/terms">
                  terms
                </Link>{' '}
                and{' '}
                <Link className="font-bold text-pata-700" href="/privacy">
                  privacy notice
                </Link>
                .
              </span>
            </label>
            <button disabled={loading} className="button button-primary mt-2 sm:col-span-2">
              {loading ? 'Submitting registration…' : 'Submit registration'}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-600">
            Already registered?{' '}
            <Link className="font-bold text-pata-700" href="/login">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
function Field({
  name,
  label,
  type = 'text',
  hint,
  autoComplete,
  wide = false,
}: {
  name: string;
  label: string;
  type?: string;
  hint?: string;
  autoComplete?: string;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? 'sm:col-span-2' : ''}`}>
      <span>{label}</span>
      <input name={name} type={type} required autoComplete={autoComplete} />
      {hint && <small className="helper">{hint}</small>}
    </label>
  );
}
