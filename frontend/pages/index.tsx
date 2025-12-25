import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';

const Home: React.FC = () => {
  return (
    <Layout title="Patapesa Loan - Fast & Secure Digital Loans">
      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Get Your Loan in Minutes
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Fast, secure, and transparent digital lending platform. Apply for loans up to KES 1,000,000
          with flexible repayment terms.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="primary" size="lg">
            Apply for a Loan
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose Patapesa Loan?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Approval</h3>
            <p className="text-gray-600">
              Get your loan approved in minutes with our automated credit assessment system.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Safe</h3>
            <p className="text-gray-600">
              Your data is encrypted and protected with bank-level security measures.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Terms</h3>
            <p className="text-gray-600">
              Choose repayment terms from 1 to 36 months that fit your financial situation.
            </p>
          </div>
        </div>
      </section>

      {/* Loan Products Section */}
      <section className="py-16 px-4 bg-gray-100 rounded-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Our Loan Products
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Quick Cash</h3>
            <p className="text-gray-600 mb-4">Perfect for urgent financial needs</p>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> KES 1,000 - 50,000
              </p>
              <p className="text-sm text-gray-600">
                <strong>Term:</strong> 1 - 6 months
              </p>
              <p className="text-sm text-gray-600">
                <strong>Interest:</strong> 18% p.a.
              </p>
            </div>
            <Button variant="primary" fullWidth>
              Apply Now
            </Button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md border-2 border-blue-600">
            <div className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full mb-2">
              Popular
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Personal Loan</h3>
            <p className="text-gray-600 mb-4">For your medium-term needs</p>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> KES 10,000 - 500,000
              </p>
              <p className="text-sm text-gray-600">
                <strong>Term:</strong> 3 - 24 months
              </p>
              <p className="text-sm text-gray-600">
                <strong>Interest:</strong> 15% p.a.
              </p>
            </div>
            <Button variant="primary" fullWidth>
              Apply Now
            </Button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Business Loan</h3>
            <p className="text-gray-600 mb-4">Grow your business with us</p>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> KES 50,000 - 1,000,000
              </p>
              <p className="text-sm text-gray-600">
                <strong>Term:</strong> 6 - 36 months
              </p>
              <p className="text-sm text-gray-600">
                <strong>Interest:</strong> 12% p.a.
              </p>
            </div>
            <Button variant="primary" fullWidth>
              Apply Now
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Register</h3>
            <p className="text-gray-600 text-sm">
              Create your account with basic information
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify KYC</h3>
            <p className="text-gray-600 text-sm">
              Upload your ID and proof of address
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply</h3>
            <p className="text-gray-600 text-sm">
              Submit your loan application online
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              4
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Funded</h3>
            <p className="text-gray-600 text-sm">
              Receive funds directly to your account
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of satisfied customers who trust Patapesa Loan
        </p>
        <Button variant="secondary" size="lg">
          Apply for a Loan Now
        </Button>
      </section>
    </Layout>
  );
};

export default Home;
