import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  id: string;
}

interface LoanData {
  id: string;
  amount: number;
  status: 'active' | 'pending' | 'completed';
  dueDate: string;
  interestRate: number;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }

    // Simulate fetching loan data
    setTimeout(() => {
      setLoans([
        {
          id: '1',
          amount: 50000,
          status: 'active',
          dueDate: '2024-02-15',
          interestRate: 15
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [router]);

  if (loading) {
    return (
      <Layout title="Dashboard - Patapesa Loan">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard - Patapesa Loan">
      <div className="py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-gray-600">Here's your loan overview and account status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Active Loans */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-blue-100 text-sm">Active</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {loans.filter(l => l.status === 'active').length}
            </h3>
            <p className="text-blue-100 text-sm">Active Loans</p>
          </div>

          {/* Total Borrowed */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-green-100 text-sm">Total</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              KES {loans.reduce((sum, loan) => sum + loan.amount, 0).toLocaleString()}
            </h3>
            <p className="text-green-100 text-sm">Total Borrowed</p>
          </div>

          {/* Credit Score */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-purple-100 text-sm">Score</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">720</h3>
            <p className="text-purple-100 text-sm">Credit Score</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="primary" size="md" className="flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" />
              Apply for Loan
            </Button>
            <Button variant="outline" size="md" className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              View Statements
            </Button>
            <Button variant="outline" size="md" className="flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              Make Payment
            </Button>
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Loans</h2>
          
          {loans.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">You don't have any active loans</p>
              <Button variant="primary">Apply for Your First Loan</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          KES {loan.amount.toLocaleString()}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          loan.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : loan.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due: {new Date(loan.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Interest: {loan.interestRate}% p.a.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button variant="primary" size="sm">Make Payment</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment Reminder</h3>
                <p className="text-gray-600 text-sm">
                  Set up automatic payments to never miss a due date and maintain a good credit score.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Build Your Credit</h3>
                <p className="text-gray-600 text-sm">
                  Make timely payments and maintain low loan balances to improve your credit score.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
