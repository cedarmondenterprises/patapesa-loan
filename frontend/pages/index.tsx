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
    use: 'For urgent, short-term expenses',
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
    use: 'For stock, tools and working capital',
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
    setAmount(Math.max(next.min, Math.min(50000, next.max)));
    setMonths(Math.max(next.minTerm, Math.min(12, next.maxTerm)));
  }

  const quote = useMemo(() => {
    const interest = amount * (product.rate / 100) * (months / 12);
    const fee = amount * (product.fee / 100);
    const total = amount + interest + fee;
    return { interest, fee, total, monthly: total / months };
  }, [amount, months, product]);

  const overallMin = Math.min(...products.map((item) => item.min));
  const overallMax = Math.max(...products.map((item) => item.max));

  return (
    <Layout
      title="PataPesa | Plan clearly. Apply confidently."
      description="Explore transparent loan estimates, apply securely and track every step from one PataPesa account."
    >
      <section className="money-hero">
        <div className="money-hero-copy">
          <p className="context-label">Built for everyday financial decisions</p>
          <h1>Money for the next step, with the cost shown first.</h1>
          <p className="money-hero-lead">
            Choose what you need, see an honest repayment estimate and continue only when the
            numbers make sense for you.
          </p>
          <div className="money-hero-actions">
            <a href="#quick-estimate" className="button button-primary">
              Check my estimate
            </a>
            <Link href="/login" className="quiet-action">
              I already have an account <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className="confidence-list" aria-label="PataPesa application benefits">
            <li><span aria-hidden="true">✓</span> Full estimated cost before submission</li>
            <li><span aria-hidden="true">✓</span> Progress saved while you complete forms</li>
            <li><span aria-hidden="true">✓</span> One dashboard for decisions and repayments</li>
          </ul>
        </div>

        <aside id="quick-estimate" className="quick-estimate" aria-labelledby="estimate-title">
          <div className="estimate-topline">
            <div>
              <p className="context-label">Quick estimate</p>
              <h2 id="estimate-title">Plan your loan</h2>
            </div>
            <span className="estimate-step">No sign-in needed</span>
          </div>

          <div className="estimate-products" role="group" aria-label="Loan type">
            {products.map((item) => (
              <button
                type="button"
                key={item.id}
                className={item.id === productId ? 'active' : ''}
                aria-pressed={item.id === productId}
                onClick={() => chooseProduct(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>

          <label className="estimate-control">
            <span>
              <small>How much do you need?</small>
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
            <small className="range-limits">
              <span>{money(product.min)}</span>
              <span>{money(product.max)}</span>
            </small>
          </label>

          <label className="estimate-control">
            <span>
              <small>Repayment period</small>
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
            <small className="range-limits">
              <span>{product.minTerm} month{product.minTerm === 1 ? '' : 's'}</span>
              <span>{product.maxTerm} months</span>
            </small>
          </label>

          <div className="estimate-result" aria-live="polite">
            <div>
              <small>Estimated monthly repayment</small>
              <strong>{money(quote.monthly)}</strong>
            </div>
            <dl>
              <div><dt>Interest</dt><dd>{money(quote.interest)}</dd></div>
              <div><dt>Processing fee</dt><dd>{money(quote.fee)}</dd></div>
              <div><dt>Total repayment</dt><dd>{money(quote.total)}</dd></div>
            </dl>
          </div>

          <Link href="/register" className="button button-primary estimate-cta">
            Continue with this plan
          </Link>
          <p className="estimate-disclaimer">
            Estimate only. Approval and final terms depend on identity, eligibility and
            affordability checks.
          </p>
        </aside>
      </section>

      <section className="proof-rail" aria-label="PataPesa overview">
        <div><strong>{products.length}</strong><span>loan options</span></div>
        <div><strong>{money(overallMin)}–{money(overallMax).replace('KES ', '')}</strong><span>available range</span></div>
        <div><strong>100% online</strong><span>application journey</span></div>
        <div><strong>One account</strong><span>from application to repayment</span></div>
      </section>

      <AdSlot slot="HOME_BELOW_PLANNER" />

      <section className="journey-section" aria-labelledby="journey-title">
        <div className="journey-heading">
          <p className="context-label">A shorter path to an answer</p>
          <h2 id="journey-title">Four clear steps. No guessing what comes next.</h2>
          <p>
            Each stage explains why information is needed, saves your progress and leaves you with
            a reference you can track.
          </p>
        </div>
        <ol className="journey-grid">
          <li>
            <span>01</span>
            <h3>Plan</h3>
            <p>Choose an amount and term, then review the estimated total cost.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Create your profile</h3>
            <p>Tell us about your identity, work, income and household circumstances.</p>
          </li>
          <li>
            <span>03</span>
            <h3>Apply</h3>
            <p>Confirm the purpose, repayment source and existing monthly commitments.</p>
          </li>
          <li>
            <span>04</span>
            <h3>Track</h3>
            <p>Follow the review, decision, balance and repayment schedule from your dashboard.</p>
          </li>
        </ol>
      </section>

      <section className="control-section">
        <div className="control-card control-card-dark">
          <p className="context-label">Your account</p>
          <h2>The important information stays together.</h2>
          <p>
            See your latest application, identity-check status, upcoming repayment and confirmed
            payment history without searching through messages.
          </p>
          <Link href="/login" className="button button-light">Open my dashboard</Link>
        </div>
        <div className="control-card">
          <p className="context-label">Before you apply</p>
          <h2>Make sure the repayment fits ordinary life.</h2>
          <ul className="eligibility-list">
            <li><span>1</span><div><strong>Be at least 18</strong><small>Your date of birth is validated.</small></div></li>
            <li><span>2</span><div><strong>Use a Kenyan mobile number</strong><small>Keep your application connected to you.</small></div></li>
            <li><span>3</span><div><strong>Share accurate income and debt</strong><small>Used for a responsible affordability review.</small></div></li>
          </ul>
        </div>
      </section>

      <section className="product-section" aria-labelledby="products-title">
        <div className="product-section-heading">
          <div>
            <p className="context-label">Choose by purpose</p>
            <h2 id="products-title">A product that matches the job.</h2>
          </div>
          <Link href="/loans" className="quiet-action">Compare every detail <span>→</span></Link>
        </div>
        <div className="product-card-grid">
          {products.map((item, index) => (
            <article key={item.id} className="purpose-card">
              <span className="purpose-index">0{index + 1}</span>
              <h3>{item.name}</h3>
              <p>{item.use}</p>
              <dl>
                <div><dt>Amount</dt><dd>{money(item.min)}–{money(item.max).replace('KES ', '')}</dd></div>
                <div><dt>Term</dt><dd>{item.minTerm}–{item.maxTerm} months</dd></div>
                <div><dt>Rate</dt><dd>{item.rate}% p.a.</dd></div>
              </dl>
              <button type="button" onClick={() => { chooseProduct(item.id); document.getElementById('quick-estimate')?.scrollIntoView(); }}>
                Estimate this loan <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="home-help">
        <div>
          <p className="context-label">Questions are part of a good decision</p>
          <h2>Understand the process before sharing your details.</h2>
        </div>
        <div>
          <Link href="/faq" className="button button-primary">Read common questions</Link>
          <Link href="/contact" className="quiet-action">Contact support <span>→</span></Link>
        </div>
      </section>

      <div className="mobile-apply-bar">
        <div><small>Ready to begin?</small><strong>Start securely online</strong></div>
        <Link href="/register" className="button button-primary button-small">Apply now</Link>
      </div>
    </Layout>
  );
}
