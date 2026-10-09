/* Deterministic UI checks using synthetic API data. Not a production lending test.
 * Start frontend on :3300 and admin on :3301; install Playwright separately.
 * Optional: CHROMIUM_MODULE points to @sparticuz/chromium when no browser is installed.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = process.env.UI_REVIEW_OUTPUT || '/tmp/patapesa-ui-review';
const base = process.env.UI_REVIEW_FRONTEND || 'http://127.0.0.1:3300';
const adminBase = process.env.UI_REVIEW_ADMIN || 'http://127.0.0.1:3301';
const products = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'QUICK_CASH',
    name: 'Emergency loan',
    description: 'Unexpected essential expenses',
    minAmount: '1000',
    maxAmount: '50000',
    minTerm: 1,
    maxTerm: 6,
    interestRate: '18',
    processingFee: '3',
    currency: 'KES',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    code: 'PERSONAL',
    name: 'Personal loan',
    description: 'Planned household or personal costs',
    minAmount: '10000',
    maxAmount: '500000',
    minTerm: 3,
    maxTerm: 24,
    interestRate: '15',
    processingFee: '2.5',
    currency: 'KES',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    code: 'BUSINESS',
    name: 'Business loan',
    description: 'Stock, tools and working capital',
    minAmount: '50000',
    maxAmount: '1000000',
    minTerm: 6,
    maxTerm: 36,
    interestRate: '12',
    processingFee: '2',
    currency: 'KES',
  },
];
const user = {
  firstName: 'Example',
  lastName: 'Borrower',
  email: 'example@example.test',
  phone: '+254700000000',
};
const permissions = [
  'dashboard:view',
  'users:view',
  'users:manage',
  'roles:assign',
  'loans:review',
  'loans:disburse',
  'kyc:review',
  'payments:review',
  'products:manage',
  'ledger:view',
  'support:manage',
  'ads:manage',
  'audit:view',
];
async function main() {
  const options = { headless: true };
  if (process.env.CHROMIUM_MODULE) {
    const mod = await import(process.env.CHROMIUM_MODULE);
    const c = mod.default || mod;
    options.executablePath = await c.executablePath();
    options.args = c.args;
  }
  const browser = await chromium.launch(options);
  fs.mkdirSync(out, { recursive: true });
  const errors = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });
    await context.addInitScript(() => localStorage.setItem('patapesa-privacy-v1', 'essential'));
    let authenticated = false,
      productsFail = false,
      partialFail = false;
    await context.route('**/api/**', async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        p = url.pathname;
      let status = 200,
        data = { data: [] };
      if (p === '/api/products') {
        status = productsFail ? 503 : 200;
        data = productsFail ? { message: 'Unavailable' } : { data: products };
      } else if (p === '/api/auth/me') {
        status = authenticated ? 200 : 401;
        data = { data: { user }, message: 'Authentication required' };
      } else if (p === '/api/auth/register') {
        authenticated = true;
        data = { message: 'Account created', data: { registrationReference: 'TEST-REG-001' } };
      } else if (p === '/api/auth/login') {
        authenticated = true;
        data = { success: true };
      } else if (p === '/api/auth/logout') {
        authenticated = false;
        return route.fulfill({ status: 204 });
      } else if (p === '/api/loans/applications' && request.method() === 'POST') {
        status = authenticated ? 201 : 401;
        data = authenticated
          ? { message: 'Received', data: { applicationNumber: 'TEST-001' } }
          : { message: 'Authentication required' };
      } else if (p === '/api/account/overview') {
        data = {
          data: {
            user,
            applications: [
              {
                id: 'app1',
                applicationNumber: 'TEST-001',
                product: 'Personal loan',
                amount: '65000',
                term: 12,
                status: 'UNDER_REVIEW',
                createdAt: '2026-09-19T08:00:00Z',
                updatedAt: '2026-09-19T09:00:00Z',
              },
            ],
            kyc: { status: 'APPROVED', idType: 'NATIONAL_ID', idNumberLast4: '0000' },
            payments: [],
            loans: [],
            installments: [],
          },
        };
      } else if (p === '/api/admin/me') data = { data: { roles: ['SUPER_ADMIN'], permissions } };
      else if (p === '/api/admin/dashboard')
        data = {
          data: {
            totalUsers: '12',
            pendingApplications: '3',
            activeLoans: '5',
            totalDisbursed: '240000',
            totalOutstanding: '180000',
          },
        };
      else if (p === '/api/admin/products') data = { data: products };
      else if (p === '/api/admin/users' && partialFail) {
        status = 503;
        data = { message: 'Unavailable' };
      }
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    async function overflow(label) {
      const sizes = await page.evaluate(() => ({
        w: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert(sizes.scroll <= sizes.w + 1, `${label} horizontal overflow: ${JSON.stringify(sizes)}`);
    }
    async function screenshot(name) {
      await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
    }
    await page.goto(base);
    await page.getByLabel('2. How much do you need?').waitFor();
    await overflow('desktop home');
    await screenshot('home-desktop');
    await page.getByLabel('2. How much do you need?').fill('65000');
    await page.getByRole('link', { name: 'Continue with this estimate' }).click();
    await page.getByRole('heading', { name: 'Your personal loan application' }).waitFor();
    assert.equal(await page.getByLabel(/^Amount/).inputValue(), '65000');
    await page.getByLabel('Purpose category').selectOption('HOME');
    await page
      .getByLabel('Purpose of the loan')
      .fill('Repair the roof and replace damaged household fittings.');
    await page.getByLabel('How will you repay this loan?').fill('Monthly employment salary');
    await page.getByRole('button', { name: 'Review costs' }).click();
    await page.getByRole('heading', { name: 'Check your application' }).waitFor();
    await page.waitForTimeout(350);
    await screenshot('application-review');
    await page.reload();
    await page.getByRole('heading', { name: 'Check your application' }).waitFor();
    assert(
      await page.getByText('Repair the roof and replace damaged household fittings.').isVisible(),
    );
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Submit application' }).click();
    await page.waitForURL('**/login?**');
    await page.getByRole('link', { name: 'Create an account' }).click();
    await page.waitForURL('**/register?next=loans');
    await page.getByRole('heading', { name: 'About you', exact: true }).waitFor();
    await screenshot('registration-desktop');
    for (const [name, value] of Object.entries({
      firstName: 'Example',
      lastName: 'Borrower',
      dateOfBirth: '1990-01-01',
      nationalIdNumber: '12345678',
      email: 'example@example.test',
      phone: '0712345678',
    }))
      await page.locator(`[name="${name}"]`).fill(value);
    await page.locator('form').evaluate((form) => form.requestSubmit());
    await page.getByRole('heading', { name: 'Home & work', exact: true }).waitFor();
    for (const [name, value] of Object.entries({
      addressLine1: 'Example road',
      city: 'Nairobi',
      county: 'Nairobi',
      occupation: 'Office administrator',
      industry: 'Services',
      yearsOfEmployment: '3',
    }))
      await page.locator(`[name="${name}"]`).fill(value);
    await page.locator('[name="employmentType"]').selectOption('SALARIED');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('heading', { name: 'Financial profile', exact: true }).waitFor();
    await page.locator('[name="incomeRange"]').selectOption('50000_99999');
    await page.locator('[name="sourceOfIncome"]').fill('Monthly salary');
    await page.locator('[name="educationLevel"]').selectOption('DIPLOMA');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('heading', { name: 'Review & declare', exact: true }).waitFor();
    await page.locator('[name="password"]').fill('Example-pass-123');
    await page.locator('[name="confirm"]').fill('Example-pass-123');
    for (const name of [
      'accuracyConfirmed',
      'privacyAcknowledged',
      'eligibilityAssessmentAcknowledged',
      'electronicCommunicationsConsent',
    ])
      await page.locator(`[name="${name}"]`).check();
    await page.getByRole('button', { name: 'Submit registration', exact: true }).click();
    await page.waitForURL('**/loans');
    await page.getByRole('heading', { name: 'Check your application' }).waitFor();
    authenticated = false;
    await page.goto(base + '/login?next=%2Floans');
    await page.getByLabel('Email address').fill('example@example.test');
    await page.locator('input[name="password"]').fill('Example-pass-123');
    await page.getByRole('button', { name: 'Sign in securely' }).click();
    await page.waitForURL('**/loans');
    await page.getByRole('heading', { name: 'Check your application' }).waitFor();
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Submit application' }).click();
    await page.waitForURL('**/dashboard#application-progress');
    await page.getByText('Example’s account').waitFor();
    await screenshot('account-desktop');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.waitForURL(base + '/');
    assert.equal(authenticated, false);
    productsFail = true;
    await page.reload();
    await page.getByText('We can’t load current rates.').waitFor();
    assert.equal(await page.getByRole('link', { name: 'Continue with this estimate' }).count(), 0);
    productsFail = false;
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await page.getByLabel('2. How much do you need?').waitFor();
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(base);
      await page.getByLabel('2. How much do you need?').waitFor();
      await overflow(`home ${width}`);
      await screenshot(`home-${width}`);
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      await page.locator('#mobile-navigation').waitFor();
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      await page.goto(base + '/register');
      await page.getByRole('heading', { name: 'About you', exact: true }).waitFor();
      await overflow(`registration ${width}`);
      await screenshot(`registration-${width}`);
      assert.equal(
        await page.locator('.registration-actions').evaluate((el) => getComputedStyle(el).position),
        'static',
      );
      assert.equal(
        await page.locator('.privacy-reopen').evaluate((el) => getComputedStyle(el).position),
        'static',
      );
      await page.goto(base + '/loans?product=' + products[1].id + '&amount=65000&term=12');
      await page.getByRole('heading', { name: 'Your personal loan application' }).waitFor();
      await overflow(`application ${width}`);
      await screenshot(`application-${width}`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(adminBase + '/dashboard');
    await page.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
    await page.getByText('Last refreshed', { exact: false }).waitFor();
    await overflow('admin desktop');
    await screenshot('admin-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await overflow('admin mobile');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('button', { name: 'KYC review', exact: false }).click();
    await page.getByRole('heading', { name: 'KYC review', exact: true }).waitFor();
    assert(await page.getByRole('button', { name: 'Open navigation' }).isVisible());
    await screenshot('admin-mobile');
    partialFail = true;
    await page.reload();
    await page.getByText('Some sections could not be refreshed.', { exact: false }).waitFor();
    assert.deepEqual(errors, [], 'browser runtime errors');
    console.log(
      'PASS: estimate continuity, review, refresh recovery, registration and sign-in continuation, submit, logout, unavailable rates, responsive widths 1440/390/320, admin navigation and partial-data feedback. Synthetic API fixtures.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
