'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  error?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate form fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, emailRegex]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // API call to login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || 'Login failed. Please try again.'
        );
        setErrors((prev) => ({
          ...prev,
          general: data.message || 'Login failed. Please try again.',
        }));
      } else {
        setSuccessMessage('Login successful! Redirecting...');
        
        // Store token if remember me is checked
        if (formData.rememberMe && data.data?.token) {
          localStorage.setItem('authToken', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
        } else if (data.data?.token) {
          // Store in session storage only
          sessionStorage.setItem('authToken', data.data.token);
          sessionStorage.setItem('user', JSON.stringify(data.data.user));
        }

        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setErrorMessage(errorMsg);
      setErrors((prev) => ({
        ...prev,
        general: errorMsg,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4 md:p-8">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main container */}
      <div className="w-full max-w-md relative z-10">
        {/* Card container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          {/* Header section */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-12 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-white rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V7" />
                <path d="M13.5 1.5v4.5h4.5" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-green-100 text-sm">
              Sign in to access your loan account
            </p>
          </div>

          {/* Form section */}
          <div className="px-8 py-10">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                    errors.email
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-gray-200 bg-gray-50 focus:border-green-500 focus:bg-white'
                  } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                      errors.password
                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                        : 'border-gray-200 bg-gray-50 focus:border-green-500 focus:bg-white'
                    } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200 hover:underline"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer section */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-green-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-green-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Additional help text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link
              href="/contact-support"
              className="text-green-600 hover:text-green-700 font-medium hover:underline"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>

      {/* Tailwind CSS animation styles (add to global CSS if not present) */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
