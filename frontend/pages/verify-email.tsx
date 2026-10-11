import { FormEvent, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthShell from '../components/AuthShell';
import { api, ApiError } from '../lib/api';

const safeNext = (value: string | null): string =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';

const maskedEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, Math.min(6, name.length - 2)))}@${domain}`;
};

const noSessionSubscription = () => () => undefined;
const sessionValue = (key: string) => () => window.sessionStorage.getItem(key) || '';

export default function VerifyEmail() {
  const router = useRouter();
  const storedEmail = useSyncExternalStore(
    noSessionSubscription,
    sessionValue('patapesa_verification_email'),
    () => '',
  );
  const storedSent = useSyncExternalStore(
    noSessionSubscription,
    sessionValue('patapesa_verification_sent'),
    () => '',
  );
  const [enteredEmail, setEnteredEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('error');
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const email = storedEmail || enteredEmail;
  const emailSent = resent || storedSent !== '0';

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setMessage('');
    setLoading(true);
    try {
      await api('/auth/email-otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), code, remember: true }),
      });
      const destination = safeNext(window.sessionStorage.getItem('patapesa_verification_next'));
      window.sessionStorage.removeItem('patapesa_verification_email');
      window.sessionStorage.removeItem('patapesa_verification_next');
      window.sessionStorage.removeItem('patapesa_verification_sent');
      await router.replace(
        destination === '/dashboard' ? '/dashboard?welcome=registered' : destination,
      );
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email || resending || cooldown > 0) return;
    setMessage('');
    setResending(true);
    try {
      await api('/auth/email-otp/resend', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setResent(true);
      setCooldown(60);
      setMessageTone('success');
      setMessage('A new code has been sent. Check your inbox and spam folder.');
      window.sessionStorage.setItem('patapesa_verification_sent', '1');
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) setCooldown(error.retryAfterSeconds);
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'We could not send a new code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Verify email"
      eyebrow="One final security step"
      heading="Check your email."
      copy="We use a short-lived code to make sure the email address belongs to you."
    >
      <p className="eyebrow">Email verification</p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-.025em] text-pata-950">
        Enter your six-digit code
      </h2>
      {storedEmail ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {emailSent ? 'We sent a code to' : 'We could not send the first code to'}{' '}
          <strong>{maskedEmail(email)}</strong>. It expires after 10 minutes.
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter the email address you used when creating your account.
        </p>
      )}
      {message && (
        <p role="status" className={`notice mt-6 notice-${messageTone}`}>
          {message}
        </p>
      )}
      <form className="email-otp-form" onSubmit={verify}>
        {!storedEmail && (
          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEnteredEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
        )}
        <label className="field">
          <span>Verification code</span>
          <input
            className="email-otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            aria-describedby="otp-help"
            autoFocus={Boolean(storedEmail)}
            required
          />
          <small id="otp-help" className="helper">
            Never share this code with anyone, including PataPesa staff.
          </small>
        </label>
        <button className="button button-primary w-full" disabled={loading || code.length !== 6}>
          {loading ? 'Verifying…' : 'Verify and continue'}
        </button>
      </form>
      <div className="email-otp-actions">
        <button type="button" onClick={resend} disabled={!email || resending || cooldown > 0}>
          {resending
            ? 'Sending…'
            : cooldown > 0
              ? `Send again in ${cooldown}s`
              : emailSent
                ? 'Send a new code'
                : 'Try sending again'}
        </button>
        <Link href="/register">Use a different email</Link>
      </div>
    </AuthShell>
  );
}
