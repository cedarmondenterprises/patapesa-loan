import React, { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/faq.module.css';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: 'What is Patapesa Loan?',
      answer:
        'Patapesa Loan is a digital lending platform that provides quick and easy access to loans for individuals and small businesses. Our platform leverages technology to streamline the loan application and approval process.',
    },
    {
      id: 2,
      question: 'How do I apply for a loan?',
      answer:
        'To apply for a loan, simply visit our website, click on "Apply Now," and fill out the application form with your personal and financial information. The process typically takes just a few minutes. Once submitted, our team will review your application and contact you within 24-48 hours.',
    },
    {
      id: 3,
      question: 'What are the eligibility requirements?',
      answer:
        'To be eligible for a Patapesa Loan, you must be at least 18 years old, have a valid ID, a stable source of income, and a working mobile phone number. Additional requirements may apply depending on the loan type and amount requested.',
    },
    {
      id: 4,
      question: 'What is the maximum loan amount I can borrow?',
      answer:
        'The maximum loan amount depends on various factors including your income, credit history, and loan type. Generally, our loans range from KES 1,000 to KES 500,000. You can check your eligible amount by starting an application or contacting our support team.',
    },
    {
      id: 5,
      question: 'How long does the approval process take?',
      answer:
        'Most loan applications are approved within 24-48 hours. Once approved, funds are typically disbursed to your mobile money account or bank account within 1-2 hours. In some cases, approval may be instantaneous.',
    },
    {
      id: 6,
      question: 'What are your interest rates?',
      answer:
        'Our interest rates are competitive and transparent. Rates vary based on the loan amount, duration, and your creditworthiness. The exact rate will be provided to you during the application process before you confirm the loan terms.',
    },
    {
      id: 7,
      question: 'What fees do you charge?',
      answer:
        'We charge a transparent fee structure with no hidden charges. This includes an origination fee and insurance fee, both of which are clearly stated in your loan agreement. The total cost of borrowing will be shown to you before you accept the loan offer.',
    },
    {
      id: 8,
      question: 'Can I repay my loan early?',
      answer:
        'Yes, you can repay your loan early without any penalties. Early repayment can help you save on interest charges. Simply log into your account and select the early repayment option, or contact our support team for assistance.',
    },
    {
      id: 9,
      question: 'What payment methods do you accept?',
      answer:
        'We accept multiple payment methods including mobile money (M-Pesa, Airtel Money, etc.), bank transfers, and card payments. You can choose your preferred payment method during the loan agreement process.',
    },
    {
      id: 10,
      question: 'What happens if I miss a payment?',
      answer:
        'If you miss a payment, we will send you reminder notifications via SMS or email. Late payments may incur additional charges. If you anticipate difficulty making a payment, please contact us as soon as possible to discuss alternative arrangements.',
    },
    {
      id: 11,
      question: 'Is my personal information secure?',
      answer:
        'Yes, we take data security very seriously. All personal and financial information is encrypted and stored securely on our servers. We comply with all relevant data protection regulations and do not share your information with third parties without your consent.',
    },
    {
      id: 12,
      question: 'How do I contact customer support?',
      answer:
        'You can reach our customer support team through multiple channels: email support@patapesa.com, call our hotline 0800-000-000, or use the in-app chat feature available 24/7. We typically respond to inquiries within 2 hours.',
    },
  ];

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <Head>
        <title>Frequently Asked Questions - Patapesa Loan</title>
        <meta name="description" content="Find answers to common questions about Patapesa Loan services" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.container}>
        <div className={styles.header}>
          <h1>Frequently Asked Questions</h1>
          <p className={styles.subtitle}>
            Find answers to common questions about our loan services
          </p>
        </div>

        <div className={styles.faqContainer}>
          {faqItems.map((item) => (
            <div
              key={item.id}
              className={`${styles.faqItem} ${
                expandedId === item.id ? styles.expanded : ''
              }`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => toggleExpanded(item.id)}
                aria-expanded={expandedId === item.id}
                aria-controls={`faq-answer-${item.id}`}
              >
                <span className={styles.questionText}>{item.question}</span>
                <span
                  className={`${styles.toggleIcon} ${
                    expandedId === item.id ? styles.rotated : ''
                  }`}
                >
                  ▼
                </span>
              </button>
              {expandedId === item.id && (
                <div
                  id={`faq-answer-${item.id}`}
                  className={styles.faqAnswer}
                >
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.contactSection}>
          <h2>Didn't find your answer?</h2>
          <p>Contact our support team for more information</p>
          <div className={styles.contactOptions}>
            <a href="mailto:support@patapesa.com" className={styles.contactBtn}>
              Email Us
            </a>
            <a href="tel:+254800000000" className={styles.contactBtn}>
              Call Us
            </a>
            <a href="/contact" className={styles.contactBtn}>
              Contact Form
            </a>
          </div>
        </div>
      </main>
    </>
  );
};

export default FAQ;
