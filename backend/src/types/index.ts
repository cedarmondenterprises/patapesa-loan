export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  nationality?: string;
  gender?: string;
  profilePictureUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  employmentType?: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS_OWNER' | 'UNEMPLOYED' | 'STUDENT' | 'RETIRED';
  monthlyIncome?: number;
  employmentStatus?: string;
  employerName?: string;
  occupation?: string;
  industry?: string;
  yearsOfEmployment?: number;
  educationalQualification?: string;
  maritalStatus?: string;
  numberOfDependents?: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanProduct {
  id: string;
  productCode: string;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  interestRate: number;
  processingFee?: number;
  latePaymentFee?: number;
  currency: string;
  requiresCollateral: boolean;
  requiresGuarantor: boolean;
  requiresInsurance: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanApplication {
  id: string;
  userId: string;
  productId: string;
  applicationNumber: string;
  loanAmount: number;
  currency: string;
  loanTerm: number;
  purpose?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'COMPLETED' | 'CANCELLED';
  interestRate?: number;
  processingFee?: number;
  totalAmountPayable?: number;
  monthlyPayment?: number;
  approvalDate?: Date;
  disbursementDate?: Date;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  applicationId: string;
  userId: string;
  loanNumber: string;
  principalAmount: number;
  totalInterest: number;
  totalAmountPayable: number;
  currency: string;
  interestRate: number;
  loanTerm: number;
  paymentFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  nextPaymentDate?: Date;
  status: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'DEFAULTED' | 'WRITTEN_OFF';
  disbursementDate: Date;
  maturityDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepaymentSchedule {
  id: string;
  loanId: string;
  sequenceNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalDue: number;
  amountPaid: number;
  lateFee: number;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'WAIVED';
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  loanId: string;
  repaymentScheduleId?: string;
  userId: string;
  paymentAmount: number;
  currency: string;
  paymentMethod: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CARD' | 'CASH' | 'CHECK' | 'CHEQUE';
  transactionReference?: string;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  paymentDate: Date;
  confirmedDate?: Date;
  failureReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCVerification {
  id: string;
  userId: string;
  idType: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVING_LICENSE' | 'VOTER_ID';
  idNumber: string;
  idDocumentUrl?: string;
  idExpiryDate?: Date;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditScore {
  id: string;
  userId: string;
  score: number;
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';
  calculationMethod?: string;
  factors?: Record<string, any>;
  validUntil?: Date;
  calculatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
