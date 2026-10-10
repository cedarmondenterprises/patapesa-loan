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
      await router.push('/');
    } catch {
      setMessage('Sign out could not be completed. Please try again.');
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
    featuredLoan = loans.find((loan) => Number(loan.outstanding) > 0) || loans[0],
    featuredDue = installments.find(
      (item) =>
        item.loanNumber === featuredLoan?.loanNumber &&
        Number(item.remaining) > 0 &&
        !['PAID', 'WAIVED'].includes(item.status),
    ),
    pendingFeaturedPayment = payments.some(
      (payment) =>
        payment.loanId === featuredLoan?.id && ['PENDING', 'PROCESSING'].includes(payment.status),
    ),
    repaymentProgress = featuredLoan && Number(featuredLoan.totalPayable) > 0
      ? Math.min(100, Math.max(0, Math.round((Number(featuredLoan.paid) / Number(featuredLoan.totalPayable)) * 100)))
      : 0,
    recentActivity = [
      ...apps.slice(0, 3).map((app) => ({
        key: app.id,
        title: `Application ${app.status.replace(/_/g, ' ').toLowerCase()}`,
        description: app.applicationNumber,
        at: app.updatedAt || app.createdAt,
        tone: app.status === 'REJECTED' ? 'negative' : 'neutral',
      })),
      ...payments.slice(0, 3).map((payment) => ({
        key: payment.id,
        title: `Payment ${payment.status.replace(/_/g, ' ').toLowerCase()}`,
        description: `${money(payment.amount)} · ${payment.loanNumber}`,
        at: payment.paymentDate,
        tone: ['FAILED', 'REJECTED'].includes(payment.status)
          ? 'negative'
          : payment.status === 'COMPLETED'
            ? 'complete'
            : 'neutral',
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 3),
    nextStep = needsKyc && latest && ['SUBMITTED', 'UNDER_REVIEW'].includes(latest.status)
      ? { title: 'Check your identity details', detail: kyc?.rejectionReason || 'Your identity details need attention before a decision.', href: '#identity-verification', action: 'Review identity details' }
      : pendingFeaturedPayment
        ? { title: 'Receipt awaiting verification', detail: 'We will update your balance after the submitted payment is confirmed.', href: '#repayments', action: 'View payment status' }
      : nextInstallment
        ? { title: 'Keep track of your next instalment', detail: `${money(nextInstallment.remaining)} due ${new Date(nextInstallment.dueDate).toLocaleDateString('en-KE')}. After paying using your agreement, submit the receipt here.`, href: '#submit-repayment', action: 'Submit payment details' }
        : latest?.status === 'REJECTED'
          ? { title: 'Review the decision', detail: latest.rejectionReason || 'The decision and available next steps are shown in your application.', href: '#application-progress', action: 'View decision' }
          : latest?.status === 'APPROVED'
            ? { title: 'Wait for your transfer', detail: 'Your application was approved. Funds are recorded only after the transfer is made.', href: '#application-progress', action: 'View progress' }
            : latest
              ? { title: 'Follow your application', detail: 'We will show each review stage here as it happens.', href: '#application-progress', action: 'View progress' }
              : { title: 'Explore your options', detail: 'Compare the total cost and repayment period before applying.', href: '/loans', action: 'See loan options' };
  if (loading)
    return (
      <Layout title="Dashboard | PataPesa">
        <div className="account-loading" aria-label="Loading your account">
          <div className="skeleton h-20" />
          <div className="account-feature-grid">
            <div className="skeleton h-80" /><div className="skeleton h-80" />
          </div>
        </div>
      </Layout>
    );
  if (loadError)
    return (
      <Layout title="My account | PataPesa">
        <section className="account-card account-load-error" role="alert">
          <h1>We couldn’t load your account</h1>
          <p>{loadError}</p>
          <button className="button button-primary" onClick={() => void load()}>
            Try again
          </button>
        </section>
      </Layout>
    );
  return (
    <Layout title="My account | PataPesa">
      <header className="account-page-heading">
        <div>
          <p className="account-greeting">
            Good to see you{user?.firstName ? `, ${user.firstName}` : ''}
          </p>
          <h1>Your loan, at a glance</h1>
          <p>Track your application, manage repayments and find support in one place.</p>
        </div>
        <button onClick={() => void signOut()} className="account-signout">Sign out</button>
      </header>
      {message && (
        <p
          className={`notice mt-6 ${
            /failed|could not|unable|error/i.test(message) ? 'notice-error' : 'notice-success'
          }`}
        >
          {message}
        </p>
      )}
      <div className={`account-feature-grid${featuredLoan ? ' account-feature-grid-has-loan' : ''}`}>
        {latest ? <ApplicationJourney application={latest} kyc={kyc} /> : (
          <section id="application-progress" className="account-progress-card account-card">
            <div className="account-card-icon" aria-hidden="true">✦</div>
            <p className="account-card-kicker">Your application</p>
            <h2>No application yet</h2>
            <p>Explore loan options and review the full repayment before you apply.</p>
            <Link href="/loans" className="button button-primary">Explore loan options →</Link>
          </section>
        )}
        <section id={loans.length ? undefined : 'repayments'} className="account-balance-card account-card" aria-labelledby="account-balance-title">
          <div className="account-card-topline"><span className="account-card-icon" aria-hidden="true">▤</span><span className="account-card-tag">{featuredLoan ? featuredLoan.status.replace(/_/g, ' ').toLowerCase() : 'No active loan'}</span></div>
          <h2 id="account-balance-title">{featuredLoan ? 'Your repayment' : 'Repayment overview'}</h2>
          {featuredLoan ? (
            <>
              <p className="account-balance-label">Outstanding balance · {featuredLoan.loanNumber}</p>
              <strong className="account-balance-amount">{money(featuredLoan.outstanding)}</strong>
              <div className="account-repaid-summary">
                <div className="account-repaid-labels">
                  <span>Repaid so far</span>
                  <strong>{money(featuredLoan.paid)} of {money(featuredLoan.totalPayable)}</strong>
                </div>
                <div className="account-repaid-track" role="progressbar" aria-label="Loan repaid" aria-valuenow={repaymentProgress} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${money(featuredLoan.paid)} of ${money(featuredLoan.totalPayable)} repaid`}>
                  <span style={{ width: `${repaymentProgress}%` }} />
                </div>
              </div>
              <div className="account-next-due">
                <span>{featuredDue ? 'Next instalment' : 'Repayment status'}</span>
                <strong>{featuredDue ? money(featuredDue.remaining) : Number(featuredLoan.outstanding) === 0 ? 'No outstanding balance' : 'See repayment schedule'}</strong>
                {featuredDue && <small>Due {new Date(featuredDue.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</small>}
              </div>
              {Number(featuredLoan.outstanding) > 0 && ['ACTIVE', 'DEFAULTED'].includes(featuredLoan.status) ? (
                <a href={pendingFeaturedPayment ? '#repayments' : '#submit-repayment'} className="button button-primary account-balance-action">{pendingFeaturedPayment ? 'View payment status' : 'Submit payment details'} <span aria-hidden="true">→</span></a>
              ) : <a href="#repayments" className="button button-secondary account-balance-action">View loan details →</a>}
              <p className="account-balance-hint">{Number(featuredLoan.outstanding) === 0 ? 'This loan has no outstanding balance.' : pendingFeaturedPayment ? 'A submitted receipt is awaiting verification.' : 'Pay using the channel in your loan agreement, then submit the receipt here.'}</p>
            </>
          ) : (
            <div className="account-no-balance"><strong>No payment due yet</strong><p>Your repayment details will appear here when a loan is disbursed.</p>{hasOpenApplication ? <a href="#application-progress">View application progress →</a> : <Link href="/loans">View loan options →</Link>}</div>
          )}
        </section>
      </div>
      <div className="account-insights-grid">
        <section id="activity" className="account-card account-insight-card">
          <div className="account-insight-heading"><h2>Recent activity</h2><a href="#application-history">Applications</a></div>
          {recentActivity.length ? <ol className="account-activity-list">{recentActivity.map((item) => <li key={item.key}><span className={`account-activity-dot account-activity-${item.tone}`} aria-hidden="true">{item.tone === 'negative' ? '!' : item.tone === 'complete' ? '✓' : '•'}</span><div><strong>{item.title}</strong><small>{item.description} · {new Date(item.at).toLocaleDateString('en-KE')}</small></div></li>)}</ol> : <p className="account-empty-copy">Your activity will appear here after you apply.</p>}
        </section>
        <section className="account-card account-insight-card">
          <div className="account-insight-heading"><h2>Next steps</h2></div>
          <strong className="account-next-step-title">{nextStep.title}</strong>
          <p className="account-next-step-copy">{nextStep.detail}</p>
          <a href={nextStep.href} className="account-inline-link">{nextStep.action} →</a>
        </section>
        <section className="account-card account-insight-card">
          <div className="account-insight-heading"><h2>Need help?</h2></div>
          <p className="account-next-step-copy">Questions about your application or repayments? Have your application reference ready when you contact us.</p>
          <Link href="/contact" className="account-help-link">Visit Help Centre ↗</Link>
        </section>
      </div>
      {loans.length > 0 && (
        <section id="repayments" className="surface account-detail-section mt-10 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Repayment details</p>
              <h2 className="mt-2 text-2xl font-bold text-pata-950">Your loans and payments</h2>
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
                    Submit payment details
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
            <div className="account-record-section mt-8 border-t border-pata-900/15 pt-6">
              <h3 className="font-bold text-pata-950">Repayment schedule</h3>
              <p className="account-record-description">See what is due, what is paid and the status of each instalment.</p>
              <ol className="account-mobile-records" aria-label="Repayment schedule">
                {installments.map((item) => (
                  <li className="account-mobile-record" key={item.id}>
                    <div className="account-mobile-record-heading">
                      <div><span className="account-mobile-record-eyebrow">Instalment {item.sequence}</span><strong>{money(item.remaining)} remaining</strong></div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="account-mobile-record-details"><span>Due {new Date(item.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span>{money(item.totalDue)} total</span></div>
                  </li>
                ))}
              </ol>
              <div className="account-desktop-records overflow-x-auto"><table className="mt-4 w-full min-w-[680px] text-left text-sm">
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
              </table></div>
            </div>
          )}
          {payments.length > 0 && (
            <div className="account-record-section mt-8 border-t border-pata-900/15 pt-6">
              <h3 className="font-bold text-pata-950">Payment history</h3>
              <p className="mt-2 text-sm text-slate-500">
                Pending payments affect your balance only after verification.
              </p>
              <ol className="account-mobile-records" aria-label="Payment history">
                {payments.map((payment) => (
                  <li className="account-mobile-record" key={payment.id}>
                    <div className="account-mobile-record-heading">
                      <div><span className="account-mobile-record-eyebrow">{payment.loanNumber}</span><strong>{money(payment.amount)}</strong></div>
                      <StatusBadge status={payment.status} />
                    </div>
                    <div className="account-mobile-record-details"><span>{new Date(payment.paymentDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span>{payment.method.replace(/_/g, ' ').toLowerCase()}</span></div>
                    <small className="account-mobile-record-reference">Reference {payment.reference}</small>
                    {payment.failureReason && <small className="account-mobile-record-error">{payment.failureReason}</small>}
                  </li>
                ))}
              </ol>
              <div className="account-desktop-records overflow-x-auto"><table className="mt-4 w-full min-w-[650px] text-left text-sm">
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
              </table></div>
            </div>
          )}
        </section>
      )}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.45fr_.75fr]">
        <section id="application-history" className="surface account-detail-section p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Your records</p>
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
            <div className="mt-7">
              <ol className="account-mobile-records" aria-label="Application history">
                {apps.map((application) => (
                  <li className="account-mobile-record" key={application.id}>
                    <div className="account-mobile-record-heading">
                      <div><span className="account-mobile-record-eyebrow">Application</span><strong>{money(application.amount)}</strong></div>
                      <StatusBadge status={application.status} />
                    </div>
                    <div className="account-mobile-record-details"><span>Submitted {new Date(application.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                    <small className="account-mobile-record-reference">Reference {application.applicationNumber}</small>
                  </li>
                ))}
              </ol>
              <div className="account-desktop-records overflow-x-auto">
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
          <section id="identity-verification" className="surface account-detail-section scroll-mt-24 p-6">
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
          <section className="account-support-note p-6">
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
  const rejected = status === 'REJECTED';
  const fundsRecorded = ['DISBURSED', 'COMPLETED'].includes(status);
  const approved = ['APPROVED', 'DISBURSED', 'COMPLETED'].includes(status);
  const identityApproved = kyc?.status === 'APPROVED';
  const identityNeedsAction = !kyc || ['REJECTED', 'EXPIRED'].includes(kyc.status);
  const currentStage = fundsRecorded || approved ? 4 : rejected || identityApproved ? 3 : 2;
  const summary = rejected
    ? { label: 'Decision recorded', title: 'Application not approved', detail: 'Read the reason below. Contact support if you need help understanding the decision.', tone: 'danger' }
    : fundsRecorded
      ? { label: 'Funds recorded', title: 'Funds sent', detail: 'Your loan and repayment details are shown on this page.', tone: 'success' }
      : approved
        ? { label: 'Approved', title: 'Your application is approved', detail: 'The transfer is being prepared. We will update this page when it is recorded.', tone: 'success' }
        : identityNeedsAction
          ? { label: 'Action needed', title: 'Identity details need attention', detail: kyc?.rejectionReason || 'Verify your identity to continue the review.', tone: 'danger' }
          : status === 'UNDER_REVIEW'
            ? { label: 'In progress', title: 'Loan in review', detail: 'We are reviewing your application. No action is needed right now.', tone: 'review' }
            : identityApproved
              ? { label: 'In progress', title: 'Waiting for review', detail: 'Your identity is verified. We will update this page when the review starts.', tone: 'review' }
              : { label: 'In progress', title: 'Identity check in progress', detail: 'Your details are being checked before a decision is made.', tone: 'review' };
  const stages = [
    { label: 'Applied', detail: new Date(application.createdAt).toLocaleDateString('en-KE'), state: 'complete' },
    {
      label: 'Identity check',
      detail: identityApproved ? 'Verified' : identityNeedsAction ? 'Needs attention' : 'In review',
      state: identityApproved ? 'complete' : identityNeedsAction ? 'attention' : 'current',
    },
    {
      label: 'Decision',
      detail: rejected ? 'Not approved' : approved ? 'Approved' : identityApproved ? 'In review' : 'Coming next',
      state: rejected ? 'attention' : approved ? 'complete' : identityApproved ? 'current' : 'upcoming',
    },
    {
      label: 'Funds sent',
      detail: fundsRecorded ? 'Recorded' : rejected ? 'Not applicable' : approved ? 'Transfer pending' : 'Coming next',
      state: fundsRecorded ? 'complete' : rejected ? 'skipped' : approved ? 'current' : 'upcoming',
    },
  ];
  return (
    <section id="application-progress" className={`account-progress-card account-card account-progress-${summary.tone}`} aria-labelledby="application-progress-title">
      <div className="account-progress-topline">
        <span className="account-card-icon" aria-hidden="true">▤</span>
        <span className="account-card-tag">{summary.label}</span>
      </div>
      <p className="account-card-kicker">Application progress · {application.product}</p>
      <h2 id="application-progress-title">{summary.title}</h2>
      <p className="account-progress-intro">{summary.detail}</p>
      <p className="account-progress-meta">{money(application.amount)} · Reference {application.applicationNumber}</p>
      <p className="account-progress-count">{fundsRecorded ? 'All stages complete' : rejected ? 'Application closed' : `Stage ${currentStage} of 4`} <span aria-hidden="true">·</span> {summary.label}</p>
      <ol className="account-progress-steps" aria-label="Loan application stages">
        {stages.map((stage) => (
          <li key={stage.label} className={`account-progress-step account-progress-step-${stage.state}`} aria-current={stage.state === 'current' ? 'step' : undefined}>
            <span className="account-progress-marker" aria-hidden="true">{stage.state === 'complete' ? '✓' : stage.state === 'attention' ? '!' : ''}</span>
            <strong>{stage.label}</strong>
            <small>{stage.detail}</small>
          </li>
        ))}
      </ol>
      {application.rejectionReason && (
        <div className="account-decision-reason" role="alert">
          <strong>Why it was not approved</strong>
          <p>{application.rejectionReason}</p>
          <Link href="/contact">Ask support about this decision →</Link>
        </div>
      )}
      {identityNeedsAction && !rejected && !approved && (
        <a href="#identity-verification" className="account-inline-link">Review identity details →</a>
      )}
      <p className="account-progress-updated">Last updated {new Date(application.updatedAt || application.createdAt).toLocaleString('en-KE')}</p>
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
