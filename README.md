# Patapesa Loan - Sandbox Digital Lending Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)

## Overview

**Patapesa Loan** is a modern, secure sandbox digital lending platform designed to facilitate rapid prototyping, testing, and deployment of loan origination and management services. Built with a microservices architecture, Patapesa Loan provides financial institutions and fintech companies with a scalable foundation for digital lending operations.

The platform enables seamless loan application processing, credit assessment, disbursement, and repayment management while maintaining compliance with global financial regulations.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Compliance & Security](#compliance--security)
- [Testing](#testing)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## Features

### Core Lending Features
- **Loan Application Management**: Complete loan lifecycle from application to closure
- **Digital KYC Integration**: Know Your Customer verification with document validation
- **Automated Credit Assessment**: Rule-based and ML-powered credit scoring
- **Instant Loan Origination**: Automated loan approval workflows
- **Multi-Currency Support**: Handle transactions in multiple currencies
- **Flexible Loan Products**: Configure custom loan terms, rates, and conditions
- **Repayment Management**: Automated payment scheduling and tracking

### Technical Features
- **RESTful APIs**: Comprehensive REST API for all lending operations
- **Webhook Support**: Real-time event notifications
- **Transaction Logging**: Complete audit trail for compliance
- **Role-Based Access Control (RBAC)**: Granular permission management
- **Rate Limiting**: Built-in API rate limiting and throttling
- **Encryption**: End-to-end encryption for sensitive data
- **High Availability**: Load-balanced, fault-tolerant architecture

### Admin & Reporting
- **Dashboard Analytics**: Real-time lending metrics and KPIs
- **Advanced Reporting**: Customizable loan portfolio reports
- **Bulk Operations**: Batch processing for loans and payments
- **Admin Portal**: Web-based administration interface
- **Audit Logs**: Complete transaction and system audit logs

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  (Web Portal, Mobile App, Partner Integrations)                 │
└────────────────┬──────────────────────────────┬─────────────────┘
                 │                              │
        ┌────────▼─────────┐         ┌──────────▼──────────┐
        │   API Gateway    │         │   Admin Portal      │
        │  (Authentication)│         │  (Dashboard)        │
        └────────┬─────────┘         └──────────┬──────────┘
                 │                              │
    ┌────────────┴───────────────────────────────┴──────────────┐
    │              Core Microservices Layer                     │
    │                                                           │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
    │  │   Loan       │  │   Credit     │  │  KYC        │   │
    │  │ Origination  │  │ Assessment   │  │ Verification│   │
    │  └──────────────┘  └──────────────┘  └──────────────┘   │
    │                                                           │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
    │  │  Repayment   │  │ Notification │  │    User      │   │
    │  │ Management   │  │   Service    │  │  Management  │   │
    │  └──────────────┘  └──────────────┘  └──────────────┘   │
    │                                                           │
    └────────────┬──────────────────────────────┬──────────────┘
                 │                              │
        ┌────────▼─────────┐         ┌──────────▼──────────┐
        │   Data Layer     │         │  External Services  │
        │ (PostgreSQL,     │         │  (Payment Gateways, │
        │  Redis Cache)    │         │   SMS, Email)       │
        └──────────────────┘         └─────────────────────┘
```

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Node.js/Python, Express.js/FastAPI |
| **Database** | PostgreSQL (primary), Redis (caching) |
| **Message Queue** | RabbitMQ/Kafka |
| **API Gateway** | Kong/AWS API Gateway |
| **Authentication** | JWT, OAuth 2.0 |
| **Container** | Docker, Kubernetes |
| **Monitoring** | ELK Stack, Prometheus, Grafana |
| **Version Control** | Git |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose (v20.10+)
- Node.js (v16+) or Python (v3.9+)
- PostgreSQL (v12+)
- Redis (v6+)
- Git

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/cedarmondenterprises/patapesa-loan.git
cd patapesa-loan
```

#### 2. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=patapesa_loan
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h

# API Configuration
API_PORT=3000
API_URL=http://localhost:3000

# Environment
NODE_ENV=development
LOG_LEVEL=debug
```

#### 3. Start Services with Docker Compose
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- RabbitMQ message broker
- Patapesa Loan API server

#### 4. Initialize Database
```bash
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:seed
```

#### 5. Verify Installation
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T22:20:48Z",
  "version": "1.0.0"
}
```

### First Loan Application

```bash
# Create a test user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+254712345678",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Submit a loan application
curl -X POST http://localhost:3000/api/v1/loans/applications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loanAmount": 50000,
    "currency": "KES",
    "loanTerm": 12,
    "purpose": "Business Expansion",
    "productId": "loan_product_001"
  }'
```

---

## API Documentation

### Authentication

All API requests require authentication via JWT token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Base URL
```
Production: https://api.patapesa-loan.com/api/v1
Sandbox: http://localhost:3000/api/v1
```

### Core Endpoints

#### Users & KYC

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create a new user |
| GET | `/users/{userId}` | Retrieve user details |
| PUT | `/users/{userId}` | Update user information |
| POST | `/users/{userId}/kyc/submit` | Submit KYC documents |
| GET | `/users/{userId}/kyc/status` | Check KYC verification status |

#### Loan Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/loans/applications` | Create new loan application |
| GET | `/loans/applications/{applicationId}` | Retrieve application details |
| GET | `/loans/applications` | List user's applications |
| POST | `/loans/applications/{applicationId}/submit` | Submit application for processing |
| GET | `/loans/applications/{applicationId}/status` | Check application status |

#### Loan Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/loans/{loanId}` | Retrieve loan details |
| GET | `/loans/{loanId}/schedule` | Get repayment schedule |
| POST | `/loans/{loanId}/payments` | Record a payment |
| GET | `/loans/{loanId}/payments` | List loan payments |
| POST | `/loans/{loanId}/reschedule` | Request repayment reschedule |

#### Credit Assessment

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/credit/score` | Calculate credit score |
| GET | `/credit/score/{userId}` | Retrieve user's credit score |
| POST | `/credit/rules/evaluate` | Evaluate custom credit rules |

#### Admin Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard/summary` | Get dashboard metrics |
| GET | `/admin/loans/portfolio` | View loan portfolio analytics |
| GET | `/admin/reports/daily` | Generate daily report |
| POST | `/admin/loans/{loanId}/approve` | Approve a loan application |
| POST | `/admin/loans/{loanId}/reject` | Reject a loan application |

### Example API Usage

#### Create User Account
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "phone": "+254712345678",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-05-15",
    "nationality": "KE"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "usr_1234567890",
    "email": "john@example.com",
    "createdAt": "2025-12-25T22:20:48Z"
  }
}
```

#### Submit Loan Application
```bash
curl -X POST http://localhost:3000/api/v1/loans/applications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loanAmount": 100000,
    "currency": "KES",
    "loanTerm": 12,
    "monthlyIncome": 50000,
    "employmentType": "SALARIED",
    "purpose": "Home Improvement",
    "productId": "prod_personal_loan_001"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "applicationId": "app_9876543210",
    "loanAmount": 100000,
    "status": "UNDER_REVIEW",
    "createdAt": "2025-12-25T22:20:48Z",
    "estimatedDecisionDate": "2025-12-27T22:20:48Z"
  }
}
```

#### Get Repayment Schedule
```bash
curl -X GET http://localhost:3000/api/v1/loans/ln_1234567890/schedule \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "loanId": "ln_1234567890",
    "totalAmount": 112000,
    "interestRate": 12,
    "schedule": [
      {
        "dueDate": "2026-01-25",
        "principalAmount": 8333.33,
        "interestAmount": 1000,
        "totalDue": 9333.33,
        "sequenceNumber": 1
      },
      {
        "dueDate": "2026-02-25",
        "principalAmount": 8333.33,
        "interestAmount": 900,
        "totalDue": 9233.33,
        "sequenceNumber": 2
      }
    ]
  }
}
```

### Error Handling

All errors follow a standard format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Loan amount must be between 5000 and 1000000",
    "details": [
      {
        "field": "loanAmount",
        "message": "Amount exceeds maximum limit"
      }
    ]
  }
}
```

