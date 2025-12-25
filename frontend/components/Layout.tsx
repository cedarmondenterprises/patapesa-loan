import React, { ReactNode } from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Patapesa Loan',
  description = 'Digital lending platform for fast and secure loans',
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">Patapesa Loan</h1>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </a>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Patapesa Loan
                </h3>
                <p className="text-gray-600 text-sm">
                  Fast, secure, and reliable digital lending platform for your financial needs.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="/about" className="text-gray-600 hover:text-blue-600 text-sm">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="/loans" className="text-gray-600 hover:text-blue-600 text-sm">
                      Loan Products
                    </a>
                  </li>
                  <li>
                    <a href="/contact" className="text-gray-600 hover:text-blue-600 text-sm">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="/faq" className="text-gray-600 hover:text-blue-600 text-sm">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="/privacy" className="text-gray-600 hover:text-blue-600 text-sm">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-gray-600 hover:text-blue-600 text-sm">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} Patapesa Loan. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
