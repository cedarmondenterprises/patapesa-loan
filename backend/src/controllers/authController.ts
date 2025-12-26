import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../utils/logger';
import { getDatabase } from '../config/database';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const db = getDatabase();

    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email or phone already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const result = await db.queryOne(
      `INSERT INTO users (id, first_name, last_name, email, phone, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, email, first_name, last_name, phone, role`,
      [userId, firstName, lastName, email, phone, hashedPassword, 'customer']
    );

    logger.info(`User registered: ${email}`);
    res.status(201).json({ success: true, message: 'Registration successful', data: { user: result } });
  } catch (error) {
    logger.error('Registration error', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    const user = await db.queryOne(
      'SELECT id, email, password, role, first_name, last_name FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    logger.info(`User logged in: ${email}`);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { accessToken, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role } }
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const db = getDatabase();

    const user = await db.queryOne('SELECT id FROM users WHERE email = $1', [email]);

    if (user) {
      const resetCode = crypto.randomInt(100000, 999999).toString();
      const codeExpiry = new Date(Date.now() + 30 * 60 * 1000);
      await db.query(
        `INSERT INTO verification_codes (user_id, code, type, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW())`,
        [user.id, resetCode, 'password_reset', codeExpiry]
      );
      logger.info(`Password reset code sent to: ${email}`);
    }

    res.status(200).json({ success: true, message: 'If email exists, password reset code has been sent' });
  } catch (error) {
    logger.error('Forgot password error', error);
    res.status(500).json({ success: false, message: 'Password reset request failed' });
  }
};

export const verifyCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    const db = getDatabase();

    const result = await db.queryOne(
      `SELECT u.id, vc.id as code_id, vc.expires_at FROM users u
       JOIN verification_codes vc ON u.id = vc.user_id
       WHERE u.email = $1 AND vc.code = $2 AND vc.type = 'password_reset'`,
      [email, code]
    );

    if (!result || new Date(result.expires_at) < new Date()) {
      res.status(400).json({ success: false, message: 'Invalid or expired code' });
      return;
    }

    logger.info(`Code verified for: ${email}`);
    res.status(200).json({ success: true, message: 'Code verified successfully' });
  } catch (error) {
    logger.error('Code verification error', error);
    res.status(500).json({ success: false, message: 'Code verification failed' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;
    const db = getDatabase();

    const result = await db.queryOne(
      `SELECT u.id, vc.id as code_id, vc.expires_at FROM users u
       JOIN verification_codes vc ON u.id = vc.user_id
       WHERE u.email = $1 AND vc.code = $2 AND vc.type = 'password_reset'`,
      [email, code]
    );

    if (!result || new Date(result.expires_at) < new Date()) {
      res.status(400).json({ success: false, message: 'Invalid or expired code' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, result.id]);
    await db.query('DELETE FROM verification_codes WHERE id = $1', [result.code_id]);

    logger.info(`Password reset: ${email}`);
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    logger.error('Password reset error', error);
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const db = getDatabase();
    const user = await db.queryOne(
      `SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    logger.error('Get profile error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info(`User logged out: ${req.user?.email}`);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};
