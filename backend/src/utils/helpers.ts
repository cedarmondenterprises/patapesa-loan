import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from './logger';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
): Response => {
  return res.status(statusCode).json({
    success,
    message,
    data: data || null,
    timestamp: new Date().toISOString(),
  });
};

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any,
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: details || null,
    },
    timestamp: new Date().toISOString(),
  });
};

export const generateToken = (payload: any, expiresIn?: string): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: expiresIn || env.JWT_EXPIRY,
  });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
};

export const generateUniqueCode = (length: number = 6): string => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase();
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/[^0-9+]/g, '');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[0-9]{7,15}$/;
  return phoneRegex.test(formatPhoneNumber(phone));
};

export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  monthlyTerm: number,
): number => {
  const monthlyRate = annualRate / 100 / 12;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, monthlyTerm);
  const denominator = Math.pow(1 + monthlyRate, monthlyTerm) - 1;
  return numerator / denominator;
};

export const calculateTotalInterest = (
  principal: number,
  monthlyPayment: number,
  monthlyTerm: number,
): number => {
  return monthlyPayment * monthlyTerm - principal;
};

export const formatCurrency = (amount: number, currency: string = 'KES'): string => {
  return `${currency} ${amount.toFixed(2)}`;
};