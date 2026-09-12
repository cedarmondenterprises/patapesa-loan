# PataPesa Loan Platform

PataPesa is a full-stack Kenyan loan-application portal. Customers can register, submit encrypted identity details, compare loan products, apply, track applications, inspect payment history, recover accounts, and create support requests.

## Architecture

- Caddy terminates HTTPS and is the only public application service.
- Next.js serves the frontend and proxies same-origin `/api` requests internally.
- Express provides the API and issues signed sessions in Secure, HttpOnly cookies.
- PostgreSQL stores application data on a private Docker network.
- The API converges the idempotent schema on startup under a PostgreSQL advisory lock.

The database and API have no public host ports. This avoids the former browser bug where visitors were sent to `localhost:5000` on their own device.

## Azure VM deployment

Prerequisites: an Ubuntu Azure VM, Docker Engine with the Compose plugin, a domain whose A record points to the VM, and inbound NSG rules for TCP 80/443 plus UDP 443. Restrict SSH (22) to your administrator IP.

```bash
git clone https://github.com/cedarmondenterprises/patapesa-loan.git
cd patapesa-loan
cp .env.example .env
openssl rand -hex 48   # generate DB_PASSWORD
openssl rand -hex 48   # generate JWT_SECRET
openssl rand -hex 48   # generate a separate KYC_ENCRYPTION_KEY
chmod 600 .env
```

Edit `.env`, set the domain and generated secrets, then configure SMTP. Password recovery requires working SMTP settings.

```bash
docker compose config
docker compose build --pull
docker compose up -d
docker compose ps
curl -fsS https://YOUR_DOMAIN/api/health
```

Caddy obtains and renews the TLS certificate automatically after DNS and ports are correct.

## First staff account

Create the staff member through the normal registration page, then grant the built-in platform administrator role from the VM:

```bash
docker compose exec backend npm run admin:grant -- staff@example.com
```

That user can sign in normally and open `https://YOUR_DOMAIN/admin` to review pending identity submissions and loan applications. Do not share staff accounts.

## Updating safely

Back up first, then pull, rebuild, and verify health:

```bash
docker compose exec -T postgres pg_dump -U patapesa -d patapesa_db -Fc > patapesa-$(date +%F).dump
git pull --ff-only
docker compose build --pull
docker compose up -d
docker compose ps
```

Keep `KYC_ENCRYPTION_KEY` stable and backed up securely: changing or losing it makes new encrypted identity values unusable. Never commit `.env` or database dumps.

## Local development

Start PostgreSQL locally and configure `backend/.env`, then:

```bash
cd backend
npm ci
npm run build
npm test
npm run dev
```

In another terminal:

```bash
cd frontend
npm ci
BACKEND_URL=http://localhost:5000 npm run dev
```

Open `http://localhost:3000`. The browser uses `/api`; the Next.js server forwards those calls to the API.

## API surface

- `GET /api/health` and `GET /api/health/live`
- `POST /api/auth/register`, `/login`, `/logout`
- `POST /api/auth/forgot-password`, `/reset-password`
- `GET /api/auth/me`
- `GET /api/products`
- `GET|POST /api/loans/applications`
- `GET|POST /api/kyc`
- `GET /api/payments`
- `POST /api/contact`
- `GET|PATCH /api/admin/applications` (staff permission required)
- `GET|PATCH /api/admin/kyc` (staff permission required)

## Release checks

```bash
cd backend && npm ci && npm run build && npm test && npm run lint && npm audit --omit=dev
cd ../frontend && npm ci && npm run type-check && npm run lint && npm run build && npm audit --omit=dev
```

Technical hardening does not replace lending authorization, customer disclosures, underwriting, complaints handling, data-protection impact assessment, retention rules, payment-provider approval, monitoring, backups, or an internal staff workflow. Complete those operational and legal controls before accepting real customers or money.
