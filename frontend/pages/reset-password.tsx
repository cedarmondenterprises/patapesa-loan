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
      <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8">
        <h1 className="text-3xl font-black">Choose a new password</h1>
        {message && (
          <p
            role="status"
            className={`mt-5 rounded-lg p-4 ${done ? 'bg-emerald-50' : 'bg-red-50'}`}
          >
            {message}
          </p>
        )}
        {done ? (
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white"
          >
            Continue to sign in
          </Link>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-bold">
              New password
              <input
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                className="mt-2 w-full rounded-lg border p-3"
              />
            </label>
            <label className="block text-sm font-bold">
              Confirm password
              <input
                name="confirm"
                type="password"
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                className="mt-2 w-full rounded-lg border p-3"
              />
            </label>
            <button
              disabled={loading || !router.query.token}
              className="w-full rounded-lg bg-emerald-700 p-3 font-bold text-white disabled:opacity-60"
            >
              {loading ? 'Changing…' : 'Change password'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
