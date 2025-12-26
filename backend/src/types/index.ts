/**
 * Core TypeScript Interfaces and Type Definitions
 * Patapesa Loan Application
 * Last Updated: 2025-12-26
 */

// ============================================================================
// User Types
// ============================================================================

export enum UserRole {
  ADMIN = 'admin',
  LOAN_OFFICER = 'loan_officer',
  CUSTOMER = 'customer',
  AGENT = 'agent',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AuthUser extends User {
  password?: string; // Only for auth operations, never exposed in responses
}

export interface UserProfile extends User {
  idNumber: string;
  dateOfBirth: Date;
  gender?: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  occupation?: string;
  companyName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  nextOfKin?: string;
  nextOfKinPhone?: string;
}

// ============================================================================
// Loan Application Types
// ============================================================================

export enum LoanStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  DEFAULTED = 'defaulted',
  COMPLETED = 'completed',
}

export enum LoanType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  EMERGENCY = 'emergency',
  EDUCATION = 'education',
  MORTGAGE = 'mortgage',
}

export interface LoanApplication {
  id: string;
  userId: string;
  loanType: LoanType;
  principalAmount: number;
  requestedAmount: number;
  approvedAmount?: number;
  interestRate: number;
  loanTerm: number; // in months
  status: LoanStatus;
  purpose: string;
  collateral?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  disbursedAt?: Date;
}

export interface LoanDetails extends LoanApplication {
  user: UserProfile;
  documents: Document[];
  repaymentSchedule: RepaymentSchedule[];
  paymentHistory: Payment[];
  assessments: LoanAssessment[];
}

// ============================================================================
// Document Types
// ============================================================================

export enum DocumentType {
  ID_COPY = 'id_copy',
  BANK_STATEMENT = 'bank_statement',
  PAY_SLIP = 'pay_slip',
  BUSINESS_LICENSE = 'business_license',
  TAX_CERTIFICATE = 'tax_certificate',
  UTILITY_BILL = 'utility_bill',
  EMPLOYMENT_LETTER = 'employment_letter',
  COLLATERAL_PROOF = 'collateral_proof',
  FINANCIAL_STATEMENT = 'financial_statement',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface Document {
  id: string;
  loanApplicationId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  expiryDate?: Date;
  notes?: string;
}

// ============================================================================
// Repayment Schedule Types
// ============================================================================

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
}

export interface RepaymentSchedule {
  id: string;
  loanApplicationId: string;
  installmentNumber: number;
  dueDate: Date;
  principal: number;
  interest: number;
  totalAmount: number;
  amountPaid: number;
  status: PaymentStatus;
  paidDate?: Date;
  nextPaymentDate?: Date;
}

export interface Payment {
  id: string;
  loanApplicationId: string;
  repaymentScheduleId?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  transactionReference: string;
  status: PaymentStatus;
  notes?: string;
  processedBy: string;
  createdAt: Date;
}

// ============================================================================
// Loan Assessment Types
// ============================================================================

export enum AssessmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export interface LoanAssessment {
  id: string;
  loanApplicationId: string;
  assessedBy: string;
  assessmentType: string; // e.g., 'credit', 'collateral', 'financial'
  status: AssessmentStatus;
  score: number; // 0-100
  recommendation: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditScore {
  id: string;
  userId: string;
  score: number;
  grade: string; // A, B, C, D, F
  lastUpdated: Date;
  source: string;
  expiryDate?: Date;
}

// ============================================================================
// Transaction Types
// ============================================================================

export enum TransactionType {
  DISBURSEMENT = 'disbursement',
  PAYMENT = 'payment',
  FEE = 'fee',
  INTEREST = 'interest',
  PENALTY = 'penalty',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Transaction {
  id: string;
  loanApplicationId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  status: TransactionStatus;
  transactionReference: string;
  paymentMethod?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ============================================================================
// Notification Types
// ============================================================================

export enum NotificationType {
  APPLICATION_STATUS = 'application_status',
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  DOCUMENT_REQUEST = 'document_request',
  LOAN_APPROVED = 'loan_approved',
  LOAN_REJECTED = 'loan_rejected',
  SYSTEM = 'system',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  message: string;
  isRead: boolean;
  relatedResourceId?: string;
  relatedResourceType?: string;
  createdAt: Date;
  readAt?: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Request Body Types
// ============================================================================

export interface CreateLoanApplicationRequest {
  loanType: LoanType;
  principalAmount: number;
  requestedAmount: number;
  interestRate: number;
  loanTerm: number;
  purpose: string;
  collateral?: string;
  description?: string;
}

export interface UpdateLoanApplicationRequest {
  loanType?: LoanType;
  principalAmount?: number;
  requestedAmount?: number;
  interestRate?: number;
  loanTerm?: number;
  purpose?: string;
  collateral?: string;
  description?: string;
}

export interface CreateUserRequest {
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface DocumentUploadRequest {
  loanApplicationId: string;
  documentType: DocumentType;
  file: Express.Multer.File;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface LoanApplicationFilters {
  status?: LoanStatus;
  loanType?: LoanType;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  searchTerm?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AppConfig {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiry: string;
  nodeEnv: string;
  port: number;
  logLevel: string;
  awsBucketName?: string;
  awsRegion?: string;
}

export interface FeatureFlags {
  enableSMS: boolean;
  enableEmail: boolean;
  enablePushNotifications: boolean;
  maintenanceMode: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Optional<T> = T | null | undefined;

export type Nullable<T> = T | null;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, { old: any; new: any }>;
  createdAt: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export class CustomError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CustomError';
  }
}

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
}
