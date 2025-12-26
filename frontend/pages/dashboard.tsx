'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface LoanData {
  id: string;
  amount: number;
  remainingBalance: number;
  interestRate: number;
  status: 'active' | 'pending' | 'completed' | 'defaulted';
  disbursementDate: string;
  maturityDate: string;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  totalPaid: number;
  installmentsPaid: number;
  totalInstallments: number;
}

interface PaymentHistory {
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
}

const Dashboard: React.FC = () => {
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch loan data from API
    const fetchLoanData = async () => {
      try {
        setLoading(true);
        // Replace with actual API endpoint
        const response = await fetch('/api/loans/current');
        if (!response.ok) {
          throw new Error('Failed to fetch loan data');
        }
        const data = await response.json();
        setLoanData(data.loan);
        setPaymentHistory(data.paymentHistory || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLoanData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loanData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Active Loans</CardTitle>
            <CardDescription>
              You currently have no active loans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Apply for a Loan</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = (loanData.totalPaid / loanData.amount) * 100;
  const daysUntilMaturity = Math.ceil(
    (new Date(loanData.maturityDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    defaulted: 'bg-red-100 text-red-800',
  };

  const chartData = paymentHistory.map((payment) => ({
    date: new Date(payment.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    amount: payment.amount,
    status: payment.status,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Loan Dashboard
          </h1>
          <p className="text-slate-600">
            Manage and monitor your loan account
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Loan Amount */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Loan Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                KES {loanData.amount.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Original amount</p>
            </CardContent>
          </Card>

          {/* Remaining Balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Remaining Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                KES {loanData.remainingBalance.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Outstanding amount</p>
            </CardContent>
          </Card>

          {/* Interest Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Interest Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {loanData.interestRate}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Per annum</p>
            </CardContent>
          </Card>

          {/* Loan Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={statusColors[loanData.status]}>
                {loanData.status.charAt(0).toUpperCase() +
                  loanData.status.slice(1)}
              </Badge>
              <p className="text-xs text-slate-500 mt-2">
                {daysUntilMaturity > 0
                  ? `${daysUntilMaturity} days left`
                  : 'Matured'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Loan Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Loan Repayment Progress</CardTitle>
              <CardDescription>
                {loanData.installmentsPaid} of {loanData.totalInstallments}{' '}
                installments completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      Paid
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={progressPercentage}
                    className="h-3"
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>
                      KES {loanData.totalPaid.toLocaleString()} paid
                    </span>
                    <span>
                      KES {loanData.remainingBalance.toLocaleString()} remaining
                    </span>
                  </div>
                </div>

                {/* Installment Chart */}
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) =>
                        `KES ${(value as number).toLocaleString()}`
                      }
                    />
                    <Bar
                      dataKey="amount"
                      fill="#10b981"
                      name="Payment Amount"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Next Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Next Payment</CardTitle>
              <CardDescription>Due soon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm text-slate-600">Payment Amount</p>
                  <p className="text-2xl font-bold text-slate-900">
                    KES {loanData.nextPaymentAmount.toLocaleString()}
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {new Date(loanData.nextPaymentDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
              </div>

              <Button className="w-full">Make Payment</Button>
            </CardContent>
          </Card>
        </div>

        {/* Loan Details & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loan Details */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
              <CardDescription>Complete loan information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-sm text-slate-600">Loan ID</span>
                  <span className="text-sm font-mono font-semibold text-slate-900">
                    {loanData.id}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-sm text-slate-600">Disbursement Date</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {new Date(loanData.disbursementDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-sm text-slate-600">Maturity Date</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {new Date(loanData.maturityDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-sm text-slate-600">Total Installments</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {loanData.totalInstallments}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Installments Paid</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {loanData.installmentsPaid}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Timeline</CardTitle>
              <CardDescription>Recent payment activity</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {paymentHistory.slice(0, 5).map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between pb-3 border-b last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(payment.date).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${
                            payment.status === 'completed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : payment.status === 'pending'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        KES {payment.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  No payment history available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
