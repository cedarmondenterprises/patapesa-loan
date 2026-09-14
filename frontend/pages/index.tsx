import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { api } from '../lib/api';

type QuoteProduct = {
  id: string;
  name: string;
  use: string;
  min: number;
  max: number;
  minTerm: number;
  maxTerm: number;
  rate: number;
  fee: number;
};

type ApiProduct = {
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

const productDefaults: QuoteProduct[] = [
  {
    id: 'emergency',
    name: 'Emergency',
    use: 'For an urgent, short-term expense',
    min: 1000,
    max: 50000,
    minTerm: 1,
    maxTerm: 6,
    rate: 18,
    fee: 3,
  },
  {
    id: 'personal',
    name: 'Personal',
    use: 'For planned household and personal needs',
    min: 10000,
    max: 500000,
    minTerm: 3,
    maxTerm: 24,
    rate: 15,
    fee: 2.5,
  },
  {
    id: 'business',
    name: 'Business',
    use: 'For stock, tools and business cash flow',
    min: 50000,
    max: 1000000,
    minTerm: 6,
    maxTerm: 36,
    rate: 12,
    fee: 2,
  },
];

const money = (value: number) => `KES ${Math.round(value).toLocaleString('en-KE')}`;

export default function Home() {
  const [products, setProducts] = useState(productDefaults);
  const [productId, setProductId] = useState('personal');
  const product = products.find((item) => item.id === productId) || products[1];
  const [amount, setAmount] = useState(50000);
  const [months, setMonths] = useState(12);

  useEffect(() => {
    api<{ data: ApiProduct[] }>('/products')
      .then(({ data }) => {
        if (!data.length) return;
        setProducts(
          data.map((item) => ({
            id:
              item.code === 'QUICK_CASH'
                ? 'emergency'
                : item.code === 'PERSONAL'
                  ? 'personal'
                  : item.code === 'BUSINESS'
                    ? 'business'
                    : item.code.toLowerCase(),
            name: item.name.replace(/ loan$/i, ''),
            use: item.description,
            min: Number(item.minAmount),
            max: Number(item.maxAmount),
            minTerm: item.minTerm,
            maxTerm: item.maxTerm,
            rate: Number(item.interestRate),
            fee: Number(item.processingFee || 0),
          })),
        );
      })
      .catch(() => {
        // The safe defaults keep the estimator useful if the API is temporarily unavailable.
      });
  }, []);

  function chooseProduct(id: string) {
    const next = products.find((item) => item.id === id) || products[1];
    setProductId(id);
    setAmount(Math.max(next.min, Math.min(50000, next.max)));
    setMonths(Math.max(next.minTerm, Math.min(12, next.maxTerm)));
  }

  const quote = useMemo(() => {
    const interest = amount * (product.rate / 100) * (months / 12);
    const fee = amount * (product.fee / 100);
    const total = amount + interest + fee;
    return { interest, fee, total, monthly: total / months };
  }, [amount, months, product]);

  return (
    <Layout
      title="PataPesa | Clear loan applications in Kenya"
      description="Choose a loan, see the estimated full cost and apply securely from one PataPesa account."
    >
      <section className="welcome-block">
        <div className="welcome-copy">
          <p className="context-label">Personal, emergency and business loans</p>
          <h1>Know the cost before you apply.</h1>
          <p>
            Choose an amount and repayment period to see a clear estimate. If it works for your
            budget, continue with one secure application.
          </p>
          <div className="welcome-actions">
            <a href="#loan-planner" className="button button-primary">
              Get an estimate
            </a>
            <Link href="/login" className="button button-secondary">
              Sign in to your account
            </Link>
          </div>
        </div>
        <aside className="start-check" aria-label="What you need to apply">
          <p className="start-check-title">Before you start</p>
          <ul>
            <li>
              <span>1</span>
              <p>
                <strong>Be 18 or older</strong>
                <small>Your date of birth is checked during registration.</small>
              </p>
            </li>
            <li>
              <span>2</span>
              <p>
                <strong>Have a Kenyan mobile number</strong>
                <small>We use it to keep your account and application connected.</small>
              </p>
            </li>
            <li>
              <span>3</span>
              <p>
                <strong>Know your income and expenses</strong>
                <small>This helps us assess whether repayments are affordable.</small>
              </p>
            </li>
          </ul>
        </aside>
      </section>

      <section id="loan-planner" className="loan-planner" aria-labelledby="planner-title">
        <div className="planner-heading">
          <div>
            <p className="context-label">Loan estimate</p>
            <h2 id="planner-title">What are you borrowing for?</h2>
          </div>
          <p>Change the figures below. This estimate is not a loan offer or approval.</p>
        </div>

        <div className="product-tabs" role="group" aria-label="Loan type">
          {products.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === productId ? 'selected' : ''}
              aria-pressed={item.id === productId}
              onClick={() => chooseProduct(item.id)}
            >
              <strong>{item.name}</strong>
              <span>{item.use}</span>
            </button>
          ))}
        </div>

        <div className="planner-workspace">
          <div className="planner-controls">
            <label className="planner-control">
              <span>
                <strong>Amount needed</strong>
                <output>{money(amount)}</output>
              </span>
              <input
                aria-label="Amount needed"
                type="range"
                min={product.min}
                max={product.max}
                step={product.id === 'emergency' ? 1000 : 5000}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
              <small>
                <span>{money(product.min)}</span>
                <span>{money(product.max)}</span>
              </small>
            </label>
            <label className="planner-control">
              <span>
                <strong>Repayment period</strong>
                <output>{months} months</output>
              </span>
              <input
                aria-label="Repayment period"
                type="range"
                min={product.minTerm}
                max={product.maxTerm}
                value={months}
                onChange={(event) => setMonths(Number(event.target.value))}
              />
              <small>
                <span>
                  {product.minTerm} month{product.minTerm === 1 ? '' : 's'}
                </span>
                <span>{product.maxTerm} months</span>
              </small>
            </label>
            <div className="planner-guidance">
              <strong>Keep repayments comfortable.</strong>
              <p>
                Include rent, food, transport and existing debt when deciding what you can repay
                each month.
              </p>
            </div>
          </div>

          <aside className="quote-summary" aria-live="polite">
            <p>Your estimated repayment</p>
            <div className="monthly-figure">
              <strong>{money(quote.monthly)}</strong>
              <span>per month</span>
            </div>
            <dl>
              <div>
                <dt>Amount borrowed</dt>
                <dd>{money(amount)}</dd>
              </div>
              <div>
                <dt>Estimated interest ({product.rate}% p.a.)</dt>
                <dd>{money(quote.interest)}</dd>
              </div>
              <div>
                <dt>Processing fee ({product.fee}%)</dt>
                <dd>{money(quote.fee)}</dd>
              </div>
              <div className="total-line">
                <dt>Total estimated repayment</dt>
                <dd>{money(quote.total)}</dd>
              </div>
            </dl>
            <Link href="/register" className="button button-primary">
              Continue to application
            </Link>
            <Link href="/loans" className="quote-details-link">
              See full product details
            </Link>
          </aside>
        </div>
      </section>

      <section className="comparison-section" aria-labelledby="comparison-title">
        <div className="section-copy">
          <p className="context-label">Compare your options</p>
          <h2 id="comparison-title">The important numbers, together.</h2>
          <p>
            Limits and rates vary by product. Eligibility and affordability checks apply to every
            application.
          </p>
        </div>
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Loan</th>
                <th>Amount</th>
                <th>Period</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <th scope="row">
                    <strong>{item.name}</strong>
                    <span>{item.use}</span>
                  </th>
                  <td>
                    {money(item.min)}–{money(item.max).replace('KES ', '')}
                  </td>
                  <td>
                    {item.minTerm}–{item.maxTerm} months
                  </td>
                  <td>
                    {item.rate}% p.a.<small>{item.fee}% processing fee</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="application-guide" aria-labelledby="guide-title">
        <div className="guide-intro">
          <p className="context-label">A clear application</p>
          <h2 id="guide-title">You can see what happens next.</h2>
          <p>
            We ask for the information needed to assess an application. Your dashboard keeps the
            current status and next action in one place.
          </p>
          <Link href="/faq" className="inline-link">
            Read common questions
          </Link>
        </div>
        <ol className="decision-steps">
          <li>
            <span>01</span>
            <div>
              <strong>Create your profile</strong>
              <p>
                Add your identity, work, education and income information. Your progress is saved in
                this browser while you complete the form.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Submit your identity check</strong>
              <p>A verified identity is required before an application can be approved.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Send one complete application</strong>
              <p>
                Choose the amount, period, purpose and repayment source, then review everything
                before submission.
              </p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <strong>Follow the decision</strong>
              <p>See your reference number and application status from your customer dashboard.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-strip">
        <div>
          <p className="context-label">Need an answer first?</p>
          <h2>Borrowing should not begin with a guess.</h2>
        </div>
        <div className="help-actions">
          <Link href="/faq" className="button button-secondary">
            Read the FAQs
          </Link>
          <Link href="/contact" className="inline-link">
            Contact support
          </Link>
        </div>
      </section>
    </Layout>
  );
}
