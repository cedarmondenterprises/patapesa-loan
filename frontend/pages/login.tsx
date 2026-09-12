import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthShell from '../components/AuthShell';
import { api } from '../lib/api';

export default function Login() {
  const router = useRouter(),
    [message, setMessage] = useState(''),
    [loading, setLoading] = useState(false),
    [show, setShow] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const form = new FormData(e.currentTarget);
    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          remember: form.get('remember') === 'on',
        }),
      });
      await router.push('/dashboard');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthShell
      title="Sign in"
      eyebrow="Your PataPesa account"
      heading="Pick up exactly where you left off."
      copy="Review an application, complete identity verification and see every lending decision in one secure place."
    >
      <p className="eyebrow">Customer sign in</p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-.025em] text-pata-950">Welcome back</h2>
      <p className="mt-2 text-sm text-slate-500">Enter the details used when you registered.</p>
      {message && (
        <p role="alert" className="notice notice-error mt-6">
          {message}
        </p>
      )}
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <label className="field">
          <span>Email address</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@example.com"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <div className="relative">
            <input
              name="password"
              type={show ? 'text' : 'password'}
              required
              autoComplete="current-password"
              className="pr-16"
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-xs font-bold text-pata-700"
              onClick={() => setShow(!show)}
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        <div className="flex items-center justify-between">
          <label className="flex gap-2 text-sm text-slate-600">
            <input name="remember" type="checkbox" defaultChecked /> Keep me signed in
          </label>
          <Link href="/forgot-password" className="text-sm font-bold text-pata-700">
            Forgot password?
          </Link>
        </div>
        <button disabled={loading} className="button button-primary w-full">
          {loading ? 'Signing in…' : 'Sign in securely'}
        </button>
      </form>
      <p className="mt-7 border-t border-pata-900/10 pt-6 text-sm text-slate-600">
        New to PataPesa?{' '}
        <Link className="font-bold text-pata-700" href="/register">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
