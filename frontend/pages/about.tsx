import React from 'react';
import Layout from '../components/Layout';
import { Users, Target, Award, Heart, Shield, TrendingUp } from 'lucide-react';

const About: React.FC = () => {
  return (
    <Layout title="About Us - Patapesa Loan" description="Learn about Patapesa Loan's mission, values, and commitment to providing accessible financial services">
      <div className="py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Patapesa Loan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're on a mission to make financial services accessible, transparent, and 
            empowering for everyone in Kenya.
          </p>
        </section>

        {/* Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-blue-100 leading-relaxed">
              To provide fast, secure, and transparent digital lending services that 
              empower individuals and businesses to achieve their financial goals. We 
              believe everyone deserves access to fair and affordable credit.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-green-100 leading-relaxed">
              To become Kenya's most trusted digital lending platform, revolutionizing 
              access to credit through technology and innovation while maintaining the 
              highest standards of customer service and financial responsibility.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="prose max-w-none text-gray-600 leading-relaxed space-y-4">
            <p>
              Founded in 2020, Patapesa Loan was born from a simple observation: millions of 
              Kenyans struggled to access fair and timely credit from traditional financial 
              institutions. Long approval times, excessive paperwork, and unclear terms made 
              borrowing a frustrating experience.
            </p>
            <p>
              We set out to change that. By leveraging cutting-edge technology and data 
              analytics, we created a platform that could assess creditworthiness quickly 
              and accurately, provide instant loan decisions, and disburse funds within 
              minutes—all while maintaining transparency and fairness.
            </p>
            <p>
              Today, we've served over 100,000 customers, disbursed over KES 5 billion in 
              loans, and maintained one of the highest customer satisfaction rates in the 
              industry. But we're just getting started.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Trust & Security</h3>
              <p className="text-gray-600">
                We prioritize the security of your data and maintain the highest standards 
                of confidentiality and data protection.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer First</h3>
              <p className="text-gray-600">
                Every decision we make is guided by what's best for our customers. Your 
                success is our success.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-600">
                We strive for excellence in everything we do, from our technology to our 
                customer service.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-12 text-white mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">100K+</div>
              <div className="text-blue-100">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">KES 5B+</div>
              <div className="text-blue-100">Loans Disbursed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
            Leadership Team
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our experienced leadership team brings together expertise in fintech, banking, 
            technology, and customer service.
          </p>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">
              Our team is committed to innovation, integrity, and making a positive impact 
              on the lives of our customers.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gray-100 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Join Our Journey
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Be part of the financial revolution. Start your loan application today and 
            experience the Patapesa difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </a>
            <a
              href="/contact"
              className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Contact Us
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default About;
