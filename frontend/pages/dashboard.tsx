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
  updatedAt: string;
};
type Kyc = {
  idType: string;
  idNumberLast4: string;
  status: string;
  rejectionReason?: string | null;
} | null;
type Payment = {
  id: string;
  loanId: string;
  loanNumber: string;
  amount: string;
  method: string;
  reference: string;
  status: string;
  paymentDate: string;
  failureReason?: string | null;
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
          return router.replace({
            pathname: '/login',
            query: { next: '/dashboard#application-progress' },
          });
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
        <div className="flex flex-wrap gap-3 self-start">
          {latest && (
            <a href="#application-progress" className="button button-primary button-small">
              Track application
            </a>
          )}
          <button onClick={() => void signOut()} className="button button-secondary button-small">
            Sign out
          </button>
        </div>
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
                {Number(loan.outstanding) > 0 && ['ACTIVE', 'DEFAULTED'].includes(loan.status) && (
                  <a
                    href="#submit-repayment"
                    className="button button-primary button-small mt-5 w-full"
                  >
                    Submit repayment
                  </a>
                )}
              </article>
            ))}
          </div>
          <RepaymentForm
            loans={loans}
            installments={installments}
            payments={payments}
            onSaved={async (result) => {
              setMessage(result);
              await load();
            }}
            onError={(error) => setMessage(`Payment failed: ${error}`)}
          />
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
          {payments.length > 0 && (
            <div className="mt-8 overflow-x-auto border-t border-pata-900/15 pt-6">
              <h3 className="font-bold text-pata-950">Payment history</h3>
              <p className="mt-2 text-sm text-slate-500">
                Pending payments affect your balance only after verification.
              </p>
              <table className="mt-4 w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-pata-900/15 text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3">Loan</th>
                    <th className="pb-3">Date paid</th>
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr className="border-b border-pata-900/10 last:border-0" key={payment.id}>
                      <td className="py-4 font-semibold">{payment.loanNumber}</td>
                      <td>{new Date(payment.paymentDate).toLocaleDateString('en-KE')}</td>
                      <td className="font-mono text-xs">{payment.reference}</td>
                      <td>{payment.method.replace(/_/g, ' ').toLowerCase()}</td>
                      <td>{money(payment.amount)}</td>
                      <td>
                        <StatusBadge status={payment.status} />
                        {payment.failureReason && (
                          <small className="mt-1 block max-w-[220px] text-red-700">
                            {payment.failureReason}
                          </small>
                        )}
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
              <h2 className="mt-2 text-2xl font-bold text-pata-950">Application history</h2>
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
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Submitted</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr className="border-b border-pata-900/10 last:border-0" key={a.id}>
                      <td className="py-5 font-mono text-xs">{a.applicationNumber}</td>
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
              copy="Choose an amount and repayment period when you are ready to apply."
              action={
                <Link href="/loans" className="text-sm font-bold text-pata-700">
                  Start an application →
                </Link>
              }
            />
          )}{' '}
        </section>
        <aside className="space-y-6">
          <section id="identity-verification" className="surface scroll-mt-24 p-6">
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

