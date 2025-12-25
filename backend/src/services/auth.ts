import { query, transaction } from '../config/database';
import { env } from '../config/env';
import { User, LoginRequest, RegisterRequest } from '../types';
import { hashPassword, verifyPassword, generateToken, generateId } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { PoolClient } from 'pg';

// Register new user
export const register = async (data: RegisterRequest): Promise<{ user: User; token: string }> => {
  return transaction(async (client: PoolClient) => {
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [data.email, data.phone]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email or phone already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, phone, first_name, last_name, role, status, kyc_status, 
                 email_verified, phone_verified, two_factor_enabled, created_at, updated_at`,
      [data.email, data.phone, passwordHash, data.firstName, data.lastName, 'customer', 'active']
    );

    const user = userResult.rows[0];

    // Create user profile
    await client.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1)',
      [user.id]
    );

    // Generate JWT token
    const token = generateToken(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      env.JWT_EXPIRATION
    );

    // Generate refresh token
    const refreshToken = generateToken(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_EXPIRATION
    );

    // Store tokens
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

    await client.query(
      `INSERT INTO session_tokens (user_id, token, refresh_token, expires_at, refresh_expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, token, refreshToken, expiresAt, refreshExpiresAt]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        kycStatus: user.kyc_status,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        twoFactorEnabled: user.two_factor_enabled,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      token,
    };
  });
};

// Login user
export const login = async (data: LoginRequest): Promise<{ user: User; token: string }> => {
  // Find user
  const result = await query(
    `SELECT id, email, phone, password_hash, first_name, last_name, role, status, 
            kyc_status, email_verified, phone_verified, two_factor_enabled, 
            login_attempts, locked_until
     FROM users WHERE email = $1`,
    [data.email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new AppError('Account is temporarily locked. Please try again later.', 423);
  }

  // Check if account is active
  if (user.status !== 'active') {
    throw new AppError('Account is not active', 403);
  }

  // Verify password
  const isPasswordValid = await verifyPassword(data.password, user.password_hash);

  if (!isPasswordValid) {
    // Increment login attempts
    const attempts = user.login_attempts + 1;
    let lockedUntil = null;

    if (attempts >= 5) {
      // Lock account for 30 minutes
      lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 30);
    }

    await query(
      'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
      [attempts, lockedUntil, user.id]
    );

    throw new AppError('Invalid email or password', 401);
  }

  // Reset login attempts and update last login
  await query(
    'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate JWT token
  const token = generateToken(
    { userId: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    env.JWT_EXPIRATION
  );

  // Generate refresh token
  const refreshToken = generateToken(
    { userId: user.id },
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRATION
  );

  // Store tokens
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

  await query(
    `INSERT INTO session_tokens (user_id, token, refresh_token, expires_at, refresh_expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, token, refreshToken, expiresAt, refreshExpiresAt]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      kycStatus: user.kyc_status,
      emailVerified: user.email_verified,
      phoneVerified: user.phone_verified,
      twoFactorEnabled: user.two_factor_enabled,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
    token,
  };
};

// Logout user
export const logout = async (token: string): Promise<void> => {
  await query(
    'UPDATE session_tokens SET is_revoked = true, revoked_at = CURRENT_TIMESTAMP WHERE token = $1',
    [token]
  );
};

// Get user profile
export const getProfile = async (userId: string): Promise<any> => {
  const result = await query(
    `SELECT u.id, u.email, u.phone, u.first_name, u.last_name, u.date_of_birth, 
            u.national_id, u.role, u.status, u.kyc_status, u.email_verified, 
            u.phone_verified, u.two_factor_enabled, u.created_at, u.updated_at,
            p.address_line1, p.address_line2, p.city, p.state, p.postal_code, 
            p.country, p.occupation, p.employer_name, p.monthly_income, 
            p.bank_name, p.bank_account_number, p.bank_branch,
            p.next_of_kin_name, p.next_of_kin_phone, p.next_of_kin_relationship
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  return result.rows[0];
};

// Update user profile
export const updateProfile = async (userId: string, data: any): Promise<any> => {
  return transaction(async (client: PoolClient) => {
    // Update user table if basic info is provided
    if (data.firstName || data.lastName || data.dateOfBirth || data.nationalId) {
      await client.query(
        `UPDATE users SET 
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          date_of_birth = COALESCE($3, date_of_birth),
          national_id = COALESCE($4, national_id)
         WHERE id = $5`,
        [data.firstName, data.lastName, data.dateOfBirth, data.nationalId, userId]
      );
    }

    // Update profile table
    await client.query(
      `UPDATE user_profiles SET
        address_line1 = COALESCE($1, address_line1),
        address_line2 = COALESCE($2, address_line2),
        city = COALESCE($3, city),
        state = COALESCE($4, state),
        postal_code = COALESCE($5, postal_code),
        country = COALESCE($6, country),
        occupation = COALESCE($7, occupation),
        employer_name = COALESCE($8, employer_name),
        monthly_income = COALESCE($9, monthly_income),
        bank_name = COALESCE($10, bank_name),
        bank_account_number = COALESCE($11, bank_account_number),
        bank_branch = COALESCE($12, bank_branch),
        next_of_kin_name = COALESCE($13, next_of_kin_name),
        next_of_kin_phone = COALESCE($14, next_of_kin_phone),
        next_of_kin_relationship = COALESCE($15, next_of_kin_relationship)
       WHERE user_id = $16`,
      [
        data.addressLine1, data.addressLine2, data.city, data.state, data.postalCode,
        data.country, data.occupation, data.employerName, data.monthlyIncome,
        data.bankName, data.bankAccountNumber, data.bankBranch,
        data.nextOfKinName, data.nextOfKinPhone, data.nextOfKinRelationship,
        userId,
      ]
    );

    return getProfile(userId);
  });
};

export default {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
};
