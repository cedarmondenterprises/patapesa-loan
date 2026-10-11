import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Brand from '../components/Brand';
import { api, ApiError } from '../lib/api';

export default function Login() {
  const router = useRouter(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false),
    [retryAfter, setRetryAfter] = useState(0),
    [phase, setPhase] = useState<'password' | 'otp'>('password'),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [code, setCode] = useState('');
  useEffect(() => {
    if (!retryAfter) return;
    const timer = window.setTimeout(() => setRetryAfter((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfter]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || retryAfter > 0) return;
    setBusy(true);
    setError('');
    try {
      const response = await api<{ code?: string; data?: { retryAfter?: number } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          remember: false,
        }),
      });
      if (response.code === 'LOGIN_OTP_REQUIRED') {
        setEmail(email.trim().toLowerCase());
        setPhase('otp');
        setCode('');
        setRetryAfter(response.data?.retryAfter || 60);
        return;
      }
      await api('/admin/me');
      await router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setRetryAfter(err.retryAfterSeconds);
      if (err instanceof ApiError && err.status === 403)
        await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }
  async function verifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError('');
    try {
      await api('/auth/login/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code, remember: false }),
      });
      await api('/admin/me');
      await router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setRetryAfter(err.retryAfterSeconds);
      setError(err instanceof Error ? err.message : 'Code verification failed');
    } finally {
      setBusy(false);
    }
  }
  async function resendOtp() {
    if (busy || retryAfter > 0) return;
    setBusy(true);
    setError('');
    try {
      const response = await api<{ data?: { retryAfter?: number } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, remember: false }),
      });
      setRetryAfter(response.data?.retryAfter || 60);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setRetryAfter(err.retryAfterSeconds);
      setError(err instanceof Error ? err.message : 'Unable to resend code');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-login">
      <section className="login-identity">
        <Brand />
        <div>
          <p className="overline">Internal operations</p>
          <h1>Decisions backed by a clear record.</h1>
          <p>
            Review customers, identity checks and lending activity from one controlled workspace.
          </p>
        </div>
        <small>Authorised PataPesa personnel only</small>
      </section>
      <section className="login-form-wrap">
        <form className="login-card" onSubmit={phase === 'otp' ? verifyOtp : submit}>
          <p className="overline">Staff access</p>
          <h2>{phase === 'otp' ? 'Check your email' : 'Sign in to operations'}</h2>
          <p className="muted">
            {phase === 'otp'
              ? `Enter the six-digit code sent to ${email}.`
              : 'Use your assigned staff account. Customer accounts cannot access this portal.'}
          </p>
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
          {phase === 'password' ? <>
          <label>
            <span>Email address</span>
            <input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            <span>Password</span>
            <div className="password-field">
              <input
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button type="button" onClick={() => setShow(!show)}>
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          </> : (
            <label>
              <span>Six-digit sign-in code</span>
              <input
                className="admin-otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
                required
              />
            </label>
          )}
          <button
            className="primary wide"
            disabled={
              busy ||
              (phase === 'password' && retryAfter > 0) ||
              (phase === 'otp' && code.length !== 6)
            }
          >
            {phase === 'password' && retryAfter > 0
              ? `Try again in ${retryAfter}s`
              : busy
              ? 'Verifying access…'
              : phase === 'otp'
              ? 'Verify and sign in'
              : 'Sign in securely'}
          </button>
          {phase === 'otp' && (
            <div className="admin-otp-actions">
              <button type="button" onClick={resendOtp} disabled={busy || retryAfter > 0}>
                {retryAfter > 0 ? `Resend in ${retryAfter}s` : 'Resend code'}
              </button>
              <button type="button" onClick={() => { setPhase('password'); setPassword(''); setCode(''); setError(''); setRetryAfter(0); }} disabled={busy}>
                Use another account
              </button>
            </div>
          )}
          <p className="security-note">
            <span>●</span> Privileged changes are written to the audit log.
          </p>
        </form>
      </section>
    </main>
  );
}
