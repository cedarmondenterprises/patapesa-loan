import Link from 'next/link';
import InfoPage from '../components/InfoPage';
export default function About() {
  return (
    <InfoPage title="How borrowing with PataPesa works">
      <p>
        From your first estimate to your account, each step has a clear purpose. An estimate or
        application is not a guarantee of approval.
      </p>
      <h2>1. Explore the cost</h2>
      <p>
        Choose a loan product, amount and repayment period. The estimate separates the amount
        borrowed, flat-rate interest, processing fee and total repayment. Annual flat interest is
        not an APR.
      </p>
      <Link href="/#estimate">Use the loan estimator →</Link>
      <h2>2. Create your account</h2>
      <p>
        Provide your identity, contact, work and income details. Registration has four sections,
        followed by a review. You must be at least 18. National ID details and passwords are not
        saved in your browser draft.
      </p>
      <h2>3. Review and submit an application</h2>
      <p>
        Tell us the loan purpose, how you will repay it and your current monthly loan commitments.
        Check the estimated costs and your answers before submitting. You will need to sign in to
        submit.
      </p>
      <h2>4. Follow the review</h2>
      <p>
        Your account shows the application reference and current decision. Staff assess identity,
        eligibility and affordability. If more information is needed, follow the instructions in
        your account.
      </p>
      <h2>5. Manage repayments</h2>
      <p>
        For a disbursed loan, your account shows the balance, repayment schedule and payment
        records. A submitted payment reference is not a confirmed repayment until it has been
        reviewed.
      </p>
      <h2>Need help at any stage?</h2>
      <p>
        Use the support form and keep the reference you receive. If a payment will be difficult,
        contact support to explain your circumstances.
      </p>
      <Link href="/contact">Contact support →</Link>
    </InfoPage>
  );
}
