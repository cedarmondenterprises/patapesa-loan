import Link from 'next/link';
import InfoPage from '../components/InfoPage';
const questions = [
  [
    'Is the estimate a loan offer?',
    'No. It illustrates costs using the current product rate and fee. Your final terms depend on identity, eligibility and affordability assessment.',
  ],
  [
    'What does the annual interest rate mean?',
    'The estimator uses annual flat interest: amount borrowed × annual rate × term in years. Processing fees are shown separately. A flat annual rate is not the same as an APR.',
  ],
  [
    'Is approval automatic?',
    'No. Registering or submitting an application does not guarantee approval or disbursement.',
  ],
  [
    'What should I have ready?',
    'Your legal name, Kenyan National ID details, date of birth, mobile number, email address, work and income details, and existing monthly loan commitments. Registration is for adults aged 18 and over.',
  ],
  [
    'Can I check my answers?',
    'Yes. Registration and loan applications include a review step. Use Back or Edit to correct details before submitting.',
  ],
  [
    'Can I return to an unfinished application?',
    'An unfinished draft is saved in this browser tab when browser storage is available. Registration passwords and National ID numbers must be entered again. Closing the tab or clearing browser data can remove the draft.',
  ],
  [
    'Where can I see the decision?',
    'Sign in to your account to see your application reference, current status and any instructions.',
  ],
  [
    'Why is my payment still pending?',
    'A payment reference must be reviewed before it is confirmed against your loan. Check your payment history and contact support if you need help.',
  ],
  [
    'What if I may miss a payment?',
    'Contact support as soon as possible and explain your circumstances. Do not assume that sending a support request changes your repayment schedule.',
  ],
];
export default function Faq() {
  return (
    <InfoPage title="Help with your loan journey">
      <p>Answers about estimates, applications and repayments.</p>
      {questions.map(([question, answer]) => (
        <details className="help-question" key={question}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
      <h2>Still need a hand?</h2>
      <p>Send your question to the support team. Never include your password.</p>
      <Link href="/contact">Contact support →</Link>
    </InfoPage>
  );
}
