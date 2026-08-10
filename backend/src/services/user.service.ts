import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateToken, generateUniqueCode } from '../utils/helpers';
import { User } from '../types';
import logger from '../utils/logger';
import { cacheSet, cacheGet, cacheDelete } from '../config/redis';

export class UserService {
  static async createUser(email: string, phone: string, firstName: string, lastName: string, password: string, dateOfBirth?: Date, nationality?: string): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO users (email, phone, password_hash, first_name, last_name, date_of_birth, nationality, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [email, phone, hashedPassword, firstName, lastName, dateOfBirth, nationality],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      const cacheKey = `user:${userId}`;
      const cachedUser = await cacheGet(cacheKey);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      await cacheSet(cacheKey, JSON.stringify(user), 3600);
      return user;
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  static async validatePassword(userId: string, password: string): Promise<boolean> {
    try {
      const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        return false;
      }
      return bcrypt.compare(password, result.rows[0].password_hash);
    } catch (error) {
      logger.error('Error validating password:', error);
      return false;
    }
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'id' && key !== 'passwordHash') {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      values.push(userId);
      const result = await query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
        values,
      );

      if (result.rows.length > 0) {
        await cacheDelete(`user:${userId}`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  static async verifyEmail(userId: string): Promise<void> {
    try {
      await query(
        'UPDATE users SET is_email_verified = true, email_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId],
      );
      await cacheDelete(`user:${userId}`);
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  static async verifyPhone(userId: string): Promise<void> {
    try {
      await query(
        'UPDATE users SET is_phone_verified = true, phone_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId],
      );
      await cacheDelete(`user:${userId}`);
    } catch (error) {
      logger.error('Error verifying phone:', error);
      throw error;
    }
  }
}