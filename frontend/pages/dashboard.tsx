/* eslint-disable react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { api, logout } from '../lib/api';

type User = { firstName: string; lastName: string; email: string; phone: string };
type Application = {
  id: string;
  applicationNumber: string;
  product: string;
  amount: string;
  term: number;
  status: string;
  createdAt: string;
};
type Kyc = { idType: string; idNumberLast4: string; status: string } | null;
type Payment = {
  id: string;
  amount: string;
  method: string;
  reference: string;
  status: string;
  paymentDate: string;
};
const money = (n: unknown) => `KES ${Number(n || 0).toLocaleString('en-KE')}`;

export default function Dashboard() {
  const router = useRouter(),
    [user, setUser] = useState<User | null>(null),
    [apps, setApps] = useState<Application[]>([]),
    [kyc, setKyc] = useState<Kyc>(null),
    [payments, setPayments] = useState<Payment[]>([]),
    [message, setMessage] = useState(''),
    [loading, setLoading] = useState(true);
  const load = () =>
    Promise.all([
      api<{ data: User }>('/auth/me'),
      api<{ data: Application[] }>('/loans/applications'),
      api<{ data: Kyc }>('/kyc'),
      api<{ data: Payment[] }>('/payments'),
    ])
      .then(([u, a, k, p]) => {
        setUser(u.data);
        setApps(a.data);
        setKyc(k.data);
        setPayments(p.data);
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  useEffect(() => {
    void load();
  }, []);
  async function submitKyc(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const r = await api<{ message: string }>('/kyc', {
        method: 'POST',
        body: JSON.stringify({ idType: f.get('idType'), idNumber: f.get('idNumber') }),
      });
      setMessage(r.message);
      void load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Submission failed');
    }
  }
  async function signOut() {
    try {
      await logout();
    } finally {
      await router.push('/');
    }
  }
  const latest = apps[0],
    paid = payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
  if (loading)
    return (
      <Layout title="Dashboard | PataPesa">
        <div className="space-y-4">
          <div className="skeleton h-24" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((x) => (
              <div key={x} className="skeleton h-32" />
            ))}
          </div>
          <div className="skeleton h-72" />
        </div>
      </Layout>
    );
  return (
    <Layout title="My account | PataPesa">
      <header className="flex flex-col justify-between gap-6 border-b border-pata-900/15 pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Customer account</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-.035em] text-pata-950">
            Good to see you, {user?.firstName}.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {user?.email} · {user?.phone}
          </p>
        </div>
        <button
          onClick={() => void signOut()}
          className="button button-secondary button-small self-start"
        >
          Sign out
        </button>
      </header>
      {message && (
        <p
          className={`notice mt-6 ${message.toLowerCase().includes('failed') ? 'notice-error' : 'notice-success'}`}
        >
          {message}
        </p>
      )}
      <section className="mt-8 grid border-y border-pata-900/15 md:grid-cols-3">
        <Summary
          label="Applications"
          value={String(apps.length)}
          note={
            latest
              ? `Latest: ${latest.status.replace(/_/g, ' ').toLowerCase()}`
              : 'No application submitted'
          }
        />
        <Summary
          label="Identity verification"
          value={kyc?.status.replace(/_/g, ' ').toLowerCase() || 'Not submitted'}
          note={
            kyc
              ? `${kyc.idType.replace(/_/g, ' ')} ending ${kyc.idNumberLast4}`
              : 'Required before loan approval'
          }
          border
        />
        <Summary
          label="Completed payments"
          value={money(paid)}
          note={`${payments.length} payment record${payments.length === 1 ? '' : 's'}`}
          border
        />
      </section>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.45fr_.75fr]">
        <section className="surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Your activity</p>
              <h2 className="mt-2 text-2xl font-bold text-pata-950">Loan applications</h2>
            </div>
            <Link href="/loans" className="button button-primary button-small">
              New application
            </Link>
          </div>
          {apps.length ? (
            <div className="mt-7 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-pata-900/15 text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Submitted</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr className="border-b border-pata-900/10 last:border-0" key={a.id}>
                      <td className="py-5 font-mono text-xs">{a.applicationNumber}</td>
                      <td className="font-semibold">{a.product}</td>
                      <td>{money(a.amount)}</td>
                      <td>{new Date(a.createdAt).toLocaleDateString('en-KE')}</td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No applications yet"
              copy="Compare the available products and calculate the full repayment before submitting."
              action={
                <Link href="/loans" className="text-sm font-bold text-pata-700">
                  Compare loan products →
                </Link>
              }
            />
          )}{' '}
        </section>
        <aside className="space-y-6">
          <section className="surface p-6">
            <p className="eyebrow">Next step</p>
            <h2 className="mt-2 text-xl font-bold text-pata-950">
              {!kyc
                ? 'Verify your identity'
                : kyc.status === 'PENDING'
                  ? 'Identity review in progress'
                  : 'Identity status'}
            </h2>
            {kyc ? (
              <div className="mt-5">
                <StatusBadge status={kyc.status} />
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {kyc.idType.replace(/_/g, ' ')} ending {kyc.idNumberLast4}.{' '}
                  {kyc.status === 'PENDING' ? 'We will update this status after staff review.' : ''}
                </p>
              </div>
            ) : (
              <form onSubmit={submitKyc} className="mt-5 space-y-4">
                <label className="field">
                  <span>ID type</span>
                  <select name="idType" required>
                    <option value="">Choose ID type</option>
                    <option value="NATIONAL_ID">National ID</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVING_LICENSE">Driving licence</option>
                  </select>
                </label>
                <label className="field">
                  <span>Document number</span>
                  <input
                    name="idNumber"
                    required
                    minLength={5}
                    maxLength={50}
                    pattern="[A-Za-z0-9-]+"
                    autoComplete="off"
                  />
                  <small className="helper">Stored in encrypted form.</small>
                </label>
                <button className="button button-primary w-full">Submit for review</button>
              </form>
            )}
          </section>
          <section className="border-l-2 border-copper bg-[#eee9df] p-6">
            <h3 className="font-bold text-pata-950">Need assistance?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use your application reference when contacting the support team.
            </p>
            <Link href="/contact" className="mt-4 inline-block text-sm font-bold text-pata-700">
              Contact support →
            </Link>
          </section>
        </aside>
      </div>
    </Layout>
  );
}
function Summary({
  label,
  value,
  note,
  border = false,
}: {
  label: string;
  value: string;
  note: string;
  border?: boolean;
}) {
  return (
    <div
      className={`py-7 md:px-8 ${border ? 'border-t border-pata-900/15 md:border-l md:border-t-0' : ''}`}
    >
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <strong className="mt-2 block text-2xl capitalize text-pata-950">{value}</strong>
      <small className="mt-2 block text-slate-500">{note}</small>
    </div>
  );
}
function Empty({ title, copy, action }: { title: string; copy: string; action: React.ReactNode }) {
  return (
    <div className="mt-7 border border-dashed border-slate-300 px-6 py-10 text-center">
      <div className="mx-auto mb-4 h-9 w-9 border border-pata-900/20 bg-pata-50" />
      <h3 className="font-bold text-pata-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{copy}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}
