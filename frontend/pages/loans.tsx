import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Card, Button, Badge, Container, Row, Col, Modal, Form } from 'react-bootstrap';
import styles from '../styles/Loans.module.css';

interface LoanProduct {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  tenureMonths: number;
  processingFee: number;
  eligibility: string[];
  features: string[];
  icon: string;
}

const LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: 'personal-loan',
    name: 'Personal Loan',
    description: 'Quick personal loans for any need without collateral',
    minAmount: 5000,
    maxAmount: 500000,
    interestRate: 12.5,
    tenureMonths: 12,
    processingFee: 1.5,
    eligibility: [
      'Age 21-65 years',
      'Stable income (minimum 15,000 KES/month)',
      'Valid ID and proof of residence',
      'Active bank account for 6+ months'
    ],
    features: [
      'No collateral required',
      'Instant approval up to 2 hours',
      'Flexible repayment terms',
      'Easy application process'
    ],
    icon: '💳'
  },
  {
    id: 'business-loan',
    name: 'Business Loan',
    description: 'Funding for your growing business needs',
    minAmount: 50000,
    maxAmount: 5000000,
    interestRate: 14.0,
    tenureMonths: 24,
    processingFee: 2.5,
    eligibility: [
      'Business registered with CAK/BRELA',
      'Business operational for 12+ months',
      'Annual turnover minimum 500,000 KES',
      'Valid business license and tax compliance'
    ],
    features: [
      'Flexible loan amounts',
      'Extended repayment period',
      'Business advisory support',
      'Quick turnaround time'
    ],
    icon: '📊'
  },
  {
    id: 'emergency-loan',
    name: 'Emergency Loan',
    description: 'Urgent financial assistance when you need it most',
    minAmount: 1000,
    maxAmount: 100000,
    interestRate: 15.0,
    tenureMonths: 6,
    processingFee: 2.0,
    eligibility: [
      'Age 18+ years',
      'Active mobile money account',
      'Valid ID document',
      'Stable employment or income source'
    ],
    features: [
      'Ultra-fast approval',
      'Funds within 30 minutes',
      'Minimal documentation',
      'Available 24/7'
    ],
    icon: '🚨'
  },
  {
    id: 'education-loan',
    name: 'Education Loan',
    description: 'Finance your education and skill development',
    minAmount: 10000,
    maxAmount: 1000000,
    interestRate: 8.5,
    tenureMonths: 36,
    processingFee: 1.0,
    eligibility: [
      'Admission letter from recognized institution',
      'Age 18-40 years',
      'Valid ID and proof of residence',
      'Guarantor with stable income'
    ],
    features: [
      'Lowest interest rates',
      'Grace period of 6 months',
      'Direct disbursement to institution',
      'Flexible repayment options'
    ],
    icon: '🎓'
  },
  {
    id: 'home-loan',
    name: 'Home Loan',
    description: 'Own your dream home with affordable financing',
    minAmount: 500000,
    maxAmount: 50000000,
    interestRate: 9.5,
    tenureMonths: 240,
    processingFee: 1.2,
    eligibility: [
      'Employed or self-employed',
      'Stable income for 24+ months',
      'Property valuation and title deed',
      'Monthly income minimum 50,000 KES'
    ],
    features: [
      'Competitive interest rates',
      'Long repayment tenure',
      'Insurance coverage included',
      'Property protection guarantee'
    ],
    icon: '🏠'
  },
  {
    id: 'auto-loan',
    name: 'Auto Loan',
    description: 'Get your dream vehicle with easy financing',
    minAmount: 100000,
    maxAmount: 5000000,
    interestRate: 11.0,
    tenureMonths: 60,
    processingFee: 1.8,
    eligibility: [
      'Valid driving license',
      'Stable employment',
      'Valid ID document',
      'Monthly income minimum 30,000 KES'
    ],
    features: [
      'Comprehensive vehicle insurance',
      'Competitive rates',
      'Quick vehicle registration',
      'Loan protection cover'
    ],
    icon: '🚗'
  }
];

interface LoanDetailsModalProps {
  product: LoanProduct | null;
  show: boolean;
  onHide: () => void;
}

