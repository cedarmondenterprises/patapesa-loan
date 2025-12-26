import React, { useState } from 'react';
import Layout from '../components/Layout';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      category: 'General',
      question: 'What is Patapesa Loan?',
      answer: 'Patapesa Loan is a digital lending platform that provides fast, secure, and transparent loans to individuals and businesses in Kenya. We offer various loan products with competitive interest rates and flexible repayment terms.',
    },
    {
      category: 'General',
      question: 'How does Patapesa Loan work?',
      answer: 'Simply register for an account, complete your KYC verification, choose a loan product, submit your application, and receive funds directly to your account within minutes of approval. Our automated system makes the entire process quick and seamless.',
    },
    {
      category: 'Application',
      question: 'Who can apply for a loan?',
      answer: 'You must be a Kenyan citizen or resident, aged 18-65 years, have a valid national ID or passport, provide proof of income, and have an active mobile money account.',
    },
    {
      category: 'Application',
      question: 'What documents do I need to apply?',
      answer: 'You need: National ID or Passport, proof of residence (utility bill), bank statements (last 3 months), employment letter or business registration, and KRA PIN certificate.',
    },
    {
      category: 'Application',
      question: 'How long does loan approval take?',
      answer: 'Our automated credit assessment system can approve your loan within minutes. However, some applications may require manual review, which can take up to 24 hours.',
    },
    {
      category: 'Loans',
      question: 'What types of loans do you offer?',
      answer: 'We offer three main products: Quick Cash (KES 1,000-50,000), Personal Loan (KES 10,000-500,000), and Business Loan (KES 50,000-1,000,000), each with different terms and interest rates.',
    },
    {
      category: 'Loans',
      question: 'What are your interest rates?',
      answer: 'Interest rates vary by loan product: Quick Cash at 18% p.a., Personal Loan at 15% p.a., and Business Loan at 12% p.a. The actual rate may vary based on your credit profile.',
    },
    {
      category: 'Loans',
      question: 'Can I repay my loan early?',
      answer: 'Yes, you can repay your loan early without any penalties. Early repayment can help improve your credit score and make you eligible for higher loan amounts in the future.',
    },
    {
      category: 'Repayment',
      question: 'How do I make loan repayments?',
      answer: 'You can make repayments through mobile money (M-Pesa, Airtel Money), bank transfer, or direct debit. We also offer automatic payment options to ensure you never miss a due date.',
    },
    {
      category: 'Repayment',
      question: 'What happens if I miss a payment?',
      answer: 'We understand that financial difficulties can arise. If you anticipate missing a payment, please contact our support team immediately. Late payments may incur fees and affect your credit score.',
    },
    {
      category: 'Repayment',
      question: 'Can I restructure my loan?',
      answer: 'Yes, if you\'re experiencing financial difficulties, you may be eligible for loan restructuring. Contact our support team to discuss your options and work out a feasible repayment plan.',
    },
    {
      category: 'Account',
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page, enter your registered email address, and follow the instructions sent to your email to reset your password.',
    },
    {
      category: 'Account',
      question: 'How can I update my personal information?',
      answer: 'Log in to your account, go to Settings or Profile section, and update your information. Some changes may require verification or supporting documents.',
    },
    {
      category: 'Security',
      question: 'Is my personal information secure?',
      answer: 'Yes, we use bank-level encryption and security measures to protect your data. We comply with all data protection regulations and never share your information with unauthorized third parties.',
    },
    {
      category: 'Security',
      question: 'What if I suspect fraudulent activity?',
      answer: 'If you notice any suspicious activity on your account, immediately contact our support team at +254 700 000 000 or support@patapesaloan.co.ke. Change your password and enable two-factor authentication if available.',
    },
  ];

  const categories = ['all', ...Array.from(new Set(faqs.map((faq) => faq.category)))];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Layout title="FAQ - Patapesa Loan" description="Frequently asked questions about Patapesa Loan services">
      <div className="py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our services, loans, and policies
          </p>
        </section>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">
                No questions found matching your search. Try different keywords or{' '}
                <a href="/contact" className="text-blue-600 hover:underline">
                  contact us
                </a>{' '}
                for assistance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        {faq.category}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">
                        {faq.question}
                      </h3>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {openIndex === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <section className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Our support team is here to help you with any questions or concerns
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Contact Support
            </a>
            <a
              href="/contact-support"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Live Chat
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default FAQ;
