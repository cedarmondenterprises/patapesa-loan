import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/terms.module.css';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - Patapesa Loan</title>
        <meta name="description" content="Terms of Service for Patapesa Loan" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.container}>
        <div className={styles.content}>
          <h1>Terms of Service</h1>
          <p className={styles.lastUpdated}>Last updated: December 26, 2025</p>

          <section className={styles.section}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Patapesa Loan platform (&quot;Service&quot;), you accept and agree to be bound
              by the terms and provision of this agreement. If you do not agree to abide by the above, please do not
              use this service.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on
              Patapesa Loan for personal, non-commercial transitory viewing only. This is the grant of a license,
              not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>
                Attempting to decompile, reverse engineer, disassemble, or otherwise discovering source code or
                algorithms
              </li>
              <li>Transferring the materials to another person or &quot;mirroring&quot; the materials on any other server</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>
                Transferring the materials to another person or &quot;mirroring&quot; the materials on any other server
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Disclaimer</h2>
            <p>
              The materials on Patapesa Loan are provided on an &apos;as is&apos; basis. Patapesa makes no warranties,
              expressed or implied, and hereby disclaims and negates all other warranties including, without limitation,
              implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement
              of intellectual property or other violation of rights.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Limitations</h2>
            <p>
              In no event shall Patapesa or its suppliers be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability
              to use the materials on Patapesa Loan, even if Patapesa or an authorized representative has been notified
              orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Patapesa Loan could include technical, typographical, or photographic errors.
              Patapesa does not warrant that any of the materials on Patapesa Loan are accurate, complete, or current.
              Patapesa may make changes to the materials contained on Patapesa Loan at any time without notice.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Links</h2>
            <p>
              Patapesa has not reviewed all of the sites linked to its website and is not responsible for the contents
              of any such linked site. The inclusion of any link does not imply endorsement by Patapesa of the site. Use
              of any such linked website is at the user&apos;s own risk.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Modifications</h2>
            <p>
              Patapesa may revise these terms of service for Patapesa Loan at any time without notice. By using this
              website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction
              in which Patapesa operates, and you irrevocably submit to the exclusive jurisdiction of the courts located
              in that location.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current
              at all times. Failure to do so constitutes a breach of the Terms. You are responsible for safeguarding the
              password that you use to access the Service and for all activities that occur under your account.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Loan Terms</h2>
            <p>
              All loan terms, conditions, interest rates, and repayment schedules are provided at the time of loan
              application. By accepting a loan offer, you agree to the specific terms outlined in your loan agreement.
              Patapesa reserves the right to modify rates and terms with appropriate notice as permitted by law.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Payment and Repayment</h2>
            <p>
              You agree to repay any loan issued according to the payment schedule provided. Late payments may result
              in additional fees and interest as specified in your loan agreement. Patapesa reserves the right to take
              appropriate action for non-payment.
            </p>
          </section>

          <section className={styles.section}>
            <h2>12. Privacy</h2>
            <p>
              Your use of Patapesa Loan is also governed by our Privacy Policy. Please review our Privacy Policy to
              understand our practices regarding the collection and use of your information.
            </p>
          </section>

          <section className={styles.section}>
            <h2>13. Prohibited Activities</h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul>
              <li>Violating any applicable law or regulation</li>
              <li>Infringing upon any intellectual property rights</li>
              <li>Submitting false or misleading information</li>
              <li>Attempting to gain unauthorized access to the Service</li>
              <li>Harassing or causing harm to others</li>
              <li>Engaging in any form of fraud or deception</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>14. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p>
              Patapesa Loan<br />
              Email: support@patapesa.com<br />
              Website: www.patapesa.com
            </p>
          </section>

          <section className={styles.footer}>
            <Link href="/">Back to Home</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </section>
        </div>
      </main>
    </>
  );
}
