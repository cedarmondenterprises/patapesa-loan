import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

const products = [
  { name: 'Emergency', amount: 'KES 1,000 – 50,000', term: '1–6 months', rate: '18% p.a.' },
  { name: 'Personal', amount: 'KES 10,000 – 500,000', term: '3–24 months', rate: '15% p.a.' },
  { name: 'Business', amount: 'KES 50,000 – 1,000,000', term: '6–36 months', rate: '12% p.a.' },
];

const format = (value: number) => `KES ${Math.round(value).toLocaleString('en-KE')}`;

export default function Home() {
  const [amount, setAmount] = useState(50000);
  const [months, setMonths] = useState(12);
  const interest = amount * 0.15 * (months / 12);
  const fee = amount * 0.025;
  const total = amount + interest + fee;

  return (
    <Layout
      title="PataPesa | Credit, explained clearly"
      description="Compare transparent loan costs, apply securely and follow your application from one account."
    >
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">A clearer way to borrow</p>
          <h1 className="display">
            A loan should make sense <em>before</em> you take it.
          </h1>
          <p className="hero-lede">
            See the amount, the fees and the full repayment in one place. Apply once, then follow
            the decision from your account.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="button button-primary">
              Check your options
            </Link>
            <Link href="/loans" className="button button-secondary">
              Compare products
            </Link>
          </div>
          <div className="trust-line">
            <span>Amounts in Kenyan shillings</span>
            <span>Identity details protected</span>
            <span>Decisions reviewed by people</span>
          </div>
        </div>
        <div className="loan-desk">
          <div className="loan-desk-head">
            <div>
              <p className="eyebrow">Your estimate</p>
              <h2>Personal loan example</h2>
            </div>
            <span className="currency-tag">KES</span>
          </div>
          <label className="quote-control">
            <span>How much do you need?</span>
            <strong>{format(amount)}</strong>
            <input
              aria-label="Loan amount"
              className="quote-range"
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </label>
          <label className="quote-control">
            <span>How long to repay?</span>
            <strong>{months} months</strong>
            <input
              aria-label="Repayment period"
              className="quote-range"
              type="range"
              min="3"
              max="24"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            />
          </label>
          <dl className="quote-breakdown">
            <div>
              <dt>Interest at 15% p.a.</dt>
              <dd>{format(interest)}</dd>
            </div>
            <div>
              <dt>Processing fee at 2.5%</dt>
              <dd>{format(fee)}</dd>
            </div>
            <div className="quote-total-row">
              <dt>Estimated monthly payment</dt>
              <dd>{format(total / months)}</dd>
            </div>
          </dl>
          <div className="quote-total">
            <span>Total repayment</span>
            <strong>{format(total)}</strong>
          </div>
          <p className="quote-note">
            Illustration only. Your offer depends on eligibility and assessment. No approval is
            guaranteed.
          </p>
        </div>
      </section>

      <section className="products-section">
        <div className="section-intro-row">
          <div>
            <p className="eyebrow">Three straightforward options</p>
            <h2 className="section-heading">Start with the purpose, not the maximum.</h2>
          </div>
          <Link href="/loans" className="text-sm font-bold text-pata-800">
            Full product details →
          </Link>
        </div>
        <div className="product-ledger">
          {products.map((p, i) => (
            <article key={p.name} className="product-row">
              <span className="product-number">0{i + 1}</span>
              <h3>{p.name}</h3>
              <p>{p.amount}</p>
              <small>
                {p.term} · {p.rate}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section">
        <div>
          <p className="eyebrow">Application process</p>
          <h2 className="section-heading">Four steps. No mystery stage.</h2>
        </div>
        <ol className="process-list">
          {[
            'Create an account for review',
            'Verify your identity securely',
            'Select an amount and repayment period',
            'Follow the decision from your dashboard',
          ].map((item, i) => (
            <li key={item}>
              <span>0{i + 1}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </section>
    </Layout>
  );
}