function RepaymentForm({
  loans,
  installments,
  payments,
  onSaved,
  onError,
}: {
  loans: Loan[];
  installments: Installment[];
  payments: Payment[];
  onSaved: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const eligible = loans.filter(
      (loan) => Number(loan.outstanding) > 0 && ['ACTIVE', 'DEFAULTED'].includes(loan.status),
    ),
    [loanId, setLoanId] = useState(eligible[0]?.id || ''),
    [amount, setAmount] = useState(() => {
      const first = eligible[0],
        due = installments.find(
          (item) =>
            item.loanNumber === first?.loanNumber &&
            Number(item.remaining) > 0 &&
            !['PAID', 'WAIVED'].includes(item.status),
        ),
        pending = payments
          .filter(
            (payment) =>
              payment.loanId === first?.id && ['PENDING', 'PROCESSING'].includes(payment.status),
          )
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
        available = Math.max(0, Number(first?.outstanding || 0) - pending);
      return available ? String(Math.min(Number(due?.remaining || available), available)) : '';
    }),
    [submitting, setSubmitting] = useState(false);
  if (!eligible.length) return null;
  const selected = eligible.find((loan) => loan.id === loanId) || eligible[0],
    nextDue = installments.find(
      (item) =>
        item.loanNumber === selected.loanNumber &&
        Number(item.remaining) > 0 &&
        !['PAID', 'WAIVED'].includes(item.status),
    ),
    pendingAmount = payments
      .filter(
        (payment) =>
          payment.loanId === selected.id && ['PENDING', 'PROCESSING'].includes(payment.status),
      )
      .reduce((sum, payment) => sum + Number(payment.amount), 0),
    availableToSubmit = Math.max(0, Number(selected.outstanding) - pendingAmount),
    today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget,
      form = new FormData(formElement);
    setSubmitting(true);
    try {
      const response = await api<{ message: string }>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          loanId: selected.id,
          amount,
          method: form.get('method'),
          reference: form.get('reference'),
          paymentDate: form.get('paymentDate'),
        }),
      });
      formElement.reset();
      setAmount('');
      await onSaved(response.message);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to submit payment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="submit-repayment"
      className="repayment-entry scroll-mt-24"
      aria-labelledby="repayment-entry-title"
    >
      <div className="repayment-entry-copy">
        <p className="eyebrow">Repayment</p>
        <h3 id="repayment-entry-title">Submit a payment for verification</h3>
        <p>
          First complete the transfer using the payment channel in your loan agreement. Then enter
          the receipt details here. PataPesa does not collect money on this page.
        </p>
        <dl>
          <div>
            <dt>Next instalment</dt>
            <dd>{money(nextDue?.remaining || selected.outstanding)}</dd>
          </div>
          <div>
            <dt>Due date</dt>
            <dd>
              {nextDue ? new Date(nextDue.dueDate).toLocaleDateString('en-KE') : 'See agreement'}
            </dd>
          </div>
          {pendingAmount > 0 && (
            <div>
              <dt>Awaiting verification</dt>
              <dd>{money(pendingAmount)}</dd>
            </div>
          )}
        </dl>
      </div>
      <form onSubmit={submit} className="repayment-form">
        <label className="field">
          <span>Loan account</span>
          <select
            value={selected.id}
            onChange={(event) => {
              const nextLoan = eligible.find((loan) => loan.id === event.target.value);
              setLoanId(event.target.value);
              const due = installments.find(
                  (item) =>
                    item.loanNumber === nextLoan?.loanNumber &&
                    Number(item.remaining) > 0 &&
                    !['PAID', 'WAIVED'].includes(item.status),
                ),
                pending = payments
                  .filter(
                    (payment) =>
                      payment.loanId === nextLoan?.id &&
                      ['PENDING', 'PROCESSING'].includes(payment.status),
                  )
                  .reduce((sum, payment) => sum + Number(payment.amount), 0),
                available = Math.max(0, Number(nextLoan?.outstanding || 0) - pending);
              setAmount(
                available ? String(Math.min(Number(due?.remaining || available), available)) : '',
              );
            }}
          >
            {eligible.map((loan) => (
              <option value={loan.id} key={loan.id}>
                {loan.loanNumber} · {money(loan.outstanding)} outstanding
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Amount already paid (KES)</span>
            <input
              type="number"
              min="1"
              max={availableToSubmit}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Payment method</span>
            <select name="method" required defaultValue="MOBILE_MONEY">
              <option value="MOBILE_MONEY">Mobile money</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Transaction reference</span>
            <input
              name="reference"
              minLength={5}
              maxLength={100}
              pattern="[A-Za-z0-9][A-Za-z0-9._/-]{4,99}"
              autoComplete="off"
              placeholder="From your receipt"
              required
            />
          </label>
          <label className="field">
            <span>Date paid</span>
            <input name="paymentDate" type="date" max={today} defaultValue={today} required />
          </label>
        </div>
        <label className="repayment-confirmation">
          <input type="checkbox" required />
          <span>
            I confirm that I already completed this transfer and the reference is correct.
          </span>
        </label>
        {availableToSubmit <= 0 && (
          <p className="notice notice-success">
            Your submitted payment already covers the available balance and is awaiting
            verification.
          </p>
        )}
        <button
          className="button button-primary w-full"
          disabled={submitting || availableToSubmit <= 0}
        >
          {submitting ? 'Submitting…' : 'Submit payment for verification'}
        </button>
      </form>
    </section>
  );
}

function ApplicationJourney({ application, kyc }: { application: Application; kyc: Kyc }) {
  const status = application.status;
  const decisionReached = ['APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED'].includes(status);
  const fundsRecorded = ['DISBURSED', 'COMPLETED'].includes(status);
  const identityApproved = kyc?.status === 'APPROVED';
  const identityNeedsAction = !kyc || ['REJECTED', 'EXPIRED'].includes(kyc.status);
  const approved = ['APPROVED', 'DISBURSED', 'COMPLETED'].includes(status);
  const underReview = status === 'UNDER_REVIEW';
  const rejected = status === 'REJECTED';
  const stages = [
    {
      label: 'Application received',
      detail: `Submitted ${new Date(application.createdAt).toLocaleDateString('en-KE')}`,
      state: 'complete',
    },
    {
      label: identityNeedsAction ? 'Identity details need attention' : 'Identity verification',
      detail: identityApproved
        ? 'Your identity details have been verified'
        : kyc?.status === 'PENDING'
          ? 'Your identity details are being checked'
          : identityNeedsAction
            ? kyc?.rejectionReason || 'Please correct and resubmit your identity details'
            : 'Submit your identity details to continue',
      state: identityNeedsAction ? 'attention' : identityApproved ? 'complete' : 'current',
    },
    {
      label: underReview ? 'Application review in progress' : 'Application review',
      detail: decisionReached
        ? 'Identity, affordability and application details reviewed'
        : underReview
          ? 'Our team is assessing your application'
          : identityApproved
            ? 'Your application is queued for review'
            : 'This starts after identity verification',
      state: decisionReached ? 'complete' : identityApproved ? 'current' : 'upcoming',
    },
    {
      label: rejected ? 'Application not approved' : approved ? 'Application approved' : 'Decision',
      detail: decisionReached
        ? `Recorded ${new Date(application.reviewedAt || application.updatedAt).toLocaleDateString(
            'en-KE',
          )}`
        : 'We will show the decision here after review',
      state: rejected ? 'attention' : approved ? 'complete' : 'upcoming',
    },
    {
      label: fundsRecorded ? 'Funds sent' : 'Disbursement',
      detail: rejected
        ? 'This step is not available for this application'
        : fundsRecorded
          ? 'The transfer has been recorded'
          : approved
            ? 'The approved transfer is being prepared'
            : 'This starts only after approval',
      state: fundsRecorded ? 'complete' : approved ? 'current' : 'upcoming',
    },
  ];
  const currentIndex = fundsRecorded || approved ? 4 : rejected ? 3 : identityApproved ? 2 : 1;
  const progress = fundsRecorded
    ? 100
    : approved || rejected
      ? 80
      : Math.round(((currentIndex + 1) / stages.length) * 100);
  const summary = rejected
    ? {
        eyebrow: 'Decision recorded',
        title: 'Your application was not approved',
        copy: 'Read the reason below. Contact support if you need an explanation.',
        action: 'Review the decision reason',
        tone: 'danger',
      }
    : fundsRecorded
      ? {
          eyebrow: 'Disbursement recorded',
          title: 'Your funds have been sent',
          copy: 'Your repayment information will appear when it is recorded.',
          action: 'No action is needed right now',
          tone: 'success',
        }
      : approved
        ? {
            eyebrow: 'Decision recorded',
            title: 'Your application is approved',
            copy: 'The transfer is being prepared. We will update this page when it is recorded.',
            action: 'No action is needed right now',
            tone: 'success',
          }
        : underReview
          ? {
              eyebrow: 'Review in progress',
              title: 'We are reviewing your application',
              copy: 'Our team is checking your identity, affordability and application details.',
              action: 'No action is needed right now',
              tone: 'review',
            }
          : identityNeedsAction
            ? {
                eyebrow: 'Action required',
                title: 'Update your identity details',
                copy: kyc?.rejectionReason || 'Identity verification is required before review.',
                action: 'Go to identity verification',
                tone: 'danger',
              }
            : identityApproved
              ? {
                  eyebrow: 'Waiting for review',
                  title: 'Your application is in the review queue',
                  copy: 'Your identity is verified. We will update this page when review starts.',
                  action: 'No action is needed right now',
                  tone: 'review',
                }
              : {
                  eyebrow: 'Identity check',
                  title: 'We are checking your identity details',
                  copy: 'Your application enters the review queue after this check is complete.',
                  action: 'No action is needed right now',
                  tone: 'review',
                };
  return (
    <section
      id="application-progress"
      className="application-tracker surface mt-10 scroll-mt-24"
      aria-labelledby="application-progress-title"
    >
      <div className="application-tracker-header">
        <div>
          <p className="eyebrow">Application progress</p>
          <h2 id="application-progress-title">
            {application.product} · {money(application.amount)}
          </h2>
          <p className="application-reference">Reference {application.applicationNumber}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className={`application-current application-current-${summary.tone}`}>
        <div className="application-current-copy">
          <p>{summary.eyebrow}</p>
          <h3>{summary.title}</h3>
          <span>{summary.copy}</span>
        </div>
        <div className="application-next-action">
          <small>What you need to do</small>
          {!decisionReached && identityNeedsAction ? (
            <a href="#identity-verification">{summary.action} ↓</a>
          ) : (
            <strong>{summary.action}</strong>
          )}
        </div>
      </div>

      <div className="application-progress-meter">
        <div className="application-progress-label">
          <span>
            Step {currentIndex + 1} of {stages.length}
          </span>
          <span>{summary.eyebrow}</span>
        </div>
        <div
          className="application-progress-track"
          role="progressbar"
          aria-label="Application progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol className="application-timeline" aria-label="Application stages">
        {stages.map((stage, index) => (
          <li
            key={stage.label}
            aria-current={stage.state === 'current' ? 'step' : undefined}
            className={`application-stage application-stage-${stage.state}`}
          >
            <span className="application-stage-marker" aria-hidden="true">
              {stage.state === 'complete' ? '✓' : stage.state === 'attention' ? '!' : index + 1}
            </span>
            <div>
              <span className="application-stage-state">
                {stage.state === 'complete'
                  ? 'Complete'
                  : stage.state === 'current'
                    ? 'In progress'
                    : stage.state === 'attention'
                      ? 'Action needed'
                      : 'Coming next'}
              </span>
              <strong>{stage.label}</strong>
              <small>{stage.detail}</small>
            </div>
          </li>
        ))}
      </ol>

      {application.rejectionReason && (
        <div className="application-decision" role="alert">
          <span>Reason provided</span>
          <strong>{application.rejectionReason}</strong>
          <Link href="/contact">Ask support about this decision →</Link>
        </div>
      )}
      <p className="application-updated">
        Last updated{' '}
        {new Date(application.updatedAt || application.createdAt).toLocaleString('en-KE')}
      </p>
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
