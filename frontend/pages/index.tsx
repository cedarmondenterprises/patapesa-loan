import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { api } from '../lib/api';

type Product = {
  id: string;
  code: string;
  name: string;
  description: string;
  minAmount: string;
  maxAmount: string;
  minTerm: number;
  maxTerm: number;
  interestRate: string;
  processingFee: string;
};
const money = (value: number) =>
  `KES ${value.toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [amount, setAmount] = useState(50000);
  const [amountText, setAmountText] = useState('50000');
  const [months, setMonths] = useState(12);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const product = products.find((p) => p.id === selectedId);
  useEffect(() => {
    let active = true;
    api<{ data: Product[] }>('/products')
      .then(({ data }) => {
        if (!active) return;
        const available = data.filter(
          (p) =>
            Number(p.minAmount) > 0 &&
            Number(p.maxAmount) >= Number(p.minAmount) &&
            p.minTerm > 0 &&
            p.maxTerm >= p.minTerm &&
            Number.isFinite(Number(p.interestRate)) &&
            Number.isFinite(Number(p.processingFee)),
        );
        if (!available.length) {
          setState('error');
          return;
        }
        const first = available.find((p) => p.code === 'PERSONAL') || available[0];
        setProducts(available);
        setSelectedId(first.id);
        const initialAmount = Math.max(
          Number(first.minAmount),
          Math.min(50000, Number(first.maxAmount)),
        );
        setAmount(initialAmount);
        setAmountText(String(initialAmount));
        setMonths(Math.max(first.minTerm, Math.min(12, first.maxTerm)));
        setState('ready');
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const quote = useMemo(() => {
    if (!product) return null;
    const interest = (((amount * Number(product.interestRate)) / 100) * months) / 12;
    const fee = (amount * Number(product.processingFee)) / 100;
    return {
      interest,
      fee,
      total: amount + interest + fee,
      monthly: (amount + interest + fee) / months,
    };
  }, [amount, months, product]);
  function choose(id: string) {
    const next = products.find((p) => p.id === id);
    if (!next) return;
    setSelectedId(id);
    const nextAmount = Math.max(Number(next.minAmount), Math.min(amount, Number(next.maxAmount)));
    setAmount(nextAmount);
    setAmountText(String(nextAmount));
    setMonths(Math.max(next.minTerm, Math.min(months, next.maxTerm)));
  }
  const amountValid = Boolean(
    product &&
    amountText !== '' &&
    Number(amountText) >= Number(product.minAmount) &&
    Number(amountText) <= Number(product.maxAmount) &&
    Number.isInteger(Number(amountText)),
  );
  return (
    <Layout
      title="PataPesa | Understand your loan before you apply"
      description="Explore loan options in Kenya. See estimated repayments, interest and fees, then review your application with PataPesa."
    >
      <section className="home-hero">
        <div className="hero-story">
          <p className="eyebrow">Simple, transparent loans</p>
          <h1>
            See the full cost.
            <br />
            <em>Then decide.</em>
          </h1>
          <p className="hero-description">
            Choose an amount, see the estimated repayment and apply only when it works for you.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#estimate">
              Check my estimate <span aria-hidden="true">→</span>
            </a>
            <Link className="button button-secondary" href="/login">
              Sign in
            </Link>
          </div>
          <p className="hero-caption">
            No hidden questionnaire. Creating an account takes only the essentials.
          </p>
        </div>
        <div className="home-account-preview" aria-label="Preview of the customer account">
          <div className="home-preview-topline">
            <span className="home-preview-icon" aria-hidden="true">
              ✓
            </span>
            <span>Before you apply</span>
            <span className="home-preview-chip">Clear costs</span>
          </div>
          <div className="home-preview-progress">
            <p className="home-preview-kicker">A straightforward process</p>
            <h2>Amount, total cost and monthly repayment—shown together.</h2>
            <p>We show interest and fees before you create an account or submit an application.</p>
          </div>
          <div className="home-preview-details">
            <div>
              <strong>1. Estimate</strong>
              <span>Adjust amount and term</span>
            </div>
            <div>
              <strong>2. Apply</strong>
              <span>Share only what is needed</span>
            </div>
          </div>
          <p className="home-preview-disclaimer">
            Estimates are not loan offers. Approval follows identity and affordability checks.
          </p>
        </div>
      </section>
      <section id="estimate" className="estimate-section" aria-labelledby="estimate-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Plan before you commit</p>
            <h2 id="estimate-title">What would your loan cost?</h2>
          </div>
          <p>
            Change the amount or term to compare.
            <br />
            This is an estimate, not a loan offer.
          </p>
        </div>
        {state === 'loading' && (
          <div className="estimate-empty" role="status">
            Loading current loan products and rates…
          </div>
        )}
        {state === 'error' && (
          <div className="estimate-empty" role="alert">
            <h3>We can’t load current rates.</h3>
            <p>We’ll show an estimate when current products are available.</p>
            <button
              className="button button-secondary"
              onClick={() => {
                setState('loading');
                setRetry((n) => n + 1);
              }}
            >
              Try again
            </button>
          </div>
        )}
        {state === 'ready' && product && quote && (
          <div className="estimate-layout">
            <div className="estimate-controls">
              <fieldset className="loan-type-options">
                <legend>1. Choose your loan</legend>
                <div>
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={selectedId === p.id}
                      onClick={() => choose(p.id)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="estimate-control">
                <label htmlFor="estimate-amount">2. How much do you need?</label>
                <div className="amount-input">
                  <span>KES</span>
                  <input
                    id="estimate-amount"
                    inputMode="numeric"
                    type="number"
                    min={product.minAmount}
                    max={product.maxAmount}
                    step="1"
                    value={amountText}
                    aria-invalid={!amountValid}
                    aria-describedby="amount-range"
                    onChange={(e) => {
                      setAmountText(e.target.value);
                      const n = Number(e.target.value);
                      if (
                        e.target.value !== '' &&
                        Number.isInteger(n) &&
                        n >= Number(product.minAmount) &&
                        n <= Number(product.maxAmount)
                      )
                        setAmount(n);
                    }}
                  />
                </div>
                <input
                  type="range"
                  aria-label="Adjust loan amount"
                  min={product.minAmount}
                  max={product.maxAmount}
                  step="1"
                  value={amount}
                  onChange={(e) => {
                    setAmount(Number(e.target.value));
                    setAmountText(e.target.value);
                  }}
                />
                <div id="amount-range" className="range-labels">
                  <span>{money(Number(product.minAmount))}</span>
                  <span>{money(Number(product.maxAmount))}</span>
                </div>
              </div>
              <div className="estimate-control">
                <label htmlFor="estimate-term">3. Choose a repayment period</label>
                <select
                  id="estimate-term"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                >
                  {Array.from(
                    { length: product.maxTerm - product.minTerm + 1 },
                    (_, i) => i + product.minTerm,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'month' : 'months'}
                    </option>
                  ))}
                </select>
                <p className="field-explanation">
                  A longer term lowers the monthly estimate, but increases total interest.
                </p>
              </div>
            </div>
            <aside className="estimate-result" aria-label="Loan cost estimate">
              <p className="estimate-tag">Your estimate · {product.name}</p>
              <div className="estimate-monthly" aria-live="polite" aria-atomic="true">
                <span>Estimated monthly repayment</span>
                <strong>{money(quote.monthly)}</strong>
                <small>Over {months} months</small>
              </div>
              <dl className="cost-breakdown">
                <div>
                  <dt>Amount borrowed</dt>
                  <dd>{money(amount)}</dd>
                </div>
                <div>
                  <dt>
                    Interest <small>({product.interestRate}% p.a., flat)</small>
                  </dt>
                  <dd>{money(quote.interest)}</dd>
                </div>
                <div>
                  <dt>
                    Processing fee <small>({product.processingFee}%)</small>
                  </dt>
                  <dd>{money(quote.fee)}</dd>
                </div>
                <div className="cost-total">
                  <dt>Total to repay</dt>
                  <dd>{money(quote.total)}</dd>
                </div>
              </dl>
              {amountValid ? (
                <Link
                  className="button button-primary"
                  href={{
                    pathname: '/loans',
                    query: { product: product.id, amount, term: months },
                  }}
                >
                  Continue with this estimate <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <>
                  <p role="alert" className="notice notice-error">
                    Enter a whole amount within the limits shown.
                  </p>
                  <button disabled className="button button-primary">
                    Continue with this estimate
                  </button>
                </>
              )}
              <p className="estimate-note">
                No application is submitted at this stage. Final terms depend on identity,
                eligibility and affordability review. The annual flat rate is not an APR.
              </p>
            </aside>
          </div>
        )}
      </section>
      <section className="home-support">
        <div>
          <p className="eyebrow">Ready when you are</p>
          <h2>Create an account with only the essentials.</h2>
        </div>
        <div>
          <p>We ask for employment and income details only when you choose to apply.</p>
          <Link href="/register">Create my account →</Link>
          <Link href="/faq">Read common questions →</Link>
        </div>
      </section>
    </Layout>
  );
}