### Webhook Events

The platform sends webhooks for important events:

```json
{
  "eventId": "evt_1234567890",
  "eventType": "loan.application.approved",
  "timestamp": "2025-12-25T22:20:48Z",
  "data": {
    "loanId": "ln_1234567890",
    "applicationId": "app_9876543210",
    "approvedAmount": 100000
  }
}
```

Supported events:
- `user.created`
- `kyc.verification.completed`
- `loan.application.submitted`
- `loan.application.approved`
- `loan.application.rejected`
- `loan.disbursed`
- `payment.received`
- `repayment.completed`

---

## Deployment

### Prerequisites for Deployment

- AWS/GCP/Azure account (or on-premise infrastructure)
- Docker and Kubernetes knowledge
- SSL/TLS certificates
- Domain name
- SMTP server for email notifications

### Production Deployment

#### Option 1: Docker Compose (Single Server)

Suitable for small to medium deployments:

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
```

#### Option 2: Kubernetes (Recommended for Scale)

Deploy to Kubernetes cluster:

```bash
# Create namespace
kubectl create namespace patapesa-loan

# Create secrets
kubectl create secret generic patapesa-secrets \
  --from-literal=db-password=YOUR_PASSWORD \
  --from-literal=jwt-secret=YOUR_SECRET \
  -n patapesa-loan

