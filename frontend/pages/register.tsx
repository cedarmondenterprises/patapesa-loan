import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function Register() {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
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
    <Layout title="Create account | PataPesa">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-8">
        <h1 className="text-3xl font-black">Create your account</h1>
        <p className="mt-2 text-slate-500">Use your legal name and Kenyan mobile number.</p>
        {message && (
          <p
            role="status"
            className={`mt-5 rounded-lg p-3 ${submitted ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}
          >
            {message}
          </p>
        )}
        {!submitted && (
          <form onSubmit={submit} className="mt-7 grid gap-5 md:grid-cols-2">
            <Field name="firstName" label="First name" autoComplete="given-name" />
            <Field name="lastName" label="Last name" autoComplete="family-name" />
            <Field name="email" label="Email" type="email" autoComplete="email" />
            <Field
              name="phone"
              label="Mobile number"
              type="tel"
              hint="Format: +254712345678"
              autoComplete="tel"
            />
            <Field
              name="password"
              label="Password"
              type="password"
              hint="10+ characters with capital, lowercase, number and symbol"
              autoComplete="new-password"
            />
            <Field
              name="confirm"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
            />
            <label className="md:col-span-2 flex gap-2 text-sm">
              <input type="checkbox" required />{' '}
              <span>
                I accept the{' '}
                <Link className="font-bold text-emerald-700" href="/terms">
                  terms
                </Link>{' '}
                and{' '}
                <Link className="font-bold text-emerald-700" href="/privacy">
                  privacy notice
                </Link>
                .
              </span>
            </label>
            <button
              disabled={loading}
              className="md:col-span-2 rounded-lg bg-emerald-700 p-3 font-bold text-white disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
function Field({
  name,
  label,
  type = 'text',
  hint,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={type === 'password' ? 10 : undefined}
        maxLength={type === 'password' ? 128 : undefined}
        className="mt-2 w-full rounded-lg border p-3"
      />
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}
