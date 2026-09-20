import { FormEvent, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
export default function Contact() {
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const form = e.currentTarget,
      f = new FormData(form);
    setFailed(false);
    try {
      const r = await api<{ message: string; data: { reference: string } }>('/contact', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(f)),
      });
      setMessage(`${r.message}. Reference: ${r.data.reference}`);
      form.reset();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Could not send request');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Layout title="Contact | PataPesa">
      <div className="mx-auto max-w-2xl pt-12">
        <p className="eyebrow">Customer care</p>
        <h1 className="section-heading mt-3">Contact support</h1>
        <p className="mt-3 text-slate-600">
          Submit your question and keep the reference number for follow-up.
        </p>
        {message && (
          <p
            role={failed ? 'alert' : 'status'}
            className={`notice mt-5 ${failed ? 'notice-error' : 'notice-success'}`}
          >
            {message}
          </p>
        )}
        <form
          onSubmit={submit}
          className="surface mt-7 grid gap-4 border-t-4 border-t-pata-900 p-7 shadow-quiet"
        >
          <label className="field">
            <span>Full name</span>
            <input name="name" autoComplete="name" required />
          </label>
          <label className="field">
            <span>Email address</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Phone number (optional)</span>
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
          <label className="field">
            <span>Subject</span>
            <input name="subject" required />
          </label>
          <label className="field">
            <span>Your question</span>
            <textarea
              name="message"
              required
              minLength={10}
              rows={6}
              placeholder="Describe your question"
              className="field-control"
            />
          </label>
          <p className="text-sm text-slate-600">
            Do not include passwords or full identity document numbers.
          </p>
          <button disabled={busy} className="button button-primary">
            {busy ? 'Sending…' : 'Send request'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
