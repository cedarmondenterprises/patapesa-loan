import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Loader } from 'lucide-react';

interface FormErrors {
  email?: string;
  general?: string;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear errors when user starts typing
    if (errors.email) {
      setErrors({});
    }
    if (errorMessage) {
      setErrorMessage('');
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
      // API call to forgot password endpoint
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || 'Failed to send reset email. Please try again.'
        );
      } else {
        setSuccessMessage(
          'Password reset instructions have been sent to your email.'
        );
        setEmailSent(true);
        setEmail('');
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'An error occurred. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 md:p-8">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main container */}
      <div className="w-full max-w-md relative z-10">
        {/* Back to login link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to login</span>
        </Link>

        {/* Card container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          {/* Header section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-white rounded-full">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {emailSent ? 'Check Your Email' : 'Forgot Password?'}
            </h1>
            <p className="text-blue-100 text-sm">
              {emailSent
                ? "We've sent you reset instructions"
                : "Don't worry, we'll help you reset it"}
            </p>
          </div>

          {/* Form section */}
          <div className="px-8 py-10">
            {emailSent ? (
              // Success state
              <div className="text-center">
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-sm text-green-800 mb-2">
                    Password reset instructions have been sent to your email address.
                  </p>
                  <p className="text-xs text-gray-600">
                    Please check your inbox and follow the link to reset your password.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Didn't receive the email?{' '}
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setSuccessMessage('');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Try again
                    </button>
                  </p>

                  <Link
                    href="/login"
                    className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-center"
                  >
                    Return to Login
                  </Link>
                </div>
              </div>
            ) : (
              // Form state
              <>
                {/* Info message */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Enter your email address and we'll send you instructions to reset
                    your password.
                  </p>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{errorMessage}</p>
                  </div>
                )}

                {/* Reset Password Form */}
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
                      value={email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="Enter your email"
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                        errors.email
                          ? 'border-red-400 bg-red-50 focus:border-red-500'
                          : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white'
                      } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      'Send Reset Instructions'
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

                  {/* Links */}
                  <div className="text-center space-y-2">
                    <p className="text-gray-600 text-sm">
                      Remember your password?{' '}
                      <Link
                        href="/login"
                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
                      >
                        Sign in
                      </Link>
                    </p>
                    <p className="text-gray-600 text-sm">
                      Don't have an account?{' '}
                      <Link
                        href="/register"
                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer section */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Need help?{' '}
              <Link
                href="/contact-support"
                className="text-blue-600 hover:underline"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Tailwind CSS animation styles */}
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
