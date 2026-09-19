import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthShell from '../components/AuthShell';
import { api, ApiError } from '../lib/api';

function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return error instanceof Error ? error.message : 'Sign in failed. Please try again.';
  if (error.status === 400) return 'Enter a valid email address and your password.';
  if (error.status === 401) return 'The email address or password is incorrect.';

  return error.message;
}

const authenticationPages = new Set(['/login', '/register', '/forgot-password', '/reset-password']);
function safeDestination(value: string | string[] | undefined): string {
  const requested = typeof value === 'string' ? value : '/dashboard';
  const path = requested.split('?')[0];
  return requested.startsWith('/') && !requested.startsWith('//') && !authenticationPages.has(path)
    ? requested
    : '/dashboard';
}

export default function Login() {
  const router = useRouter(),
    [message, setMessage] = useState(''),
    [loading, setLoading] = useState(false),
    [checkingSession, setCheckingSession] = useState(true),
    [show, setShow] = useState(false),
    [retryAfter, setRetryAfter] = useState(0);
  useEffect(() => {
    if (!retryAfter) return;
    const timer = window.setTimeout(() => setRetryAfter((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfter]);
  const destination = useMemo(() => {
    return safeDestination(router.query.next);
  }, [router.query.next]);
  useEffect(() => {
    if (!router.isReady) return;
    let active = true;
    api('/auth/me')
      .then(() => {
        if (active) return router.replace(destination);
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [destination, router]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (checkingSession || loading || retryAfter > 0) return;
    setLoading(true);
    setMessage('');
    const form = new FormData(e.currentTarget);
    let authenticated = false;
    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: String(form.get('email') || '')
            .trim()
            .toLowerCase(),
          password: form.get('password'),
          remember: form.get('remember') === 'on',
        }),
      });
      authenticated = true;
      await api('/auth/me');
      await router.replace(destination);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) setRetryAfter(error.retryAfterSeconds);
      setMessage(
        authenticated && error instanceof ApiError && error.status === 401
          ? 'Your login succeeded but the session cookie was not accepted. Enable cookies and try again.'
          : loginErrorMessage(error),
      );
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
      {router.query.registered === '1' && !message && (
        <p role="status" className="notice notice-success mt-6">
          Registration completed. Sign in to continue to your account.
        </p>
      )}
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
            disabled={checkingSession || loading}
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
              disabled={checkingSession || loading}
              autoComplete="current-password"
              className="pr-16"
            />
            <button
              type="button"
              aria-pressed={show}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-3 text-xs font-bold text-pata-700"
              onClick={() => setShow(!show)}
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        <div className="flex items-center justify-between">
          <label className="flex gap-2 text-sm text-slate-600">
            <input
              name="remember"
              type="checkbox"
              defaultChecked
              disabled={checkingSession || loading}
            />{' '}
            Keep me signed in
          </label>
          <Link href="/forgot-password" className="text-sm font-bold text-pata-700">
            Forgot password?
          </Link>
        </div>
        <button
          disabled={checkingSession || loading || retryAfter > 0}
          className="button button-primary w-full"
        >
          {retryAfter > 0
            ? `Try again in ${retryAfter}s`
            : checkingSession
            ? 'Checking your session…'
            : loading
            ? 'Signing in…'
            : 'Sign in securely'}
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
