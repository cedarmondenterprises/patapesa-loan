# PataPesa Loan Platform

PataPesa is a working full-stack loan application portal for Kenya. Customers can create accounts, compare seeded loan products, submit identity details, apply for a loan, track applications, view payment history, and create persistent support requests.

## Stack

- Next.js 14, React, TypeScript and Tailwind CSS
- Express, TypeScript and PostgreSQL
- JWT authentication with bcrypt password hashing
- Docker Compose for a reproducible deployment

## Run with Docker

1. Copy `.env.example` to `.env` and replace every production secret.
2. Run `docker compose up --build -d`.
3. Open `http://localhost:3000`.
4. Check API health at `http://localhost:5000/api/health`.

PostgreSQL runs `backend/schema.sql` on its first start. The schema creates the tables and three active loan products. If an existing database volume predates a schema change, apply the SQL migration manually or recreate only the development database volume.

## Run locally

```bash
cd backend
npm ci
npm run build
npm start
```

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

The frontend expects `NEXT_PUBLIC_API_URL=http://localhost:5000/api`. The API expects PostgreSQL configuration and a strong `JWT_SECRET`.

## Implemented API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET|POST /api/loans/applications`
- `GET|POST /api/kyc`
- `GET /api/payments`
- `POST /api/contact`

Protected routes require `Authorization: Bearer <token>`.

## Production checklist

- Use a long random `JWT_SECRET`; the server refuses the bundled development value in production.
- Set exact allowed frontend origins in `CORS_ORIGIN`.
- Set `DB_SSL=true` when required by the PostgreSQL provider.
- Terminate TLS at the hosting platform or reverse proxy.
- Complete your lending licence, disclosures, underwriting, data-protection procedures and payment-provider approval before offering credit to the public.