# Deploy application
kubectl apply -f k8s/deployment.yaml -n patapesa-loan
kubectl apply -f k8s/service.yaml -n patapesa-loan
kubectl apply -f k8s/ingress.yaml -n patapesa-loan

# Verify deployment
kubectl get pods -n patapesa-loan
kubectl get svc -n patapesa-loan
```

#### Option 3: Cloud Platform Deployment

**AWS Elastic Beanstalk:**
```bash
eb init -p node.js-16 patapesa-loan
eb create production-env
eb deploy
```

**Google Cloud Run:**
```bash
gcloud run deploy patapesa-loan \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Configuration for Production

Create `.env.production`:

```env
# Database (use managed service)
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=patapesa_production
DB_USER=prod_user
DB_PASSWORD=${DB_PASSWORD}
DB_POOL_SIZE=20
DB_SSL=true

# Redis (use managed service)
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_TLS=true

# JWT & Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=24h
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# API Configuration
API_PORT=3000
API_URL=https://api.patapesa-loan.com
CORS_ORIGINS=https://dashboard.patapesa-loan.com,https://app.patapesa-loan.com

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=${SENDGRID_API_KEY}
EMAIL_FROM=noreply@patapesa-loan.com

# SMS Service
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}

# Payment Gateway
PAYMENT_GATEWAY=stripe
STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
LOG_LEVEL=info
NODE_ENV=production
```

### Health Checks & Monitoring

```bash
# Check application health
curl https://api.patapesa-loan.com/api/v1/health

# Monitor performance
kubectl top nodes
kubectl top pods -n patapesa-loan

# View logs
kubectl logs -f deployment/patapesa-loan-api -n patapesa-loan
```

### Database Migrations

```bash
# Run migrations
npm run db:migrate:prod

# Rollback if needed
npm run db:rollback:prod

# Verify migration status
npm run db:status:prod
```

### SSL/TLS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.patapesa-loan.com;

    ssl_certificate /etc/ssl/certs/patapesa-loan.crt;
    ssl_certificate_key /etc/ssl/private/patapesa-loan.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Configuration

### Loan Product Configuration

