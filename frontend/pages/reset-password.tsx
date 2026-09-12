import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function ResetPassword() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get('password') !== form.get('confirm')) {
      setMessage('Passwords do not match');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const result = await api<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: router.query.token, password: form.get('password') }),
      });
      setMessage(result.message);
      setDone(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Layout title="Reset password | PataPesa">
      <div className="surface mx-auto max-w-lg border-t-4 border-t-pata-900 p-8 shadow-quiet">
        <p className="eyebrow">Secure access</p>
        <h1 className="mt-3 text-3xl font-bold text-pata-950">Choose a new password</h1>
        {message && (
          <p role="status" className={`notice mt-5 ${done ? 'notice-success' : 'notice-error'}`}>
            {message}
          </p>
        )}
        {done ? (
          <Link href="/login" className="button button-primary mt-6">
            Continue to sign in
          </Link>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="field">
              <span>New password</span>
              <input
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                name="confirm"
                type="password"
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <button
              disabled={loading || !router.query.token}
              className="button button-primary w-full disabled:opacity-60"
            >
              {loading ? 'Changing…' : 'Change password'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
