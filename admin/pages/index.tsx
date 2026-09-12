import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../lib/api';
export default function Login() {
  const router = useRouter(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">P</div>
        <h1>PataPesa Administration</h1>
        <p>Restricted to authorised staff. Privileged changes are audited.</p>
        {error && <div className="error">{error}</div>}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button disabled={busy}>{busy ? 'Checking access…' : 'Secure sign in'}</button>
      </form>
    </main>
  );
}
