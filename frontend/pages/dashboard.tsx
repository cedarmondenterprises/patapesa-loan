/* eslint-disable react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { api, ApiError, logout } from '../lib/api';

type User = { firstName: string; lastName: string; email: string; phone: string };
type Application = {
  id: string;
  applicationNumber: string;
  product: string;
  amount: string;
  term: number;
  status: string;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
};
type Kyc = {
  idType: string;
  idNumberLast4: string;
  status: string;
  rejectionReason?: string | null;
} | null;
type Payment = {
  id: string;
  amount: string;
  method: string;
  reference: string;
  status: string;
  paymentDate: string;
};
type Loan = {
  id: string;
  loanNumber: string;
  principal: string;
  totalPayable: string;
  paid: string;
  outstanding: string;
  status: string;
  disbursedAt: string;
  maturityDate: string;
};
type Installment = {
  id: string;
  loanNumber: string;
  sequence: number;
  dueDate: string;
  totalDue: string;
  amountPaid: string;
  remaining: string;
  status: string;
};
const money = (n: unknown) => `KES ${Number(n || 0).toLocaleString('en-KE')}`;

export default function Dashboard() {
  const router = useRouter(),
    [user, setUser] = useState<User | null>(null),
    [apps, setApps] = useState<Application[]>([]),
    [kyc, setKyc] = useState<Kyc>(null),
    [payments, setPayments] = useState<Payment[]>([]),
    [loans, setLoans] = useState<Loan[]>([]),
    [installments, setInstallments] = useState<Installment[]>([]),
    [message, setMessage] = useState(''),
    [loadError, setLoadError] = useState(''),
    [loading, setLoading] = useState(true);
  const load = () => {
    return api<{
      data: {
        user: User;
        applications: Application[];
        kyc: Kyc;
        payments: Payment[];
        loans: Loan[];
        installments: Installment[];
      };
    }>('/account/overview')
      .then(({ data }) => {
        setLoadError('');
        setUser(data.user);
        setApps(data.applications);
        setKyc(data.kyc);
        setPayments(data.payments);
        setLoans(data.loans);
        setInstallments(data.installments);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401)
          return router.replace({ pathname: '/login', query: { next: '/dashboard' } });
        setLoadError(error instanceof Error ? error.message : 'Unable to load your account');
      })
      .finally(() => setLoading(false));
  };
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
    needsKyc = !kyc || ['REJECTED', 'EXPIRED'].includes(kyc.status),
    hasOpenApplication = Boolean(
      latest && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(latest.status),
    ),
    nextInstallment = installments.find(
      (item) => Number(item.remaining) > 0 && !['PAID', 'WAIVED'].includes(item.status),
    ),
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
          className={`notice mt-6 ${
            message.toLowerCase().includes('failed') ? 'notice-error' : 'notice-success'
          }`}
        >
          {message}
        </p>
      )}
      {loadError && (
        <div
          className="notice notice-error mt-6 flex items-center justify-between gap-4"
          role="alert"
        >
          <span>{loadError}</span>
          <button className="text-sm font-bold underline" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}
      <section className="mt-8 grid border-y border-pata-900/15 md:grid-cols-3">
        <Summary
          label="Your next action"
          value={
            needsKyc
              ? kyc?.status === 'REJECTED'
                ? 'Correct identity details'
                : 'Verify identity'
              : nextInstallment
              ? `Pay ${money(nextInstallment.remaining)}`
              : latest
              ? latest.status.replace(/_/g, ' ').toLowerCase()
              : 'Choose a loan'
          }
          note={
            needsKyc
              ? kyc?.rejectionReason || 'Required before a loan can be approved'
              : nextInstallment
              ? `Due ${new Date(nextInstallment.dueDate).toLocaleDateString('en-KE')}`
              : latest
              ? `Application ${latest.applicationNumber}`
              : 'Compare the full repayment first'
          }
        />
        <Summary
          label="Identity check"
          value={kyc?.status.replace(/_/g, ' ').toLowerCase() || 'Not submitted'}
          note={
            kyc
              ? `${kyc.idType.replace(/_/g, ' ')} ending ${kyc.idNumberLast4}`
              : 'Required before loan approval'
          }
          border
        />
        <Summary
          label="Total paid"
          value={money(paid)}
          note={`${payments.length} payment record${payments.length === 1 ? '' : 's'}`}
          border
        />
      </section>
      {latest && <ApplicationJourney application={latest} kyc={kyc} />}
      {loans.length > 0 && (
        <section className="surface mt-10 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Repayment overview</p>
              <h2 className="mt-2 text-2xl font-bold text-pata-950">Your loan balance</h2>
            </div>
            <p className="text-sm text-slate-500">Confirmed payments update these figures.</p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loans.map((loan) => (
              <article className="border border-pata-900/15 bg-pata-50 p-5" key={loan.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {loan.loanNumber}
                    </span>
                    <strong className="mt-2 block text-2xl text-pata-950">
                      {money(loan.outstanding)}
                    </strong>
                    <small className="text-slate-500">Outstanding balance</small>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-pata-900/10 pt-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Paid</dt>
                    <dd className="mt-1 font-semibold text-pata-950">{money(loan.paid)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Matures</dt>
                    <dd className="mt-1 font-semibold text-pata-950">
                      {new Date(loan.maturityDate).toLocaleDateString('en-KE')}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          {installments.length > 0 && (
            <div className="mt-8 overflow-x-auto border-t border-pata-900/15 pt-6">
              <h3 className="font-bold text-pata-950">Repayment schedule</h3>
              <table className="mt-4 w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-pata-900/15 text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3">Instalment</th>
                    <th className="pb-3">Due date</th>
                    <th className="pb-3">Amount due</th>
                    <th className="pb-3">Remaining</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((item) => (
                    <tr className="border-b border-pata-900/10 last:border-0" key={item.id}>
                      <td className="py-4 font-semibold">#{item.sequence}</td>
                      <td>{new Date(item.dueDate).toLocaleDateString('en-KE')}</td>
                      <td>{money(item.totalDue)}</td>
                      <td>{money(item.remaining)}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.45fr_.75fr]">
        <section className="surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Your activity</p>
              <h2 className="mt-2 text-2xl font-bold text-pata-950">Loan applications</h2>
            </div>
            {hasOpenApplication ? (
              <span className="text-sm font-semibold text-slate-500">
                One application at a time
              </span>
            ) : (
              <Link href="/loans" className="button button-primary button-small">
                New application
              </Link>
            )}
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
              {needsKyc
                ? kyc?.status === 'REJECTED'
                  ? 'Correct identity details'
                  : 'Verify your identity'
                : kyc.status === 'PENDING'
                ? 'Identity review in progress'
                : 'Identity status'}
            </h2>
            {!needsKyc && kyc ? (
              <div className="mt-5">
                <StatusBadge status={kyc.status} />
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {kyc.idType.replace(/_/g, ' ')} ending {kyc.idNumberLast4}.{' '}
                  {kyc.status === 'PENDING' ? 'We will update this status after staff review.' : ''}
                </p>
              </div>
            ) : (
              <>
                {kyc?.rejectionReason && (
                  <p className="notice notice-error mt-4" role="alert">
                    {kyc.rejectionReason}
                  </p>
                )}
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
                  <button className="button button-primary w-full">
                    {kyc ? 'Resubmit for review' : 'Submit for review'}
                  </button>
                </form>
              </>
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
      className={`py-7 md:px-8 ${
        border ? 'border-t border-pata-900/15 md:border-l md:border-t-0' : ''
      }`}
    >
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <strong className="mt-2 block text-2xl capitalize text-pata-950">{value}</strong>
      <small className="mt-2 block text-slate-500">{note}</small>
    </div>
  );
}
function ApplicationJourney({ application, kyc }: { application: Application; kyc: Kyc }) {
  const status = application.status;
  const decisionReached = ['APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED'].includes(status);
  const fundsRecorded = ['DISBURSED', 'COMPLETED'].includes(status);
  const stages = [
    {
      label: 'Submitted',
      detail: new Date(application.createdAt).toLocaleDateString('en-KE'),
      done: true,
    },
    {
      label: 'Identity and affordability review',
      detail:
        kyc?.status === 'APPROVED'
          ? 'Identity verified'
          : kyc?.status === 'PENDING'
          ? 'Identity check pending'
          : 'Identity action required',
      done: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED'].includes(status),
    },
    {
      label: status === 'REJECTED' ? 'Not approved' : 'Decision recorded',
      detail: application.reviewedAt
        ? new Date(application.reviewedAt).toLocaleDateString('en-KE')
        : 'Awaiting staff decision',
      done: decisionReached,
    },
    {
      label: status === 'REJECTED' ? 'Process closed' : 'Funds recorded',
      detail:
        status === 'REJECTED'
          ? 'You may review the explanation and submit a new application'
          : fundsRecorded
            ? 'External transfer confirmed'
            : 'Only after an approved transfer',
      done: status === 'REJECTED' || fundsRecorded,
    },
  ];
  const current = stages.findIndex((stage) => !stage.done);
  return (
    <section className="surface mt-10 p-6 sm:p-8" aria-labelledby="application-progress-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Latest application · {application.applicationNumber}</p>
          <h2 id="application-progress-title" className="mt-2 text-2xl font-bold text-pata-950">
            Where your application stands
          </h2>
        </div>
        <StatusBadge status={status} />
      </div>
      <ol className="mt-7 grid gap-3 md:grid-cols-4" aria-label="Application progress">
        {stages.map((stage, index) => (
          <li
            key={stage.label}
            aria-current={index === current ? 'step' : undefined}
            className={`border-t-4 p-4 ${
              stage.done
                ? 'border-pata-700 bg-pata-50'
                : index === current
                ? 'border-copper bg-[#f7f1e7]'
                : 'border-slate-200 bg-white'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {String(index + 1).padStart(2, '0')}
            </span>
            <strong className="mt-2 block text-sm text-pata-950">{stage.label}</strong>
            <small className="mt-1 block leading-5 text-slate-500">{stage.detail}</small>
          </li>
        ))}
      </ol>
      {application.rejectionReason && (
        <div className="notice notice-error mt-5" role="alert">
          <strong>Decision explanation:</strong> {application.rejectionReason}
        </div>
      )}
    </section>
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
