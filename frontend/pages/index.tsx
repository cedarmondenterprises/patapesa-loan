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
      <section className="grid min-h-[560px] items-center gap-16 border-b border-pata-900/10 pb-16 pt-5 lg:grid-cols-[1.08fr_.92fr]">
        <div>
          <p className="eyebrow">Credit built around clarity</p>
          <h1 className="display mt-5 max-w-3xl text-[3.5rem] text-pata-950 sm:text-[4.7rem]">
            Know the cost.
            <br />
            Then decide.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
            Compare repayment costs before applying. Submit your details securely and follow every
            review step from your account.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register" className="button button-primary">
              Start an application
            </Link>
            <Link href="/loans" className="button button-secondary">
              Compare products
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-pata-900/10 pt-6 text-sm text-slate-600">
            <span>
              <strong className="text-pata-900">Clear</strong> rates and fees
            </span>
            <span>
              <strong className="text-pata-900">Secure</strong> identity review
            </span>
            <span>
              <strong className="text-pata-900">Human</strong> decisions
            </span>
          </div>
        </div>
        <div className="bg-pata-900 p-7 text-white shadow-quiet sm:p-9">
          <div className="flex items-start justify-between border-b border-white/15 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#d7a16f]">
                Estimate your repayment
              </p>
              <h2 className="mt-2 text-2xl font-bold">Personal loan example</h2>
            </div>
            <span className="text-xs text-white/60">KES</span>
          </div>
          <label className="mt-7 block text-sm font-semibold">
            Amount <strong className="float-right text-lg">{format(amount)}</strong>
            <input
              aria-label="Loan amount"
              className="mt-4 w-full accent-[#d7a16f]"
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </label>
          <label className="mt-7 block text-sm font-semibold">
            Repayment period <strong className="float-right text-lg">{months} months</strong>
            <input
              aria-label="Repayment period"
              className="mt-4 w-full accent-[#d7a16f]"
              type="range"
              min="3"
              max="24"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            />
          </label>
          <dl className="mt-8 divide-y divide-white/10 border-y border-white/10 text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-white/65">Interest at 15% p.a.</dt>
              <dd>{format(interest)}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-white/65">Processing fee at 2.5%</dt>
              <dd>{format(fee)}</dd>
            </div>
            <div className="flex justify-between py-4 text-base font-bold">
              <dt>Estimated monthly payment</dt>
              <dd>{format(total / months)}</dd>
            </div>
          </dl>
          <div className="mt-6 flex items-end justify-between">
            <span className="text-sm text-white/65">Total repayment</span>
            <strong className="text-3xl">{format(total)}</strong>
          </div>
          <p className="mt-5 text-xs leading-5 text-white/55">
            Illustration only. Your offer depends on eligibility and assessment. No approval is
            guaranteed.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Three straightforward options</p>
            <h2 className="section-heading mt-3">Choose credit that fits the purpose.</h2>
          </div>
          <Link href="/loans" className="text-sm font-bold text-pata-800">
            Full product details →
          </Link>
        </div>
        <div className="mt-10 grid border-y border-pata-900/15 md:grid-cols-3">
          {products.map((p, i) => (
            <article
              key={p.name}
              className={`py-8 md:px-8 ${i ? 'border-t border-pata-900/15 md:border-l md:border-t-0' : ''}`}
            >
              <span className="text-xs font-bold text-copper">0{i + 1}</span>
              <h3 className="mt-4 text-2xl font-bold text-pata-900">{p.name}</h3>
              <p className="mt-7 text-xl font-semibold">{p.amount}</p>
              <p className="mt-2 text-sm text-slate-500">
                {p.term} · {p.rate}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-12 bg-[#ebe6da] px-7 py-14 sm:px-12 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Application process</p>
          <h2 className="section-heading mt-3">Four steps, with no hidden stage.</h2>
        </div>
        <ol className="divide-y divide-pata-900/15">
          {[
            'Create an account for review',
            'Verify your identity securely',
            'Select an amount and repayment period',
            'Follow the decision from your dashboard',
          ].map((item, i) => (
            <li key={item} className="flex gap-6 py-5 first:pt-0 last:pb-0">
              <span className="font-mono text-sm text-copper">0{i + 1}</span>
              <p className="font-semibold text-pata-950">{item}</p>
            </li>
          ))}
        </ol>
      </section>
    </Layout>
  );
}
