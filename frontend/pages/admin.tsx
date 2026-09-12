import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { api, ApiError } from '../lib/api';

type Application = {
  id: string;
  applicationNumber: string;
  product: string;
  amount: string;
  term: number;
  purpose: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};
type Kyc = {
  id: string;
  idType: string;
  idNumberLast4: string;
  idNumber: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export default function Admin() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [kyc, setKyc] = useState<Kyc[]>([]);
  const [message, setMessage] = useState('');
  async function load() {
    try {
      const [a, k] = await Promise.all([
        api<{ data: Application[] }>('/admin/applications'),
        api<{ data: Kyc[] }>('/admin/kyc'),
      ]);
      setApplications(a.data);
      setKyc(k.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await router.replace('/login');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Unable to load review queue');
    }
  }
  useEffect(() => {
    let active = true;
    void Promise.all([
      api<{ data: Application[] }>('/admin/applications'),
      api<{ data: Kyc[] }>('/admin/kyc'),
    ])
      .then(([a, k]) => {
        if (!active) return;
        setApplications(a.data);
        setKyc(k.data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          void router.replace('/login');
          return;
        }
        setMessage(error instanceof Error ? error.message : 'Unable to load review queue');
      });
    return () => {
      active = false;
    };
  }, [router]);
  async function review(path: string, status: string, needsReason = false) {
    const reason = needsReason
      ? window.prompt('Enter the reason shown to staff records:') || ''
      : '';
    if (needsReason && !reason) return;
    try {
      await api(path, { method: 'PATCH', body: JSON.stringify({ status, reason }) });
      setMessage('Review saved');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review failed');
    }
  }
  return (
    <Layout title="Staff review | PataPesa">
      <p className="text-sm font-bold text-emerald-700">AUTHORISED STAFF</p>
      <h1 className="mt-1 text-4xl font-black">Review queues</h1>
      {message && (
        <p role="status" className="mt-5 rounded-lg bg-slate-100 p-4">
          {message}
        </p>
      )}
      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-2xl font-bold">Identity submissions</h2>
        {kyc.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3">Customer</th>
                  <th>ID</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {kyc.map((item) => (
                  <tr className="border-b" key={item.id}>
                    <td className="py-4">
                      <strong>
                        {item.firstName} {item.lastName}
                      </strong>
                      <br />
                      <span className="text-slate-500">{item.email}</span>
                    </td>
                    <td>
                      {item.idType.replace(/_/g, ' ')}: <strong>{item.idNumber}</strong>
                    </td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void review(`/admin/kyc/${item.id}`, 'APPROVED')}
                          className="rounded bg-emerald-700 px-3 py-2 font-bold text-white"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => void review(`/admin/kyc/${item.id}`, 'REJECTED', true)}
                          className="rounded border px-3 py-2 font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-slate-500">No pending identity submissions.</p>
        )}
      </section>
      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-2xl font-bold">Loan applications</h2>
        {applications.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3">Reference</th>
                  <th>Customer</th>
                  <th>Request</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((item) => (
                  <tr className="border-b" key={item.id}>
                    <td className="py-4 font-mono">{item.applicationNumber}</td>
                    <td>
                      {item.firstName} {item.lastName}
                      <br />
                      <span className="text-slate-500">{item.email}</span>
                    </td>
                    <td>
                      {item.product}
                      <br />
                      <strong>
                        KES {Number(item.amount).toLocaleString()} · {item.term} months
                      </strong>
                      <br />
                      <span className="text-slate-500">{item.purpose}</span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            void review(`/admin/applications/${item.id}`, 'UNDER_REVIEW')
                          }
                          className="rounded border px-3 py-2 font-bold"
                        >
                          Reviewing
                        </button>
                        <button
                          onClick={() => void review(`/admin/applications/${item.id}`, 'APPROVED')}
                          className="rounded bg-emerald-700 px-3 py-2 font-bold text-white"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            void review(`/admin/applications/${item.id}`, 'REJECTED', true)
                          }
                          className="rounded border px-3 py-2 font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-slate-500">No applications awaiting review.</p>
        )}
      </section>
    </Layout>
  );
}