Create loan products in `config/loan-products.json`:

```json
{
  "products": [
    {
      "productId": "personal_loan_001",
      "name": "Personal Loan",
      "minAmount": 5000,
      "maxAmount": 500000,
      "minTerm": 3,
      "maxTerm": 60,
      "interestRate": 12.5,
      "processingFee": 2.5,
      "currency": "KES",
      "requiresCollateral": false,
      "requiresGuarantor": false,
      "active": true
    },
    {
      "productId": "business_loan_001",
      "name": "Business Loan",
      "minAmount": 50000,
      "maxAmount": 5000000,
      "minTerm": 12,
      "maxTerm": 120,
      "interestRate": 10.0,
      "processingFee": 3.0,
      "currency": "KES",
      "requiresCollateral": true,
      "requiresGuarantor": true,
      "active": true
    }
  ]
}
```

### Credit Scoring Rules

Configure credit assessment in `config/credit-rules.json`:

```json
{
  "rules": [
    {
      "ruleId": "rule_income_check",
      "name": "Income Verification",
      "weight": 25,
      "conditions": [
        {
          "field": "monthlyIncome",
          "operator": "gte",
          "value": 20000
        }
      ],
      "points": 100
    },
    {
      "ruleId": "rule_debt_ratio",
      "name": "Debt-to-Income Ratio",
      "weight": 30,
      "conditions": [
        {
          "field": "debtToIncomeRatio",
          "operator": "lte",
          "value": 0.4
        }
      ],
      "points": 100
    }
  ]
}
```

---

## Compliance & Security

### Data Protection

- **Encryption in Transit**: TLS 1.2+ for all communications
- **Encryption at Rest**: AES-256 for sensitive data
- **PII Handling**: Compliance with GDPR and local data protection laws
- **Data Retention**: Configurable retention policies
- **Access Logs**: Complete audit trail of all data access

### Regulatory Compliance

#### Supported Jurisdictions
- **Kenya**: CBK (Central Bank of Kenya) regulations
- **Uganda**: BOU (Bank of Uganda) requirements
- **Tanzania**: BOT (Bank of Tanzania) standards
- **Rwanda**: NBR (National Bank of Rwanda) compliance

#### Compliance Features
- **Know Your Customer (KYC)**: Multi-level verification
- **Anti-Money Laundering (AML)**: Transaction monitoring
- **Customer Due Diligence (CDD)**: Enhanced verification for high-risk customers
- **Sanctions Screening**: OFAC/UN sanctions list checking
- **Beneficial Ownership**: Verification for corporate customers

### Security Best Practices

```yaml
Security Controls:
  Authentication:
    - JWT with expiration
    - Multi-factor authentication (MFA)
    - Session management with timeout
  
  Authorization:
    - Role-Based Access Control (RBAC)
    - Attribute-Based Access Control (ABAC)
    - Principle of least privilege
  
  Data Security:
    - Field-level encryption
    - Tokenization for sensitive data
    - Secure deletion protocols
  
  Network Security:
    - API rate limiting
    - DDoS protection
    - Web Application Firewall (WAF)
    - IP whitelisting support
  
  Monitoring:
    - Real-time security alerts
    - Intrusion detection
    - Vulnerability scanning
    - Security Information and Event Management (SIEM)
```

### Compliance Checklist

- [ ] PCI DSS compliance for payment handling
- [ ] GDPR compliance for EU customers
- [ ] Local banking regulation compliance
- [ ] SOC 2 Type II certification
- [ ] Regular security audits and penetration testing
- [ ] Data backup and disaster recovery plan
- [ ] Incident response procedures
- [ ] Privacy policy and terms of service

### Secrets Management

Store sensitive data securely:

