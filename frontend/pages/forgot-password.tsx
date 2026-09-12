import { FormEvent, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function Forgot() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const form = new FormData(e.currentTarget);
    try {
      const result = await api<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email') }),
      });
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Layout title="Account recovery | PataPesa">
      <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8">
        <h1 className="text-3xl font-black">Account recovery</h1>
        <p className="mt-4 text-slate-600">
          Enter the email registered to your account. Reset links expire after 30 minutes.
        </p>
        {message && (
          <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-4">
            {message}
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-lg border p-3"
            />
          </label>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-emerald-700 p-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
