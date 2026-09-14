# PataPesa Loan Platform

PataPesa is a full-stack Kenyan loan-application portal. Customers can register, submit encrypted identity details, compare loan products, apply, track applications, inspect payment history, recover accounts, and create support requests.

## Architecture

- Caddy terminates HTTPS and is the only public application service.
- Separate Next.js services serve the customer portal and staff-only admin portal;
  each proxies same-origin `/api` requests internally.
- Express provides the API and issues signed sessions in Secure, HttpOnly cookies.
- PostgreSQL stores application data on a private Docker network.
- The API converges the idempotent schema on startup under a PostgreSQL advisory lock.

The database and API have no public host ports. This avoids the former browser bug where visitors were sent to `localhost:5000` on their own device.

## Azure VM deployment

Prerequisites: an Ubuntu Azure VM, Docker Engine with the Compose plugin, customer and admin hostnames whose A records point to the VM, and inbound NSG rules for TCP 80/443 plus UDP 443. Restrict SSH (22) to your administrator IP. The examples use `loans.example.com` and `admin.loans.example.com`.

```bash
git clone https://github.com/cedarmondenterprises/patapesa-loan.git
cd patapesa-loan
cp .env.example .env
openssl rand -hex 48   # generate DB_PASSWORD
openssl rand -hex 48   # generate JWT_SECRET
openssl rand -hex 48   # generate a separate KYC_ENCRYPTION_KEY
chmod 600 .env
```

Edit `.env`, set `DOMAIN` and `ADMIN_DOMAIN`, add the generated secrets, then configure SMTP. Password recovery requires working SMTP settings. Both DNS records must resolve to the VM before starting Caddy.

```bash
docker compose config
docker compose build --pull
docker compose up -d
docker compose ps
curl -fsS https://YOUR_DOMAIN/api/health
curl -fsS https://YOUR_ADMIN_DOMAIN/api/health
```

Caddy obtains and renews the TLS certificate automatically after DNS and ports are correct.
If your VM user is not a member of the Docker group, prefix every `docker compose` command with `sudo`.

## First staff account

Register the first account through the customer site, then grant it the `SUPER_ADMIN` role from the VM. Granting the role also activates a pending account:

```bash
sudo docker compose exec backend npm run admin:grant -- staff@example.com
```

That user signs in only at `https://YOUR_ADMIN_DOMAIN`. The customer site has no admin route. Do not share staff accounts.

New registrations are activated automatically after server-side age, contact, profile, and
declaration validation. Identity verification and affordability review are still required before
a loan can be approved. The three staff roles are:

| Role | Access |
| --- | --- |
| Super Admin | All admin features, including assigning or removing staff roles |
| Manager | Dashboard, users, registrations, KYC, loans, ledger, support, advertising, and audit |
| Staff | Day-to-day registration, KYC, loan, ledger, and support workflows |

The admin portal includes live registration and user queues, account activation/suspension, role
assignment, KYC review, loan review and disbursement confirmation, portfolio totals, a drill-down
loan ledger with CSV export, support management, advertising placements, and audit history.
Advertising is disabled by default, clearly labelled when enabled, and does not inject third-party
scripts. The platform does not initiate bank or mobile-money transfers or manually create
repayments; connect an approved payment provider before handling real funds.

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

Run the admin portal separately:

```bash
cd admin
npm ci
BACKEND_URL=http://localhost:5000 npm run dev
```

Open `http://localhost:3001` for staff access.

## API surface

- `GET /api/health` and `GET /api/health/live`
- `POST /api/auth/register`, `/login`, `/logout`
- `POST /api/auth/forgot-password`, `/reset-password`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/ads`
- `GET|POST /api/loans/applications`
- `GET|POST /api/kyc`
- `GET /api/payments`
- `POST /api/contact`
- `GET /api/admin/me`, `/dashboard`, `/users`, `/roles`, `/ledger`, `/support`, `/ads`, `/audit`
- `PATCH /api/admin/users/:id/status`, `/support/:id`
- `PUT /api/admin/users/:id/role`
- `PUT /api/admin/ads/:slot`
- `POST /api/admin/applications/:id/disburse`
- `GET|PATCH /api/admin/applications` (staff permission required)
- `GET|PATCH /api/admin/kyc` (staff permission required)

## Private monitoring and security scans

The optional observability stack adds Prometheus, a provisioned Grafana operations dashboard, and
Uptime Kuma without publishing management services to the internet. Grafana and Uptime Kuma bind
to the VM loopback interface only. Generate a separate Grafana password in `.env`, then start the
overlay:

```bash
openssl rand -hex 32
sudo docker compose -f docker-compose.yml -f docker-compose.observability.yml config
sudo docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d
```

Access the dashboards through SSH tunnels from your computer:

```bash
ssh -L 3100:127.0.0.1:3100 -L 3002:127.0.0.1:3002 azureuser@YOUR_VM_IP
```

Open `http://127.0.0.1:3100` for Grafana and `http://127.0.0.1:3002` for Uptime Kuma. In Uptime
Kuma, create HTTP monitors for `http://backend:5000/api/health`, `http://frontend:3000/`, and
`http://admin:3001/`. Do not mount the Docker socket. The Prometheus endpoint listens on the
private application network at `backend:9464/metrics`; it is intentionally absent from Caddy and
both Next.js proxies. Metric labels contain normalized routes, HTTP methods, and status codes only,
not customer data.

A passive OWASP ZAP baseline scan is defined in `.github/workflows/security.yml`. It runs weekly
and can also be started manually from GitHub Actions. The workflow does not perform an active
attack scan against production. Review the retained HTML and JSON reports before changing any ZAP
rule.

## Release checks

```bash
cd backend && npm ci && npm run build && npm test && npm run lint && npm audit --omit=dev
cd ../frontend && npm ci && npm run type-check && npm run lint && npm run build && npm audit --omit=dev
cd ../admin && npm ci && npm run type-check && npm run lint && npm run build && npm audit --omit=dev
```

Technical hardening does not replace lending authorization, customer disclosures, underwriting, complaints handling, data-protection impact assessment, retention rules, payment-provider approval, monitoring, backups, or an internal staff workflow. Complete those operational and legal controls before accepting real customers or money.
