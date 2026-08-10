-- Verification codes table (for password reset, email verification, 2FA, etc.)
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('password_reset','email_verification','2fa_setup','2fa_login')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON verification_codes(type);
