import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Generate unique ID
export const generateId = (): string => {
  return uuidv4();
};

// Generate random string
export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate loan number
export const generateLoanNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `PL${timestamp}${random}`;
};

// Calculate loan monthly payment (amortization)
export const calculateMonthlyPayment = (
  principal: number,
  annualInterestRate: number,
  termMonths: number
): number => {
  const monthlyRate = annualInterestRate / 12;
  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  return Math.round(payment * 100) / 100;
};

// Calculate total loan amount
export const calculateTotalLoanAmount = (
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  processingFeeRate: number = 0
): number => {
  const monthlyPayment = calculateMonthlyPayment(principal, annualInterestRate, termMonths);
  const totalRepayment = monthlyPayment * termMonths;
  const processingFee = principal * processingFeeRate;

  return Math.round((totalRepayment + processingFee) * 100) / 100;
};

// Calculate processing fee
export const calculateProcessingFee = (principal: number, feeRate: number): number => {
  return Math.round(principal * feeRate * 100) / 100;
};

// Calculate amortization schedule
export interface AmortizationEntry {
  paymentNumber: number;
  dueDate: Date;
  principalPortion: number;
  interestPortion: number;
  totalPayment: number;
  remainingBalance: number;
}

export const calculateAmortizationSchedule = (
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  startDate: Date = new Date()
): AmortizationEntry[] => {
  const monthlyRate = annualInterestRate / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualInterestRate, termMonths);
  const schedule: AmortizationEntry[] = [];
  let remainingBalance = principal;

  for (let i = 1; i <= termMonths; i++) {
    const interestPortion = Math.round(remainingBalance * monthlyRate * 100) / 100;
    const principalPortion = Math.round((monthlyPayment - interestPortion) * 100) / 100;
    remainingBalance = Math.round((remainingBalance - principalPortion) * 100) / 100;

    // Calculate due date (first payment is 30 days from start)
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 30 * i);

    schedule.push({
      paymentNumber: i,
      dueDate,
      principalPortion,
      interestPortion,
      totalPayment: monthlyPayment,
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  return schedule;
};

// Calculate days between dates
export const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if date is past due
export const isPastDue = (dueDate: Date): boolean => {
  return new Date() > new Date(dueDate);
};

// Calculate overdue days
export const calculateOverdueDays = (dueDate: Date): number => {
  if (!isPastDue(dueDate)) return 0;
  return daysBetween(new Date(dueDate), new Date());
};

// Calculate late fee
export const calculateLateFee = (
  amountDue: number,
  daysOverdue: number,
  baseFee: number = 100
): number => {
  if (daysOverdue === 0) return 0;
  // Base fee + 1% of amount per week overdue
  const weeksPenalty = Math.floor(daysOverdue / 7) * (amountDue * 0.01);
  return Math.round((baseFee + weeksPenalty) * 100) / 100;
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
};

// Generate JWT token
export const generateToken = <T extends object>(payload: T, secret: string, expiresIn: string): string => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, secret, { expiresIn });
};

// Verify JWT token
export const verifyToken = <T = any>(token: string, secret: string): T | null => {
  const jwt = require('jsonwebtoken');
  try {
    return jwt.verify(token, secret) as T;
  } catch (error) {
    return null;
  }
};

// Sleep function for delays
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Retry function
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt);
      }
    }
  }

  throw lastError;
};

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Calculate credit score (simplified)
export const calculateCreditScore = (data: {
  monthlyIncome?: number;
  existingLoans?: number;
  loanAmount: number;
  employmentYears?: number;
  paymentHistory?: 'excellent' | 'good' | 'fair' | 'poor';
}): number => {
  let score = 500; // Base score

  // Income factor
  if (data.monthlyIncome) {
    const incomeRatio = data.loanAmount / data.monthlyIncome;
    if (incomeRatio < 1) score += 150;
    else if (incomeRatio < 2) score += 100;
    else if (incomeRatio < 3) score += 50;
  }

  // Existing loans factor
  if (data.existingLoans !== undefined) {
    if (data.existingLoans === 0) score += 100;
    else if (data.existingLoans === 1) score += 50;
    else if (data.existingLoans > 3) score -= 50;
  }

  // Employment factor
  if (data.employmentYears) {
    if (data.employmentYears >= 5) score += 100;
    else if (data.employmentYears >= 2) score += 50;
    else if (data.employmentYears >= 1) score += 25;
  }

  // Payment history factor
  if (data.paymentHistory) {
    const historyScores = {
      excellent: 150,
      good: 100,
      fair: 50,
      poor: -100,
    };
    score += historyScores[data.paymentHistory];
  }

  // Ensure score is between 300-850
  return Math.max(300, Math.min(850, score));
};

// Determine risk rating
export const determineRiskRating = (creditScore: number): 'low' | 'medium' | 'high' | 'very_high' => {
  if (creditScore >= 700) return 'low';
  if (creditScore >= 600) return 'medium';
  if (creditScore >= 500) return 'high';
  return 'very_high';
};
