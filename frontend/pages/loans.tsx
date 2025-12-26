import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { CreditCard, Zap, Building2, CheckCircle, TrendingUp, Clock } from 'lucide-react';

const Loans: React.FC = () => {
  const loanProducts = [
    {
      id: 'quick-cash',
      name: 'Quick Cash',
      icon: Zap,
      description: 'Perfect for urgent financial needs',
      amount: 'KES 1,000 - 50,000',
      term: '1 - 6 months',
      interest: '18% p.a.',
      features: [
        'Instant approval within minutes',
        'No collateral required',
        'Flexible repayment options',
        'Quick disbursement',
      ],
      popular: false,
      color: 'blue',
    },
    {
      id: 'personal-loan',
      name: 'Personal Loan',
      icon: CreditCard,
      description: 'For your medium-term needs',
      amount: 'KES 10,000 - 500,000',
      term: '3 - 24 months',
      interest: '15% p.a.',
      features: [
        'Competitive interest rates',
        'Extended repayment period',
        'Higher loan limits',
        'Priority customer support',
      ],
      popular: true,
      color: 'green',
    },
    {
      id: 'business-loan',
      name: 'Business Loan',
      icon: Building2,
      description: 'Grow your business with us',
      amount: 'KES 50,000 - 1,000,000',
      term: '6 - 36 months',
      interest: '12% p.a.',
      features: [
        'Lowest interest rates',
        'Flexible business terms',
        'Dedicated account manager',
        'Business growth resources',
      ],
      popular: false,
      color: 'purple',
    },
  ];

  const getColorClasses = (color: string, type: 'bg' | 'border' | 'text' | 'icon') => {
    const colors = {
      blue: {
        bg: 'bg-blue-500',
        border: 'border-blue-600',
        text: 'text-blue-600',
        icon: 'bg-blue-100 text-blue-600',
      },
      green: {
        bg: 'bg-green-500',
        border: 'border-green-600',
        text: 'text-green-600',
        icon: 'bg-green-100 text-green-600',
      },
      purple: {
        bg: 'bg-purple-500',
        border: 'border-purple-600',
        text: 'text-purple-600',
        icon: 'bg-purple-100 text-purple-600',
      },
    };
    return colors[color as keyof typeof colors][type];
  };

  return (
    <Layout title="Loan Products - Patapesa Loan" description="Explore our range of loan products designed to meet your financial needs">
      <div className="py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Loan Products
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our range of flexible loan products designed to meet your 
            unique financial needs and goals.
          </p>
        </section>

        {/* Loan Products Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {loanProducts.map((product) => {
            const Icon = product.icon;
            return (
              <div
                key={product.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden ${
                  product.popular ? `border-2 ${getColorClasses(product.color, 'border')}` : ''
                }`}
              >
                {product.popular && (
                  <div className={`${getColorClasses(product.color, 'bg')} text-white text-center py-2 px-4 text-sm font-semibold`}>
                    Most Popular
                  </div>
                )}
                
                <div className="p-8">
                  <div className={`w-14 h-14 ${getColorClasses(product.color, 'icon')} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-6">{product.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600 font-medium">Amount:</span>
                      <span className="text-sm font-semibold text-gray-900">{product.amount}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600 font-medium">Term:</span>
                      <span className="text-sm font-semibold text-gray-900">{product.term}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600 font-medium">Interest:</span>
                      <span className="text-sm font-semibold text-gray-900">{product.interest}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Features:</h4>
                    <ul className="space-y-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className={`w-4 h-4 ${getColorClasses(product.color, 'text')} flex-shrink-0 mt-0.5`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button variant="primary" fullWidth>
                    Apply Now
                  </Button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Why Choose Us Section */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose Our Loans?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Approval</h3>
              <p className="text-gray-600">
                Get approved in minutes with our automated credit assessment system
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Process</h3>
              <p className="text-gray-600">
                Simple online application with minimal documentation required
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Terms</h3>
              <p className="text-gray-600">
                Choose repayment terms that fit your financial situation
              </p>
            </div>
          </div>
        </section>

        {/* Loan Calculator Section */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Calculate Your Loan
          </h2>
          <p className="text-gray-600 mb-6">
            Use our loan calculator to estimate your monthly payments and total interest
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800 mb-4">
              Our interactive loan calculator is coming soon! For now, please contact our 
              support team for personalized loan calculations.
            </p>
            <Button variant="primary">Contact Support</Button>
          </div>
        </section>

        {/* Eligibility Section */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Eligibility Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Requirements:</h3>
              <ul className="space-y-2">
                {[
                  'Be a Kenyan citizen or resident',
                  'Age 18-65 years old',
                  'Have a valid national ID or passport',
                  'Provide proof of income',
                  'Have an active mobile money account',
                ].map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents:</h3>
              <ul className="space-y-2">
                {[
                  'National ID or Passport',
                  'Proof of residence (utility bill)',
                  'Bank statements (last 3 months)',
                  'Employment letter or business registration',
                  'KRA PIN certificate',
                ].map((doc, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Your Loan?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Patapesa Loan for their 
            financial needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Get Started Now
            </a>
            <a
              href="/faq"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              View FAQ
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Loans;