```bash
# Using HashiCorp Vault
vault kv put secret/patapesa/prod \
  db_password=*** \
  jwt_secret=*** \
  api_keys=***

# Using AWS Secrets Manager
aws secretsmanager create-secret \
  --name patapesa/prod/db-password \
  --secret-string '***'

# Using Kubernetes Secrets
kubectl create secret generic patapesa-secrets \
  --from-literal=db-password=*** \
  -n patapesa-loan
```

---

## Testing

### Unit Testing

```bash
# Run all unit tests
npm run test:unit

# Run tests with coverage
npm run test:unit:coverage

# Watch mode for development
npm run test:unit:watch
```

### Integration Testing

```bash
# Run integration tests
npm run test:integration

# Run specific test suite
npm run test:integration -- --suite=loans

# Generate integration test report
npm run test:integration:report
```

### End-to-End Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run E2E tests
npm run test:e2e

# Run specific E2E suite
npm run test:e2e -- --suite=loan-application-flow

# Generate E2E report
npm run test:e2e:report
```

### Load Testing

```bash
# Using Artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/v1/health

# Using k6
k6 run tests/load/loan-application.js

# Using JMeter
jmeter -n -t tests/load/loan-api.jmx -l results.jtl -j jmeter.log
```

### Security Testing

```bash
# OWASP ZAP scanning
zaproxy -config api.disableAllProxySSLChecks=true \
  -cmd -quickurl http://localhost:3000/api/v1 \
  -quickout report.html

# Dependency vulnerability scanning
npm audit

# Code analysis with SonarQube
sonar-scanner \
  -Dsonar.projectKey=patapesa-loan \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000
```

### Sample Test Data

```bash
# Seed test database
npm run test:seed

# Clear test data
npm run test:clean

# Reset test environment
npm run test:reset
```

---

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

### Code Standards

- **Language**: JavaScript (ES6+) or Python 3.9+
- **Linting**: ESLint with Airbnb config
- **Formatting**: Prettier (2-space indentation)
- **Testing**: Minimum 80% code coverage
- **Documentation**: JSDoc comments for all functions

### Pull Request Process

1. Update documentation for any new features
2. Add/update tests as needed
3. Ensure all tests pass: `npm run test`
4. Run linter: `npm run lint`
5. Update CHANGELOG.md
6. Request review from maintainers

### Reporting Issues

- **Bug Reports**: Use GitHub Issues with reproduction steps
- **Security Issues**: Email security@cedarmondenterprises.com
- **Feature Requests**: Discuss in GitHub Discussions

---

## Support

### Getting Help

- **Documentation**: https://docs.patapesa-loan.com
- **API Reference**: https://api-docs.patapesa-loan.com
- **Community Forum**: https://community.patapesa-loan.com
- **Email Support**: support@cedarmondenterprises.com
- **Slack Community**: [Join Slack](https://patapesa-community.slack.com)

### Common Issues

**Issue**: Database connection timeout
```bash
# Solution: Check database credentials and network connectivity
docker-compose logs postgres
```

**Issue**: JWT token validation fails
```bash
# Solution: Ensure JWT_SECRET is set correctly
echo $JWT_SECRET
```

**Issue**: API rate limiting exceeded
```bash
# Solution: Implement exponential backoff in your requests
# Wait before retrying: 2^attempt seconds
```

### Performance Tuning

```bash
# Monitor database performance
npm run db:analyze

# Check API response times
npm run performance:test

# Optimize indexes
npm run db:optimize
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built by Cedarmond Enterprises
- Inspired by modern fintech platforms
- Community contributors and testers

---

## Changelog

### Version 1.0.0 (2025-12-25)
- Initial release
- Core lending platform features
- REST API implementation
- KYC integration
- Credit assessment system
- Repayment management

---

## Contact

**Cedarmond Enterprises**
- Website: https://cedarmondenterprises.com
- Email: info@cedarmondenterprises.com
- Support: support@cedarmondenterprises.com

---

**Last Updated**: 2025-12-25
**Maintained By**: Cedarmond Enterprises Development Team
