import React, { useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Send
} from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  category: string;
  priority: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

const ContactSupport: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    category: '',
    priority: 'normal',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const supportCategories = [
    { value: 'account', label: 'Account Issues' },
    { value: 'loan', label: 'Loan Application' },
    { value: 'payment', label: 'Payment Problems' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing Questions' },
    { value: 'other', label: 'Other' },
  ];

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit request. Please try again.');
      }

      setSuccessMessage(
        'Your support request has been submitted successfully! Our team will respond within 24 hours.'
      );
      setFormData({
        name: '',
        email: '',
        category: '',
        priority: 'normal',
        message: '',
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Contact Support - Patapesa Loan" description="Get help from our customer support team">
      <div className="py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Customer Support
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Need help? Our support team is here to assist you with any questions or issues.
          </p>
        </section>

        {/* Quick Contact Options */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <a
            href="tel:+254700000000"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-blue-100 text-sm">Call Us</span>
            </div>
            <h3 className="text-xl font-bold mb-1">+254 700 000 000</h3>
            <p className="text-blue-100 text-sm">Mon-Fri 8am-6pm</p>
          </a>

          <a
            href="mailto:support@patapesaloan.co.ke"
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-green-100 text-sm">Email Us</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Email Support</h3>
            <p className="text-green-100 text-sm">24h response time</p>
          </a>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-purple-100 text-sm">Coming Soon</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Live Chat</h3>
            <p className="text-purple-100 text-sm">Instant support</p>
          </div>
        </section>

        {/* Support Hours */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Support Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium">Phone Support</p>
                  <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p>Saturday: 9:00 AM - 1:00 PM</p>
                </div>
                <div>
                  <p className="font-medium">Email Support</p>
                  <p>24/7 - We respond within 24 hours</p>
                </div>
                <div>
                  <p className="font-medium">Emergency</p>
                  <p>For urgent issues, please call our hotline</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Request Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit a Support Request</h2>
              <p className="text-gray-600 mb-6">
                Fill out the form below and our team will get back to you as soon as possible.
              </p>

              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                        errors.name
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                        errors.email
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                        errors.category
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Select a category</option>
                      {supportCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Describe Your Issue *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none ${
                      errors.message
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 bg-white'
                    } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="Please provide as much detail as possible about your issue..."
                  ></textarea>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Request</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Common Issues */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Issues</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/faq" className="text-blue-600 hover:text-blue-700 text-sm hover:underline">
                    How to apply for a loan
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-blue-600 hover:text-blue-700 text-sm hover:underline">
                    Password reset instructions
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-blue-600 hover:text-blue-700 text-sm hover:underline">
                    Payment methods
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-blue-600 hover:text-blue-700 text-sm hover:underline">
                    Loan approval timeline
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-blue-600 hover:text-blue-700 text-sm hover:underline">
                    View all FAQs →
                  </a>
                </li>
              </ul>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Emergency Contact</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    For urgent security or fraud-related issues, contact us immediately:
                  </p>
                  <a
                    href="tel:+254700000000"
                    className="text-red-600 font-semibold hover:underline"
                  >
                    +254 700 000 000
                  </a>
                </div>
              </div>
            </div>

            {/* Additional Resources */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <a href="/faq" className="hover:text-blue-600">FAQ</a>
                </li>
                <li>
                  <a href="/loans" className="hover:text-blue-600">Loan Products</a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-blue-600">Terms of Service</a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-blue-600">Privacy Policy</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactSupport;
