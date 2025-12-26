'use client';

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Patapesa Loan</title>
        <meta name="description" content="Privacy policy for Patapesa Loan application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-600 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-blue-100">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Patapesa Loan (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Company&quot;) operates the Patapesa Loan application and website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
            </section>

            {/* Information Collection */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2.1 Personal Information</h3>
                  <p className="text-gray-700 mb-2">We collect information that you provide directly to us, such as:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>Full name, email address, and phone number</li>
                    <li>Date of birth and national identification number</li>
                    <li>Address and employment information</li>
                    <li>Financial information including bank account details</li>
                    <li>Loan application details and personal financial history</li>
                    <li>Payment and transaction history</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2.2 Usage Data</h3>
                  <p className="text-gray-700 mb-2">We automatically collect certain information about your interactions with our Service:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>IP address and browser type</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Device information and operating system</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2.3 Third-Party Data</h3>
                  <p className="text-gray-700">
                    We may receive information about you from third parties including credit bureaus, financial institutions, and identity verification services to verify your identity and assess creditworthiness.
                  </p>
                </div>
              </div>
            </section>

            {/* Use of Data */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Use of Data</h2>
              <p className="text-gray-700 mb-3">Patapesa Loan uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
                <li>To provide and maintain our Service</li>
                <li>To process loan applications and verify your identity</li>
                <li>To manage your account and send administrative information</li>
                <li>To send marketing and promotional communications (with your consent)</li>
                <li>To analyze usage patterns and improve our Service</li>
                <li>To comply with legal obligations and prevent fraud</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To detect and address technical or security issues</li>
              </ul>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Security of Data</h2>
              <p className="text-gray-700 leading-relaxed">
                The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security. We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2 mt-3">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security audits and assessments</li>
                <li>Restricted access to personal information</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                Patapesa Loan will retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations. Data will be securely deleted or anonymized when no longer needed, except where longer retention is required by law.
              </p>
            </section>

            {/* Sharing of Data */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Sharing of Data</h2>
              <div className="space-y-3 text-gray-700">
                <p>We may share your information with:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Financial institutions and payment processors</li>
                  <li>Credit reporting agencies</li>
                  <li>Fraud prevention services</li>
                  <li>Legal authorities when required by law</li>
                  <li>Service providers who assist us in operating our platform</li>
                </ul>
                <p className="mt-3">
                  We do not sell your personal information to third parties for marketing purposes without your explicit consent.
                </p>
              </div>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
                <li>Access your personal data and know what we collect about you</li>
                <li>Request correction of inaccurate or incomplete data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Request a copy of your data in a portable format</li>
                <li>Lodge a complaint with relevant data protection authorities</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Our Service uses cookies and similar tracking technologies to enhance your experience. Cookies are small files stored on your device that help us remember your preferences and understand how you use our Service. You can control cookie settings through your browser, though some features may not work properly if cookies are disabled.
              </p>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Links</h2>
              <p className="text-gray-700 leading-relaxed">
                Our Service may contain links to external websites not operated by us. This Privacy Policy does not apply to third-party websites, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party sites before providing your information.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date above. Your continued use of the Service following the posting of revised Privacy Policy means that you accept and agree to the changes.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-gray-100 p-4 rounded-md text-gray-700 space-y-2">
                <p><strong>Email:</strong> privacy@patapesa-loan.com</p>
                <p><strong>Address:</strong> Patapesa Loan Support Center</p>
                <p><strong>Phone:</strong> 1-800-PATAPESA</p>
              </div>
            </section>

            {/* Footer Navigation */}
            <div className="border-t pt-8 mt-8 flex gap-4 justify-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                Home
              </Link>
              <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
