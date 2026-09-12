/* eslint-disable react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
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

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [kyc, setKyc] = useState<Kyc>(null);
  const [message, setMessage] = useState('');
  const load = () =>
    Promise.all([
      api<{ data: User }>('/auth/me'),
      api<{ data: Application[] }>('/loans/applications'),
      api<{ data: Kyc }>('/kyc'),
    ])
      .then(([u, a, k]) => {
        setUser(u.data);
        setApps(a.data);
        setKyc(k.data);
      })
      .catch(() => router.replace('/login'));
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
  return (
    <Layout title="Dashboard | PataPesa">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">CUSTOMER DASHBOARD</p>
          <h1 className="mt-1 text-4xl font-black">Hello, {user?.firstName || 'customer'}</h1>
          <p className="mt-2 text-slate-500">
            {user?.email} · {user?.phone}
          </p>
        </div>
        <button
          onClick={() => void signOut()}
          className="rounded-lg border px-4 py-2 text-sm font-bold"
        >
          Sign out
        </button>
      </div>
      {message && <p className="mt-6 rounded-lg bg-emerald-50 p-4">{message}</p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold">Applications</h2>
            <Link href="/loans" className="font-bold text-emerald-700">
              New application
            </Link>
          </div>
          {apps.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3">Reference</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr className="border-b" key={a.id}>
                      <td className="py-4 font-mono">{a.applicationNumber}</td>
                      <td>{a.product}</td>
                      <td>KES {Number(a.amount).toLocaleString()}</td>
                      <td>
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold">
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-slate-50 p-5 text-slate-500">
              You have no loan applications yet.
            </p>
          )}
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Identity verification</h2>
          {kyc ? (
            <>
              <p className="mt-4 text-sm">
                Status: <strong>{kyc.status}</strong>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {kyc.idType.replace('_', ' ')} ending {kyc.idNumberLast4}
              </p>
            </>
          ) : (
            <form onSubmit={submitKyc} className="mt-5 space-y-4">
              <select name="idType" className="w-full rounded-lg border p-3" required>
                <option value="">Choose ID type</option>
                <option value="NATIONAL_ID">National ID</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVING_LICENSE">Driving licence</option>
              </select>
              <input
                name="idNumber"
                required
                minLength={5}
                maxLength={50}
                pattern="[A-Za-z0-9-]+"
                autoComplete="off"
                placeholder="Document number"
                className="w-full rounded-lg border p-3"
              />
              <button className="w-full rounded-lg bg-emerald-700 p-3 font-bold text-white">
                Submit for review
              </button>
            </form>
          )}
        </section>
      </div>
    </Layout>
  );
}
