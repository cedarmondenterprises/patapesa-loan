import React from 'react';
import Layout from '../components/Layout';
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <Layout title="Privacy Policy - Patapesa Loan" description="Learn how Patapesa Loan protects your privacy and handles your personal data">
      <div className="py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600">Last updated: December 26, 2025</p>
        </section>

        {/* Important Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Your Privacy Matters</h3>
              <p className="text-gray-700 text-sm">
                At Patapesa Loan, we are committed to protecting your privacy and ensuring 
                the security of your personal information. This Privacy Policy explains how 
                we collect, use, and safeguard your data.
              </p>
            </div>
          </div>
        </div>

        {/* Key Principles */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Security</h3>
            <p className="text-gray-600 text-sm">
              We use bank-level encryption to protect your personal and financial information
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transparency</h3>
            <p className="text-gray-600 text-sm">
              We're clear about what data we collect and how we use it
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Control</h3>
            <p className="text-gray-600 text-sm">
              You have the right to access, correct, or delete your personal data
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 max-w-4xl mx-auto">
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you register or apply for a loan, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Name, date of birth, and contact information</li>
                <li>National ID or passport number</li>
                <li>Employment and income information</li>
                <li>Bank account and mobile money details</li>
                <li>Residential address and proof of residence</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1.2 Financial Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect financial data to assess your creditworthiness:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Credit history and credit scores</li>
                <li>Bank statements and transaction history</li>
                <li>Existing loans and credit obligations</li>
                <li>Income and expense information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1.3 Technical Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you use our Services, we automatically collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Device information (type, OS, browser)</li>
                <li>IP address and location data</li>
                <li>Usage data and interaction with our Services</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Processing and evaluating loan applications</li>
                <li>Verifying your identity and preventing fraud</li>
                <li>Managing your account and providing customer support</li>
                <li>Communicating with you about your loans and our services</li>
                <li>Complying with legal and regulatory requirements</li>
                <li>Improving our Services and user experience</li>
                <li>Marketing our products (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your information with:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Service Providers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Third-party vendors who help us operate our business, such as payment 
                processors, cloud hosting providers, and customer support platforms.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Credit Reference Bureaus</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We share and receive information with credit reference bureaus to assess 
                creditworthiness and report payment behavior.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Legal Requirements</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may disclose information when required by law, court order, or to protect 
                our rights and the safety of our users.
              </p>

              <p className="text-gray-700 leading-relaxed">
                We do not sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>256-bit SSL encryption for data transmission</li>
                <li>Encrypted storage of sensitive information</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection</li>
                <li>Incident response and breach notification procedures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong>Restriction:</strong> Limit how we use your information</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Objection:</strong> Object to certain types of processing</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at privacy@patapesaloan.co.ke
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the 
                purposes outlined in this Privacy Policy, unless a longer retention period is 
                required by law. After your account is closed, we may retain certain information 
                for legal, regulatory, and business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Remember your preferences and settings</li>
                <li>Analyze how you use our Services</li>
                <li>Provide personalized content and advertisements</li>
                <li>Improve security and prevent fraud</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can control cookies through your browser settings, but disabling them 
                may affect your ability to use certain features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Links</h2>
              <p className="text-gray-700 leading-relaxed">
                Our Services may contain links to third-party websites. We are not responsible 
                for the privacy practices of these sites. We encourage you to review their 
                privacy policies before providing any information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our Services are not intended for individuals under 18 years of age. We do 
                not knowingly collect personal information from children. If you believe we 
                have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of 
                any material changes by posting the new policy on our website and updating 
                the "Last updated" date. Your continued use of our Services after such changes 
                constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions or concerns about this Privacy Policy or our data 
                practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Data Protection Officer</strong><br />
                  <strong>Email:</strong> privacy@patapesaloan.co.ke<br />
                  <strong>Phone:</strong> +254 700 000 000<br />
                  <strong>Address:</strong> Kilimani Road, Nairobi, Kenya
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Regulatory Compliance</h2>
              <p className="text-gray-700 leading-relaxed">
                We comply with the Kenya Data Protection Act, 2019, and other applicable data 
                protection laws. We are registered with the Office of the Data Protection 
                Commissioner (ODPC) in Kenya.
              </p>
            </section>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Your trust is important to us. We are committed to protecting your privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/terms"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              View Terms of Service
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

export default Privacy;
