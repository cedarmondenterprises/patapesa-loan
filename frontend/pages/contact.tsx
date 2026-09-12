import { FormEvent, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
export default function Contact() {
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    }
  }
  return (
    <Layout title="Contact | PataPesa">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Customer care</p>
        <h1 className="section-heading mt-3">Contact support</h1>
        <p className="mt-3 text-slate-600">
          Submit your question and keep the reference number for follow-up.
        </p>
        {message && (
          <p className={`notice mt-5 ${failed ? 'notice-error' : 'notice-success'}`}>{message}</p>
        )}
        <form
          onSubmit={submit}
          className="surface mt-7 grid gap-4 border-t-4 border-t-pata-900 p-7 shadow-quiet"
        >
          <input name="name" required placeholder="Full name" className="field-control" />
          <input name="email" type="email" required placeholder="Email" className="field-control" />
          <input name="phone" placeholder="Phone (optional)" className="field-control" />
          <input name="subject" required placeholder="Subject" className="field-control" />
          <textarea
            name="message"
            required
            minLength={10}
            rows={6}
            placeholder="Describe your question"
            className="field-control"
          />
          <button className="button button-primary">Send request</button>
        </form>
      </div>
    </Layout>
  );
}
