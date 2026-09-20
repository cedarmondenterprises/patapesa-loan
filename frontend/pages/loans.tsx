import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Link from 'next/link';
import { api, ApiError } from '../lib/api';

type Product = {
  id: string;
  name: string;
  description: string;
  minAmount: string;
  maxAmount: string;
  minTerm: number;
  maxTerm: number;
  interestRate: string;
  processingFee: string;
  currency: string;
};
const kes = (n: number) => `KES ${Math.round(n).toLocaleString('en-KE')}`;
const draftKey = 'patapesa-loan-draft-v1';
type LoanDraft = {
  productId: string;
  requestId: string;
  step: number;
  amount: number;
  term: number;
  purposeCategory: string;
  purpose: string;
  repaymentSource: string;
  existingMonthlyDebt: number;
};

export default function Loans() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter(),
    [products, setProducts] = useState<Product[]>([]),
    [selected, setSelected] = useState<Product | null>(null),
    [step, setStep] = useState(1),
    [amount, setAmount] = useState(0),
    [term, setTerm] = useState(0),
    [purposeCategory, setPurposeCategory] = useState(''),
    [purpose, setPurpose] = useState(''),
    [repaymentSource, setRepaymentSource] = useState(''),
    [existingMonthlyDebt, setExistingMonthlyDebt] = useState(0),
    [declarationAccepted, setDeclarationAccepted] = useState(false),
    [requestId, setRequestId] = useState(''),
    [draftReady, setDraftReady] = useState(false),
    [message, setMessage] = useState(''),
    [loading, setLoading] = useState(false),
    [loadingProducts, setLoadingProducts] = useState(true);
  const requestedProduct = router.query.product;
  const requestedAmount = router.query.amount;
  const requestedTerm = router.query.term;
  useEffect(() => {
    if (!router.isReady) return;
    api<{ data: Product[] }>('/products')
      .then((r) => {
        setProducts(r.data);
        const requested = r.data.find((p) => p.id === requestedProduct);
        let restored = false;
        try {
          const draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null') as LoanDraft | null;
          const product = draft && r.data.find((item) => item.id === draft.productId);
          if (draft && product && (!requested || requested.id === product.id)) {
            setSelected(product);
            setRequestId(draft.requestId || crypto.randomUUID());
            setStep(draft.step === 2 ? 2 : 1);
            setAmount(
              Number.isFinite(draft.amount)
                ? Math.max(
                    Number(product.minAmount),
                    Math.min(draft.amount, Number(product.maxAmount)),
                  )
                : Number(product.minAmount),
            );
            setTerm(
              Number.isFinite(draft.term)
                ? Math.max(product.minTerm, Math.min(Math.round(draft.term), product.maxTerm))
                : product.minTerm,
            );
            setPurposeCategory(draft.purposeCategory || '');
            setPurpose(draft.purpose || '');
            setRepaymentSource(draft.repaymentSource || '');
            setExistingMonthlyDebt(
              Number.isFinite(draft.existingMonthlyDebt) ? draft.existingMonthlyDebt : 0,
            );
            restored = true;
          }
        } catch {
          /* Storage can be unavailable; keep the application usable. */
        }
        if (requested && !restored) {
          setSelected(requested);
          const n = Number(requestedAmount),
            t = Number(requestedTerm);
          setAmount(
            Number.isFinite(n)
              ? Math.max(Number(requested.minAmount), Math.min(n, Number(requested.maxAmount)))
              : Number(requested.minAmount),
          );
          setTerm(
            Number.isFinite(t)
              ? Math.max(requested.minTerm, Math.min(Math.round(t), requested.maxTerm))
              : requested.minTerm,
          );
          setRequestId(crypto.randomUUID());
        }
      })
      .catch((e) => setMessage(e.message))
      .finally(() => {
        setDraftReady(true);
        setLoadingProducts(false);
      });
  }, [router.isReady, requestedProduct, requestedAmount, requestedTerm]);
  useEffect(() => {
    if (!draftReady || !selected) return;
    const timeout = window.setTimeout(() => {
      const draft: LoanDraft = {
        productId: selected.id,
        requestId,
        step,
        amount,
        term,
        purposeCategory,
        purpose,
        repaymentSource,
        existingMonthlyDebt,
      };
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        /* Optional draft storage. */
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [
    amount,
    draftReady,
    existingMonthlyDebt,
    purpose,
    purposeCategory,
    repaymentSource,
    requestId,
    selected,
    step,
    term,
  ]);
  useEffect(() => {
    if (selected) headingRef.current?.focus();
  }, [selected, step]);
  const quote = useMemo(() => {
    if (!selected) return null;
    const interest = amount * (Number(selected.interestRate) / 100) * (term / 12),
      fee = amount * (Number(selected.processingFee || 0) / 100),
      total = amount + interest + fee;
    return { interest, fee, total, monthly: term ? total / term : 0 };
  }, [selected, amount, term]);
  function choose(p: Product) {
    setSelected(p);
    setAmount(Number(p.minAmount));
    setTerm(p.minTerm);
    setPurposeCategory('');
    setPurpose('');
    setRepaymentSource('');
    setExistingMonthlyDebt(0);
    setDeclarationAccepted(false);
    setRequestId(crypto.randomUUID());
    setStep(1);
    setMessage('');
  }
  function cancelApplication() {
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      /* Optional draft storage. */
    }
    setSelected(null);
    setStep(1);
    setMessage('');
  }
  async function apply(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ message: string; data: { applicationNumber: string } }>(
        '/loans/applications',
        {
          method: 'POST',
          body: JSON.stringify({
            productId: selected?.id,
            amount,
            term,
            purposeCategory,
            purpose,
            repaymentSource,
            existingMonthlyDebt,
            declarationAccepted,
            requestId,
          }),
        },
      );
      setMessage(`${r.message}. Your reference is ${r.data.applicationNumber}.`);
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        /* Optional draft storage. */
      }
      setSelected(null);
      const moved = await router.push('/dashboard#application-progress');
      if (!moved)
        setMessage(
          `${r.message}. Your reference is ${r.data.applicationNumber}. Open Track application to follow the review.`,
        );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await router.push({ pathname: '/login', query: { next: '/loans' } });
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Application failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Layout
      title="Compare Online Loans in Kenya | PataPesa"
      description="Compare online loan amounts, repayment periods, estimated interest and fees available through PataPesa in Kenya."
    >
      <header className="max-w-3xl border-b border-pata-900/15 pb-9">
        <p className="eyebrow">Loan products</p>
        <h1 className="section-heading mt-3">Compare the full cost before you apply.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Every product shows its annual rate, fee and repayment window. Your final offer remains
          subject to identity and affordability checks.
        </p>
      </header>

      {message && (
        <p
          role="alert"
          className={`notice mt-8 ${
            message.includes('reference') ? 'notice-success' : 'notice-error'
          }`}
        >
          {message}
        </p>
      )}
      {!selected && (
        <div className="product-list">
          {loadingProducts
            ? [1, 2, 3].map((x) => <div key={x} className="skeleton my-3 h-32" />)
            : products.map((p) => (
                <article key={p.id} className="product-row">
                  <div>
                    <h2 className="text-2xl font-bold text-pata-900">{p.name}</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      {p.description}
                    </p>
                  </div>
                  <div>
                    <small className="text-slate-500">Available amount</small>
                    <strong className="mt-1 block text-sm">
                      KES {Number(p.minAmount).toLocaleString()}–
                      {Number(p.maxAmount).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <small className="text-slate-500">Cost and period</small>
                    <strong className="mt-1 block text-sm">
                      {p.interestRate}% p.a. · {p.processingFee || 0}% fee
                    </strong>
                    <span className="text-sm text-slate-500">
                      {p.minTerm}–{p.maxTerm} months
                    </span>
                  </div>
                  <button onClick={() => choose(p)} className="button button-primary button-small">
                    Calculate
                  </button>
                </article>
              ))}
        </div>
      )}
      {selected && (
        <div className="application-layout">
          <form onSubmit={apply} className="application-form">
            <div className="application-form-heading flex items-start justify-between border-b border-pata-900/10 px-7 py-6">
              <div>
                <p className="eyebrow">Step {step} of 2</p>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  id="application-title"
                  className="mt-2 text-2xl font-bold text-pata-900"
                >
                  {step === 1
                    ? `Your ${selected.name.toLowerCase()} application`
                    : 'Check your application'}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Back to loan options"
                onClick={cancelApplication}
                className="button button-secondary button-small"
              >
                Back
              </button>
            </div>
            <div className="h-1 bg-slate-200">
              <div
                className="h-full bg-copper transition-all"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
            {step === 1 ? (
              <div className="space-y-6 p-7">
                <label className="field">
                  <span>Amount</span>
                  <input
                    type="number"
                    min={selected.minAmount}
                    max={selected.maxAmount}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                  />
                  <small className="helper">
                    Between {kes(Number(selected.minAmount))} and {kes(Number(selected.maxAmount))}
                  </small>
                </label>
                <label className="field">
                  <span>Repayment period</span>
                  <input
                    type="number"
                    min={selected.minTerm}
                    max={selected.maxTerm}
                    value={term}
                    onChange={(e) => setTerm(Number(e.target.value))}
                    required
                  />
                  <small className="helper">
                    Between {selected.minTerm} and {selected.maxTerm} months
                  </small>
                </label>
                <label className="field">
                  <span>Purpose category</span>
                  <select
                    value={purposeCategory}
                    onChange={(e) => setPurposeCategory(e.target.value)}
                    required
                  >
                    <option value="">Choose a category</option>
                    <option value="EMERGENCY">Emergency expense</option>
                    <option value="MEDICAL">Medical expense</option>
                    <option value="EDUCATION">Education</option>
                    <option value="BUSINESS">Business</option>
                    <option value="HOME">Home improvement</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="AGRICULTURE">Agriculture</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="field">
                  <span>Purpose of the loan</span>
                  <textarea
                    minLength={20}
                    maxLength={255}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Briefly explain what the funds will be used for"
                    required
                  />
                  <small className="helper">Give enough detail for a responsible review.</small>
                </label>
                <label className="field">
                  <span>How will you repay this loan?</span>
                  <input
                    minLength={3}
                    maxLength={160}
                    value={repaymentSource}
                    onChange={(e) => setRepaymentSource(e.target.value)}
                    placeholder="For example, monthly employment salary"
                    required
                  />
                </label>
                <label className="field">
                  <span>Current monthly loan repayments</span>
                  <input
                    type="number"
                    min="0"
                    max="10000000"
                    step="1"
                    value={existingMonthlyDebt}
                    onChange={(e) => setExistingMonthlyDebt(Number(e.target.value))}
                    required
                  />
                  <small className="helper">
                    Enter 0 if you have no other monthly loan payments.
                  </small>
                </label>
              </div>
            ) : (
              <div className="p-7">
                <dl className="divide-y divide-pata-900/10 border-y border-pata-900/10">
                  {[
                    ['Loan amount', kes(amount)],
                    ['Repayment period', `${term} months`],
                    ['Annual flat interest rate', `${selected.interestRate}% (not APR)`],
                    ['Estimated interest', kes(quote?.interest || 0)],
                    ['Processing fee', kes(quote?.fee || 0)],
                    ['Estimated monthly payment', kes(quote?.monthly || 0)],
                    ['Existing monthly loan payments', kes(existingMonthlyDebt)],
                    ['Total repayment', kes(quote?.total || 0)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-3 text-sm">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 bg-pata-50 p-4 text-sm leading-6">
                  <strong>{purposeCategory.replace(/_/g, ' ')} purpose</strong>
                  <p className="mt-1 text-slate-600">{purpose}</p>
                  <p className="mt-3 text-slate-600">
                    <strong>Repayment source:</strong> {repaymentSource}
                  </p>
                </div>
                <p className="mt-5 text-xs leading-5 text-slate-500">
                  Submitting does not guarantee approval. PataPesa will review your identity and
                  eligibility first.
                </p>
                <label className="mt-5 flex gap-3 text-sm leading-6 text-slate-600">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    required
                    className="mt-1 h-4 w-4 accent-[#176b55]"
                  />
                  <span>
                    I confirm that the amount, purpose, repayment source and existing debt
                    information are complete and accurate.
                  </span>
                </label>
              </div>
            )}
            <div className="flex gap-3 border-t border-pata-900/10 px-7 py-5">
              <button
                type="button"
                onClick={() => (step === 1 ? cancelApplication() : setStep(1))}
                className="button button-secondary flex-1"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              <button disabled={loading} className="button button-primary flex-1">
                {loading ? 'Submitting…' : step === 1 ? 'Review costs' : 'Submit application'}
              </button>
            </div>
            <p className="m-0 border-t border-pata-900/10 px-7 py-3 text-center text-xs text-slate-500">
              Drafts are saved in this tab when browser storage is available.
            </p>
          </form>
          <aside className="application-aside">
            <p className="eyebrow">Cost at a glance</p>
            <h3>{selected.name}</h3>
            <dl className="cost-breakdown">
              <div>
                <dt>Monthly estimate</dt>
                <dd>{kes(quote?.monthly || 0)}</dd>
              </div>
              <div>
                <dt>Interest</dt>
                <dd>{kes(quote?.interest || 0)}</dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd>{kes(quote?.fee || 0)}</dd>
              </div>
              <div className="cost-total">
                <dt>Total repayment</dt>
                <dd>{kes(quote?.total || 0)}</dd>
              </div>
            </dl>
            <p>
              This application is a request for review. It is not a binding loan agreement or a
              promise of approval.
            </p>
            <p>
              Need an account? Your application draft stays in this browser tab while you register.
            </p>
            <Link href="/register?next=loans">Create an account →</Link>
            <br />
            <Link href="/login?next=%2Floans">Sign in →</Link>
          </aside>
        </div>
      )}
    </Layout>
  );
}