const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({ product, show, onHide }) => {
  if (!product) return null;

  const monthlyPayment = calculateMonthlyPayment(
    product.maxAmount,
    product.interestRate,
    product.tenureMonths
  );

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{product.icon} {product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">{product.description}</p>
        
        <h6 className="mt-4 mb-3">Loan Terms</h6>
        <Row className="mb-4">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-bold">Loan Amount Range</Form.Label>
              <p>KES {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}</p>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-bold">Interest Rate</Form.Label>
              <p>{product.interestRate}% per annum</p>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-bold">Tenure</Form.Label>
              <p>{product.tenureMonths} months</p>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-bold">Processing Fee</Form.Label>
              <p>{product.processingFee}% of loan amount</p>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-4">
          <Form.Label className="fw-bold">Sample Monthly Payment</Form.Label>
          <p>For maximum amount: <strong>KES {formatCurrency(monthlyPayment)}/month</strong></p>
        </Form.Group>

        <h6 className="mb-3">Eligibility Requirements</h6>
        <ul className="mb-4">
          {product.eligibility.map((req, idx) => (
            <li key={idx}>{req}</li>
          ))}
        </ul>

        <h6 className="mb-3">Key Features</h6>
        <ul>
          {product.features.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Link href={`/apply?product=${product.id}`}>
          <Button variant="primary">Apply Now</Button>
        </Link>
      </Modal.Footer>
    </Modal>
  );
};

const LoansPage: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleViewDetails = (product: LoanProduct) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  return (
    <>
      <Head>
        <title>Loan Products - Patapesa</title>
        <meta name="description" content="Explore our range of loan products and find the right financial solution for your needs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        <Container className="py-5">
          {/* Header Section */}
          <div className={styles.headerSection}>
            <h1 className="display-4 fw-bold mb-3">Our Loan Products</h1>
            <p className="lead text-muted mb-4">
              Choose from our wide range of loan products tailored to meet your financial needs
            </p>
          </div>

          {/* Loan Products Grid */}
          <Row className="g-4">
            {LOAN_PRODUCTS.map((product) => (
              <Col lg={4} md={6} key={product.id}>
                <Card className={`${styles.loanCard} h-100 shadow-sm`}>
                  <Card.Body className="d-flex flex-column">
                    <div className={styles.cardIcon}>{product.icon}</div>
                    <Card.Title className="h5 mt-3">{product.name}</Card.Title>
                    <Card.Text className="text-muted small flex-grow-1">
                      {product.description}
                    </Card.Text>

                    <div className={styles.loanTerms}>
                      <div className={styles.termItem}>
                        <span className="text-muted small">Amount</span>
                        <strong>KES {formatCurrency(product.minAmount)}</strong>
                      </div>
                      <div className={styles.termItem}>
                        <span className="text-muted small">Interest Rate</span>
                        <strong>{product.interestRate}%</strong>
                      </div>
                      <div className={styles.termItem}>
                        <span className="text-muted small">Tenure</span>
                        <strong>{product.tenureMonths}M</strong>
                      </div>
                    </div>

                    <div className="mt-4 d-grid gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewDetails(product)}
                      >
                        View Details
                      </Button>
                      <Link href={`/apply?product=${product.id}`}>
                        <Button variant="primary" size="sm" className="w-100">
                          Apply Now
                        </Button>
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* FAQ Section */}
          <div className={styles.faqSection}>
            <h3 className="mt-5 mb-4 text-center">Frequently Asked Questions</h3>
            <Row>
              <Col lg={8} className="mx-auto">
                <div className={styles.faqItem}>
                  <h6>How long does loan approval take?</h6>
                  <p>Most loans are approved within 2 hours. Emergency loans are processed within 30 minutes.</p>
                </div>
                <div className={styles.faqItem}>
                  <h6>What documents do I need?</h6>
                  <p>Generally, you'll need a valid ID, proof of income, and proof of residence. Specific requirements vary by loan type.</p>
                </div>
                <div className={styles.faqItem}>
                  <h6>Can I repay early without penalties?</h6>
                  <p>Yes! We encourage early repayment without any additional charges or penalties.</p>
                </div>
                <div className={styles.faqItem}>
                  <h6>Is there a maximum loan amount?</h6>
                  <p>Yes, maximum amounts vary by product. Check individual product details for specific limits.</p>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </div>

      <LoanDetailsModal
        product={selectedProduct}
        show={showModal}
        onHide={() => setShowModal(false)}
      />
    </>
  );
};

/**
 * Calculate monthly payment using amortization formula
 * P * [r(1+r)^n] / [(1+r)^n - 1]
 */
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  
  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);
  
  return monthlyPayment;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export default LoansPage;
