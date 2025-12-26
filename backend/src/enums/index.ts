/**
 * Loan Status Enumeration
 * Represents the various states a loan can be in throughout its lifecycle
 */
export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DEFAULTED = 'DEFAULTED',
  SUSPENDED = 'SUSPENDED',
}

/**
 * User Roles Enumeration
 * Defines the different roles users can have in the system
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  LOAN_OFFICER = 'LOAN_OFFICER',
  CUSTOMER = 'CUSTOMER',
  REVIEWER = 'REVIEWER',
  SUPPORT = 'SUPPORT',
}

/**
 * Loan Application Status Enumeration
 * Tracks the status of loan applications through the approval process
 */
export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PENDING_DOCUMENTATION = 'PENDING_DOCUMENTATION',
  COMPLETED = 'COMPLETED',
}

/**
 * Payment Status Enumeration
 * Represents the status of loan payments
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  PARTIAL = 'PARTIAL',
}

/**
 * User Status Enumeration
 * Represents the account status of users
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  BLOCKED = 'BLOCKED',
}

/**
 * Document Status Enumeration
 * Tracks the status of user documents submitted for loan applications
 */
export enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/**
 * Document Type Enumeration
 * Defines the types of documents that can be submitted
 */
export enum DocumentType {
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  PROOF_OF_INCOME = 'PROOF_OF_INCOME',
  BANK_STATEMENT = 'BANK_STATEMENT',
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  UTILITY_BILL = 'UTILITY_BILL',
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  TAX_DOCUMENT = 'TAX_DOCUMENT',
}

/**
 * Loan Type Enumeration
 * Represents different types of loans offered
 */
export enum LoanType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  MORTGAGE = 'MORTGAGE',
  AUTO = 'AUTO',
  EMERGENCY = 'EMERGENCY',
  EDUCATION = 'EDUCATION',
  AGRICULTURAL = 'AGRICULTURAL',
}

/**
 * Notification Status Enumeration
 * Tracks the status of notifications sent to users
 */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

/**
 * Notification Type Enumeration
 * Defines different types of notifications
 */
export enum NotificationType {
  LOAN_APPROVED = 'LOAN_APPROVED',
  LOAN_REJECTED = 'LOAN_REJECTED',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  DOCUMENT_REQUESTED = 'DOCUMENT_REQUESTED',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

/**
 * Transaction Type Enumeration
 * Represents different types of transactions
 */
export enum TransactionType {
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_PAYMENT = 'LOAN_PAYMENT',
  FEE_CHARGE = 'FEE_CHARGE',
  INTEREST_CHARGE = 'INTEREST_CHARGE',
  REFUND = 'REFUND',
  PENALTY = 'PENALTY',
}

/**
 * Sort Direction Enumeration
 * Used for pagination and sorting
 */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * HTTP Status Codes Enumeration
 * Common HTTP status codes used in API responses
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}
