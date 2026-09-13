-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SEQUENCE IF NOT EXISTS support_reference_seq START 1000;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(3),
    gender VARCHAR(10),
    profile_picture_url TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REJECTED', 'DELETED')),
    is_email_verified BOOLEAN DEFAULT false,
    is_phone_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    last_login TIMESTAMP,
    auth_version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'ACTIVE';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('PENDING','ACTIVE','INACTIVE','SUSPENDED','REJECTED','DELETED'));

CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(30) NOT NULL UNIQUE DEFAULT ('SUP-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || nextval('support_reference_seq')),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User profiles extended
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employment_type VARCHAR(50) CHECK (employment_type IN ('SALARIED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'UNEMPLOYED', 'STUDENT', 'RETIRED')),
    monthly_income DECIMAL(12, 2),
    employment_status VARCHAR(50),
    employer_name VARCHAR(255),
    employer_phone VARCHAR(20),
    occupation VARCHAR(100),
    industry VARCHAR(100),
    years_of_employment INTEGER,
    educational_qualification VARCHAR(100),
    marital_status VARCHAR(50),
    number_of_dependents INTEGER,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS income_range VARCHAR(40);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS source_of_income VARCHAR(120);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- Immutable, versioned snapshot of the answers and declarations submitted at registration.
-- Keeping this separate from the editable profile preserves the record staff reviewed.
CREATE TABLE IF NOT EXISTS registration_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    reference VARCHAR(40) NOT NULL UNIQUE,
    form_version VARCHAR(20) NOT NULL,
    answers JSONB NOT NULL,
    declarations JSONB NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_registration_submissions_submitted_at
    ON registration_submissions(submitted_at DESC);

-- Complete adult registrations no longer wait for manual account activation.
UPDATE users u SET status='ACTIVE',updated_at=NOW()
WHERE u.status='PENDING'
  AND u.date_of_birth<=CURRENT_DATE-INTERVAL '18 years'
  AND EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id=u.id AND up.profile_completed_at IS NOT NULL
  );

-- Verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('password_reset', 'email_verification', '2fa_setup', '2fa_login', 'phone_verification')),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON verification_codes(type);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_digest CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expiry ON password_reset_tokens(expires_at) WHERE used_at IS NULL;

-- KYC (Know Your Customer) table
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    id_type VARCHAR(50) NOT NULL CHECK (id_type IN ('NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID')),
    id_number VARCHAR(50),
    id_number_ciphertext TEXT,
    id_number_hash CHAR(64),
    id_number_last4 VARCHAR(4),
    id_document_url TEXT,
    id_expiry_date DATE,
    verification_status VARCHAR(50) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    rejection_reason TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(verification_status);

ALTER TABLE kyc_verifications ALTER COLUMN id_number DROP NOT NULL;
ALTER TABLE kyc_verifications ADD COLUMN IF NOT EXISTS id_number_ciphertext TEXT;
ALTER TABLE kyc_verifications ADD COLUMN IF NOT EXISTS id_number_hash CHAR(64);
ALTER TABLE kyc_verifications ADD COLUMN IF NOT EXISTS id_number_last4 VARCHAR(4);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kyc_id_number_hash ON kyc_verifications(id_number_hash) WHERE id_number_hash IS NOT NULL;

-- KYC Documents
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kyc_id UUID NOT NULL REFERENCES kyc_verifications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL CHECK (document_type IN ('PROOF_OF_ADDRESS', 'INCOME_PROOF', 'BANK_STATEMENT', 'EMPLOYMENT_LETTER', 'BUSINESS_REGISTRATION', 'TAX_CERTIFICATE')),
    document_url TEXT NOT NULL,
    document_size INTEGER,
    mime_type VARCHAR(50),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_kyc_id ON kyc_documents(kyc_id);

-- Loan products
CREATE TABLE IF NOT EXISTS loan_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_amount DECIMAL(12, 2) NOT NULL,
    max_amount DECIMAL(12, 2) NOT NULL,
    min_term INTEGER NOT NULL,
    max_term INTEGER NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    processing_fee DECIMAL(5, 2),
    late_payment_fee DECIMAL(5, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    requires_collateral BOOLEAN DEFAULT false,
    requires_guarantor BOOLEAN DEFAULT false,
    requires_insurance BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_products_status ON loan_products(status);

DO $$ BEGIN
  ALTER TABLE loan_products ADD CONSTRAINT loan_product_amounts_valid CHECK (min_amount > 0 AND max_amount >= min_amount);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE loan_products ADD CONSTRAINT loan_product_terms_valid CHECK (min_term > 0 AND max_term >= min_term);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Loan applications
CREATE TABLE IF NOT EXISTS loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES loan_products(id),
    application_number VARCHAR(50) NOT NULL UNIQUE,
    loan_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    loan_term INTEGER NOT NULL,
    purpose VARCHAR(255),
    purpose_category VARCHAR(40),
    repayment_source VARCHAR(160),
    existing_monthly_debt DECIMAL(12, 2) NOT NULL DEFAULT 0,
    affordability_ratio DECIMAL(8, 4),
    declaration_accepted BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED', 'CANCELLED')),
    interest_rate DECIMAL(5, 2),
    processing_fee DECIMAL(12, 2),
    total_amount_payable DECIMAL(12, 2),
    monthly_payment DECIMAL(12, 2),
    approval_date TIMESTAMP,
    disbursement_date TIMESTAMP,
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_application_number ON loan_applications(application_number);

ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS purpose_category VARCHAR(40);
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS repayment_source VARCHAR(160);
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS existing_monthly_debt DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS affordability_ratio DECIMAL(8, 4);
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN NOT NULL DEFAULT true;

DO $$ BEGIN
  ALTER TABLE loan_applications ADD CONSTRAINT loan_application_values_valid CHECK (loan_amount > 0 AND loan_term > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE loan_applications ADD CONSTRAINT loan_application_debt_valid CHECK (existing_monthly_debt >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Loans (approved/active loans)
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL UNIQUE REFERENCES loan_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_number VARCHAR(50) NOT NULL UNIQUE,
    principal_amount DECIMAL(12, 2) NOT NULL,
    total_interest DECIMAL(12, 2) NOT NULL,
    processing_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_amount_payable DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    interest_rate DECIMAL(5, 2) NOT NULL,
    loan_term INTEGER NOT NULL,
    payment_frequency VARCHAR(50) NOT NULL CHECK (payment_frequency IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL')),
    next_payment_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF')),
    disbursement_date TIMESTAMP NOT NULL,
    maturity_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_loan_number ON loans(loan_number);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Repayment schedules
CREATE TABLE IF NOT EXISTS repayment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    principal_amount DECIMAL(12, 2) NOT NULL,
    interest_amount DECIMAL(12, 2) NOT NULL,
    fee_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_due DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    late_fee DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'WAIVED')),
    paid_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_repayment_schedules_loan_id ON repayment_schedules(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayment_schedules_status ON repayment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_repayment_schedules_due_date ON repayment_schedules(due_date);
ALTER TABLE repayment_schedules ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    repayment_schedule_id UUID REFERENCES repayment_schedules(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'CASH', 'CHECK', 'CHEQUE')),
    transaction_reference VARCHAR(100) UNIQUE,
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED')),
    payment_date TIMESTAMP NOT NULL,
    confirmed_date TIMESTAMP,
    failure_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

DO $$ BEGIN
  ALTER TABLE payments ADD CONSTRAINT payment_amount_valid CHECK (payment_amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Credit scores and assessments
CREATE TABLE IF NOT EXISTS credit_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    rating VARCHAR(50) NOT NULL CHECK (rating IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'VERY_POOR')),
    calculation_method VARCHAR(100),
    factors JSONB,
    valid_until DATE,
    calculated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_scores_user_id ON credit_scores(user_id);

-- Credit history
CREATE TABLE IF NOT EXISTS credit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id),
    credit_action VARCHAR(100) NOT NULL,
    previous_score INTEGER,
    new_score INTEGER,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_loan_id ON credit_history(loan_id);

-- Collateral
CREATE TABLE IF NOT EXISTS collaterals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    collateral_type VARCHAR(100) NOT NULL CHECK (collateral_type IN ('REAL_ESTATE', 'VEHICLE', 'EQUIPMENT', 'JEWELRY', 'SECURITIES', 'CASH_DEPOSIT', 'OTHER')),
    description TEXT NOT NULL,
    estimated_value DECIMAL(12, 2) NOT NULL,
    valuation_date DATE,
    valuator_name VARCHAR(255),
    documents_url TEXT,
    status VARCHAR(50) DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'VERIFIED', 'RELEASED', 'LIQUIDATED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collaterals_loan_id ON collaterals(loan_id);

-- Guarantors
CREATE TABLE IF NOT EXISTS guarantors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    guarantor_name VARCHAR(255) NOT NULL,
    guarantor_phone VARCHAR(20) NOT NULL,
    guarantor_email VARCHAR(255),
    id_type VARCHAR(50),
    id_number VARCHAR(50),
    relationship VARCHAR(100),
    monthly_income DECIMAL(12, 2),
    employment_type VARCHAR(50),
    employer_name VARCHAR(255),
    address VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'REMOVED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guarantors_loan_id ON guarantors(loan_id);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Transactions log
CREATE TABLE IF NOT EXISTS transaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id),
    payment_id UUID REFERENCES payments(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('DISBURSEMENT', 'PAYMENT', 'REFUND', 'FEE', 'INTEREST', 'PENALTY')),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    balance_before DECIMAL(12, 2),
    balance_after DECIMAL(12, 2),
    description TEXT,
    reference_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_loan_id ON transaction_logs(loan_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id),
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'IN_APP', 'PUSH')),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ')),
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id),
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED')),
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Admin users (roles and permissions)
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

