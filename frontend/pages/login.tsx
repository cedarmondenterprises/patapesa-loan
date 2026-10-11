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

const authenticationPages = new Set([
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]);
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
    [retryAfter, setRetryAfter] = useState(0),
    [phase, setPhase] = useState<'password' | 'otp'>('password'),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [remember, setRemember] = useState(true),
    [code, setCode] = useState('');
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
    const normalizedEmail = email.trim().toLowerCase();
    let authenticated = false;
    try {
      const response = await api<{
        code?: string;
        data?: { retryAfter?: number };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          remember,
        }),
      });
      if (response.code === 'LOGIN_OTP_REQUIRED') {
        setEmail(normalizedEmail);
        setPhase('otp');
        setCode('');
        setRetryAfter(response.data?.retryAfter || 60);
        setMessage('Enter the six-digit code sent to your email.');
        return;
      }
      authenticated = true;
      await api('/auth/me');
      await router.replace(destination);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) setRetryAfter(error.retryAfterSeconds);
      if (error instanceof ApiError && error.code === 'EMAIL_VERIFICATION_REQUIRED') {
        window.sessionStorage.setItem('patapesa_verification_email', normalizedEmail);
        window.sessionStorage.setItem('patapesa_verification_next', destination);
        window.sessionStorage.setItem('patapesa_verification_sent', '1');
        await router.push('/verify-email');
        return;
      }
      setMessage(
        authenticated && error instanceof ApiError && error.status === 401
          ? 'Your login succeeded but the session cookie was not accepted. Enable cookies and try again.'
          : loginErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }
  async function verifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || !/^\d{6}$/.test(code)) return;
    setLoading(true);
    setMessage('');
    try {
      await api('/auth/login/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code, remember }),
      });
      await api('/auth/me');
      await router.replace(destination);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) setRetryAfter(error.retryAfterSeconds);
      setMessage(loginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }
  async function resendLoginOtp() {
    if (loading || retryAfter > 0) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await api<{ data?: { retryAfter?: number } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, remember }),
      });
      setRetryAfter(response.data?.retryAfter || 60);
      setMessage('A sign-in code is ready in your email.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) setRetryAfter(error.retryAfterSeconds);
      setMessage(loginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }
  function restartLogin() {
    setPhase('password');
    setPassword('');
    setCode('');
    setMessage('');
    setRetryAfter(0);
  }
  return (
    <AuthShell
      title="Sign in"
      eyebrow="Your PataPesa account"
      heading="Your account. Your next step."
      copy="Review an application, complete identity verification and see every lending decision in one secure place."
    >
      <p className="eyebrow">Customer sign in</p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-.025em] text-pata-950">
        {phase === 'otp' ? 'Check your email' : 'Welcome back'}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {phase === 'otp'
          ? `We sent a secure sign-in code to ${email}.`
          : 'Enter the details used when you registered.'}
      </p>
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
      {phase === 'password' ? (
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
              disabled={checkingSession || loading}
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
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
      ) : (
        <form className="email-otp-form" onSubmit={verifyOtp}>
          <label className="field">
            <span>Six-digit sign-in code</span>
            <input
              className="email-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="000000"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              autoFocus
              required
            />
          </label>
          <button disabled={loading || code.length !== 6} className="button button-primary w-full">
            {loading ? 'Verifying…' : 'Verify and sign in'}
          </button>
          <div className="email-otp-actions">
            <button type="button" onClick={resendLoginOtp} disabled={loading || retryAfter > 0}>
              {retryAfter > 0 ? `Resend in ${retryAfter}s` : 'Resend code'}
            </button>
            <button type="button" onClick={restartLogin} disabled={loading}>
              Use another account
            </button>
          </div>
        </form>
      )}
      <p className="mt-7 border-t border-pata-900/10 pt-6 text-sm text-slate-600">
        New to PataPesa?{' '}
        <Link
          className="font-bold text-pata-700"
          href={destination === '/loans' ? '/register?next=loans' : '/register'}
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
