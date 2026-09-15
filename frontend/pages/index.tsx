import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import AdSlot from '../components/AdSlot';
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
    use: 'Unexpected essential expenses',
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
    use: 'Planned household or personal costs',
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
    use: 'Stock, tools or working capital',
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
      .catch(() => undefined);
  }, []);

  function chooseProduct(id: string) {
    const next = products.find((item) => item.id === id) || products[1];
    setProductId(id);
    setAmount(Math.max(next.min, Math.min(amount, next.max)));
    setMonths(Math.max(next.minTerm, Math.min(months, next.maxTerm)));
  }

  const quote = useMemo(() => {
    const interest = amount * (product.rate / 100) * (months / 12);
    const fee = amount * (product.fee / 100);
    const total = amount + interest + fee;
    return { interest, fee, total, monthly: total / months };
  }, [amount, months, product]);

  return (
    <Layout
      title="Mobile Loans in Kenya | PataPesa"
      description="Compare mobile loans in Kenya, calculate estimated interest and fees, and apply online through PataPesa."
    >
      <section className="service-intro">
        <div>
          <span className="page-kicker">PataPesa loans</span>
          <h1>Mobile loans in Kenya, with every cost shown first.</h1>
        </div>
        <p>
          Set an amount and repayment period. The estimate updates immediately and shows each cost
          separately.
        </p>
      </section>

      <section className="loan-workspace" aria-labelledby="calculator-title">
        <div className="workspace-main">
          <div className="workspace-heading">
            <div>
              <span className="section-number">01</span>
              <h2 id="calculator-title">Build an estimate</h2>
            </div>
            <Link href="/login">Existing customer sign in</Link>
          </div>

          <fieldset className="product-choice">
            <legend>Loan type</legend>
            <div>
              {products.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === productId}
                  onClick={() => chooseProduct(item.id)}
                >
                  <strong>{item.name}</strong>
                  <small>{item.use}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="calculator-fields">
            <label className="calculator-field">
              <span>
                <b>Loan amount</b>
                <output>{money(amount)}</output>
              </span>
              <input
                aria-label="Loan amount"
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
            <label className="calculator-field">
              <span>
                <b>Repayment period</b>
                <output>
                  {months} month{months === 1 ? '' : 's'}
                </output>
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
          </div>
        </div>

        <aside className="loan-receipt" aria-live="polite">
          <div className="receipt-heading">
            <span>Estimate</span>
            <small>{product.name} loan</small>
          </div>
          <div className="receipt-primary">
            <small>Monthly repayment</small>
            <strong>{money(quote.monthly)}</strong>
            <span>
              for {months} month{months === 1 ? '' : 's'}
            </span>
          </div>
          <dl>
            <div>
              <dt>Amount borrowed</dt>
              <dd>{money(amount)}</dd>
            </div>
            <div>
              <dt>Interest ({product.rate}% p.a.)</dt>
              <dd>{money(quote.interest)}</dd>
            </div>
            <div>
              <dt>Processing fee ({product.fee}%)</dt>
              <dd>{money(quote.fee)}</dd>
            </div>
            <div className="receipt-total">
              <dt>Total repayment</dt>
              <dd>{money(quote.total)}</dd>
            </div>
          </dl>
          <Link href="/register" className="button button-primary receipt-action">
            Start application
          </Link>
          <p>
            This is an estimate, not an approval. Your final offer may change after identity and
            affordability checks.
          </p>
        </aside>
      </section>

      <section className="application-facts">
        <div className="facts-heading">
          <span className="section-number">02</span>
          <h2>Before you start</h2>
        </div>
        <div className="facts-list">
          <div>
            <strong>Age</strong>
            <span>You must be 18 or older. Your date of birth is checked during registration.</span>
          </div>
          <div>
            <strong>Contact</strong>
            <span>Use a Kenyan mobile number and an email address you can access.</span>
          </div>
          <div>
            <strong>Affordability</strong>
            <span>Have your income, employment and existing monthly commitments ready.</span>
          </div>
          <div>
            <strong>Identity</strong>
            <span>You will be asked for accurate personal and identification details.</span>
          </div>
        </div>
      </section>

      <section className="plain-process">
        <div>
          <span className="section-number">03</span>
          <h2>What happens next</h2>
        </div>
        <ol>
          <li>
            <b>Register</b>
            <span>Complete your personal, work and income profile.</span>
          </li>
          <li>
            <b>Apply</b>
            <span>Choose a loan and submit the required information.</span>
          </li>
          <li>
            <b>Track</b>
            <span>See the review status and decision in your account.</span>
          </li>
        </ol>
      </section>

      <AdSlot slot="HOME_BELOW_PLANNER" />

      <section className="service-help">
        <div>
          <strong>Need help before applying?</strong>
          <span>Read the common questions or contact the support team.</span>
        </div>
        <div>
          <Link href="/faq">Help centre</Link>
          <Link href="/contact">Contact support</Link>
        </div>
      </section>
    </Layout>
  );
}