INSERT INTO admin_roles(name,description,permissions,status) VALUES
('SUPER_ADMIN','Full platform administration','["dashboard:view","users:view","users:manage","roles:assign","kyc:review","loans:review","loans:disburse","ledger:view","support:manage","audit:view"]'::jsonb,'ACTIVE'),
('MANAGER','Operational and financial management','["dashboard:view","users:view","users:manage","kyc:review","loans:review","loans:disburse","ledger:view","support:manage","audit:view"]'::jsonb,'ACTIVE'),
('STAFF','Customer registration, identity, loan and support operations','["dashboard:view","users:view","users:manage","kyc:review","loans:review","ledger:view","support:manage"]'::jsonb,'ACTIVE')
ON CONFLICT(name) DO UPDATE SET description=EXCLUDED.description,permissions=EXCLUDED.permissions,status='ACTIVE',updated_at=NOW();

INSERT INTO user_roles(user_id,role_id)
SELECT ur.user_id,new_role.id FROM user_roles ur JOIN admin_roles old_role ON old_role.id=ur.role_id
CROSS JOIN admin_roles new_role WHERE old_role.name='PLATFORM_ADMIN' AND new_role.name='SUPER_ADMIN'
ON CONFLICT(user_id,role_id) DO NOTHING;
UPDATE admin_roles SET status='INACTIVE' WHERE name='PLATFORM_ADMIN';

INSERT INTO loan_products(product_code,name,description,min_amount,max_amount,min_term,max_term,interest_rate,processing_fee,late_payment_fee,currency)
VALUES
 ('QUICK_CASH','Emergency loan','Short-term credit for urgent, essential expenses.',1000,50000,1,6,18,3,5,'KES'),
 ('PERSONAL','Personal loan','Flexible credit for planned personal expenses.',10000,500000,3,24,15,2.5,5,'KES'),
 ('BUSINESS','Business loan','Working capital for established small businesses.',50000,1000000,6,36,12,2,5,'KES')
ON CONFLICT(product_code) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,min_amount=EXCLUDED.min_amount,max_amount=EXCLUDED.max_amount,min_term=EXCLUDED.min_term,max_term=EXCLUDED.max_term,interest_rate=EXCLUDED.interest_rate,processing_fee=EXCLUDED.processing_fee,status='ACTIVE',updated_at=NOW();
