import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Brand from '../components/Brand';
import { api, ApiError } from '../lib/api';

export default function Login() {
  const router = useRouter(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false),
    [retryAfter, setRetryAfter] = useState(0);
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
    const f = new FormData(e.currentTarget);
    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: f.get('email'),
          password: f.get('password'),
          remember: false,
        }),
      });
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
        <form className="login-card" onSubmit={submit}>
          <p className="overline">Staff access</p>
          <h2>Sign in to operations</h2>
          <p className="muted">
            Use your assigned staff account. Customer accounts cannot access this portal.
          </p>
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
          <label>
            <span>Email address</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Password</span>
            <div className="password-field">
              <input
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShow(!show)}>
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <button className="primary wide" disabled={busy || retryAfter > 0}>
            {retryAfter > 0
              ? `Try again in ${retryAfter}s`
              : busy
              ? 'Verifying access…'
              : 'Sign in securely'}
          </button>
          <p className="security-note">
            <span>●</span> Privileged changes are written to the audit log.
          </p>
        </form>
      </section>
    </main>
  );
}
