import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserService } from '../services/user.service';
import { sendResponse, sendErrorResponse, generateToken } from '../utils/helpers';
import logger from '../utils/logger';
import { validateEmail, validatePhoneNumber, validatePassword } from '../utils/validators';

export class AuthController {
  static async register(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { email, phone, firstName, lastName, password, dateOfBirth, nationality } = req.body;

      if (!validateEmail(email)) {
        return sendErrorResponse(res, 400, 'INVALID_EMAIL', 'Invalid email format');
      }

      if (!validatePhoneNumber(phone)) {
        return sendErrorResponse(res, 400, 'INVALID_PHONE', 'Invalid phone number format');
      }

      if (!validatePassword(password)) {
        return sendErrorResponse(res, 400, 'WEAK_PASSWORD', 'Password does not meet security requirements');
      }

      const existingUser = await UserService.getUserByEmail(email);
      if (existingUser) {
        return sendErrorResponse(res, 409, 'USER_EXISTS', 'Email already registered');
      }

      const user = await UserService.createUser(email, phone, firstName, lastName, password, dateOfBirth, nationality);
      const token = generateToken({ userId: user.id, email: user.email });

      return sendResponse(res, 201, true, 'User registered successfully', {
        user,
        token,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      return sendErrorResponse(res, 500, 'REGISTRATION_ERROR', 'Failed to register user');
    }
  }

  static async login(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      const user = await UserService.getUserByEmail(email);
      if (!user) {
        return sendErrorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      const isValidPassword = await UserService.validatePassword(user.id, password);
      if (!isValidPassword) {
        return sendErrorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      const token = generateToken({ userId: user.id, email: user.email });

      return sendResponse(res, 200, true, 'Login successful', {
        user,
        token,
      });
    } catch (error) {
      logger.error('Login error:', error);
      return sendErrorResponse(res, 500, 'LOGIN_ERROR', 'Failed to login');
    }
  }

  static async getCurrentUser(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return sendErrorResponse(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const user = await UserService.getUserById(req.userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
      }

      return sendResponse(res, 200, true, 'User retrieved successfully', user);
    } catch (error) {
      logger.error('Get current user error:', error);
      return sendErrorResponse(res, 500, 'FETCH_ERROR', 'Failed to fetch user');
    }
  }
}