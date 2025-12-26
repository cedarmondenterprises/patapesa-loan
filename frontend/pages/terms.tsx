import React from 'react';
import Layout from '../components/Layout';
import { FileText, AlertCircle } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <Layout title="Terms of Service - Patapesa Loan" description="Patapesa Loan Terms of Service and User Agreement">
      <div className="py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600">Last updated: December 26, 2025</p>
        </section>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Important Notice</h3>
              <p className="text-gray-700 text-sm">
                Please read these Terms of Service carefully before using Patapesa Loan 
                services. By accessing or using our services, you agree to be bound by 
                these terms.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 max-w-4xl mx-auto">
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms of Service constitute a legally binding agreement between you 
                and Patapesa Loan ("Company", "we", "us", or "our") concerning your access 
                to and use of our website, mobile application, and services (collectively, 
                the "Services").
              </p>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using our Services, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms. If you do not agree with 
                any part of these Terms, you must not use our Services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use our Services, you must:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Be at least 18 years of age</li>
                <li>Be a resident or citizen of Kenya</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using our Services under any applicable laws</li>
                <li>Provide accurate, current, and complete information during registration</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you create an account with us, you must provide accurate and complete 
                information. You are responsible for maintaining the confidentiality of your 
                account credentials and for all activities that occur under your account.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Use a strong, unique password for your account</li>
                <li>Not share your account credentials with others</li>
                <li>Keep your contact information up to date</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Loan Services</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Loan Application</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                By submitting a loan application, you authorize us to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Verify your identity and creditworthiness</li>
                <li>Access your credit information from credit reference bureaus</li>
                <li>Contact you regarding your application</li>
                <li>Make lending decisions based on our assessment criteria</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Loan Agreement</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If your loan application is approved, you will receive a loan agreement 
                detailing the loan amount, interest rate, repayment schedule, fees, and 
                other terms. You must review and accept the loan agreement before funds 
                are disbursed.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Repayment</h3>
              <p className="text-gray-700 leading-relaxed">
                You agree to repay your loan according to the terms specified in your loan 
                agreement. Failure to make timely payments may result in late fees, negative 
                credit reporting, and collection activities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Fees and Charges</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our services may involve various fees and charges, including but not limited 
                to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Interest charges as specified in your loan agreement</li>
                <li>Late payment fees</li>
                <li>Processing fees</li>
                <li>Other charges as disclosed in your loan agreement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Activities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide false, inaccurate, or misleading information</li>
                <li>Use our Services for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt our Services</li>
                <li>Use automated means to access our Services without permission</li>
                <li>Engage in any form of fraud or deception</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content, features, and functionality of our Services, including but not 
                limited to text, graphics, logos, and software, are owned by Patapesa Loan 
                and are protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, Patapesa Loan shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages 
                arising out of or relating to your use of our Services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate your account and access to our 
                Services at any time, with or without notice, for any reason, including 
                violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you 
                of any material changes by posting the new Terms on our website and updating 
                the "Last updated" date. Your continued use of our Services after such 
                changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws 
                of Kenya, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@patapesaloan.co.ke<br />
                  <strong>Phone:</strong> +254 700 000 000<br />
                  <strong>Address:</strong> Kilimani Road, Nairobi, Kenya
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            By using our services, you acknowledge that you have read and understood our Terms of Service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/privacy"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              View Privacy Policy
            </a>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <a
              href="/contact"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
