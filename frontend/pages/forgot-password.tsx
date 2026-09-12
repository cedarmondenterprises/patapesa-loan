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
      <div className="surface mx-auto max-w-lg border-t-4 border-t-pata-900 p-8 shadow-quiet">
        <p className="eyebrow">Secure access</p>
        <h1 className="mt-3 text-3xl font-bold text-pata-950">Account recovery</h1>
        <p className="mt-4 text-slate-600">
          Enter the email registered to your account. Reset links expire after 30 minutes.
        </p>
        {message && (
          <p role="status" className="notice notice-success mt-5">
            {message}
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="field">
            <span>Email address</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <button disabled={loading} className="button button-primary w-full disabled:opacity-60">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
