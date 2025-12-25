// Type definitions for Patapesa Loan Platform

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  nationalId?: string;
  role: 'customer' | 'agent' | 'admin' | 'super_admin';
  status: 'pending' | 'active' | 'suspended' | 'deactivated';
  kycStatus: 'not_started' | 'pending' | 'approved' | 'rejected';
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCDocument {
  id: string;
  userId: string;
  documentType: 'national_id' | 'passport' | 'drivers_license' | 'proof_of_address' | 'bank_statement' | 'payslip';
  documentNumber?: string;
  documentUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanProduct {
  id: string;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  minTermMonths: number;
  maxTermMonths: number;
  processingFeeRate: number;
  latePaymentFee: number;
  requiredKycLevel: 'basic' | 'intermediate' | 'full';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  loanNumber: string;
  userId: string;
  productId: string;
  principalAmount: number;
  interestRate: number;
  processingFee: number;
  totalAmount: number;
  termMonths: number;
  monthlyPayment: number;
  outstandingBalance: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'active' | 'completed' | 'defaulted' | 'written_off';
  applicationDate: Date;
  approvalDate?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  disbursementDate?: Date;
  disbursementMethod?: 'bank_transfer' | 'mobile_money' | 'cash';
  disbursementReference?: string;
  firstPaymentDate?: Date;
  finalPaymentDate?: Date;
  purpose?: string;
  creditScore?: number;
  riskRating?: 'low' | 'medium' | 'high' | 'very_high';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  paymentNumber: number;
  dueDate: Date;
  amountDue: number;
  principalPortion: number;
  interestPortion: number;
  amountPaid: number;
  paymentDate?: Date;
  paymentMethod?: 'bank_transfer' | 'mobile_money' | 'cash' | 'auto_debit';
  paymentReference?: string;
  lateFee: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
  daysOverdue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  loanId?: string;
  transactionType: 'disbursement' | 'repayment' | 'processing_fee' | 'late_fee' | 'refund' | 'penalty';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  paymentMethod?: string;
  paymentReference?: string;
  externalReference?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoanApplicationRequest {
  productId: string;
  amount: number;
  termMonths: number;
  purpose: string;
}

export interface KYCSubmissionRequest {
  documentType: string;
  documentNumber?: string;
  file: Express.Multer.File;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  channel: string;
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
