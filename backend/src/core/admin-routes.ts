import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { AuthRequest, requireAuth } from './auth';
import { config } from './config';
import { query, transaction } from './db';
import { requirePermission } from './permissions';
import { buildRegistrationPdf, RegistrationPdfRecord } from './registration-pdf';
import { decryptSensitive } from './security';

const router = Router();
router.use(requireAuth);
const actor = (req: AuthRequest) => {
  if (!req.user) throw Object.assign(new Error('Authentication required'), { status: 401 });
  return req.user.id;
};
const validUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const idParam = (req: AuthRequest): string => String(req.params.id || '');
const adSlots = ['HOME_BELOW_PLANNER', 'LOANS_BELOW_HEADER'];
const integrationProviders = [
  'GOOGLE_ANALYTICS',
  'GOOGLE_TAG_MANAGER',
  'PLAUSIBLE',
  'GOOGLE_ADSENSE',
] as const;
type IntegrationProvider = (typeof integrationProviders)[number];
const extractIntegrationId = (provider: IntegrationProvider, value: unknown): string | null => {
  const input = String(value || '').trim();
  if (!input || input.length > 10_000) return null;
  const patterns: Record<IntegrationProvider, RegExp> = {
    GOOGLE_ANALYTICS: /\bG-[A-Z0-9]{6,15}\b/i,
    GOOGLE_TAG_MANAGER: /\bGTM-[A-Z0-9]{4,12}\b/i,
    GOOGLE_ADSENSE: /\bca-pub-\d{10,20}\b/i,
    PLAUSIBLE: /(?:data-domain=["']([^"']+)["']|^([a-z0-9.-]+)$)/i,
  };
  const match = input.match(patterns[provider]);
  const id = String(match?.[1] || match?.[2] || match?.[0] || '').trim();
  if (!id) return null;
  if (provider === 'GOOGLE_ADSENSE') return id.toLowerCase();
  if (provider !== 'PLAUSIBLE') return id.toUpperCase();
  const hostname = id
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/\.$/, '');
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname)
    ? hostname
    : null;
};
const cleanAdSenseSlot = (value: unknown): string | null => {
  const slot = String(value || '').trim();
  return slot === '' ? '' : /^\d{5,20}$/.test(slot) ? slot : null;
};
const safeAdUrl = (value: string, optional = false) => {
  if (!value) return optional;
  if (value.length > 2048) return false;
  if (/^\/(?!\/)[^\s]*$/.test(value)) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
};

async function record(req: AuthRequest, action: string, type: string, id?: string) {
  await query(
    "INSERT INTO audit_logs(user_id,action,resource_type,resource_id,ip_address,user_agent,status) VALUES($1,$2,$3,$4,$5,$6,'SUCCESS')",
    [actor(req), action, type, id || null, req.ip, req.get('user-agent')?.slice(0, 1000) || null],
  );
}

router.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const rows = await query<{ name: string; permissions: string[] }>(
      `SELECT ar.name,ar.permissions FROM user_roles ur JOIN admin_roles ar ON ar.id=ur.role_id WHERE ur.user_id=$1 AND ar.status='ACTIVE'`,
      [actor(req)],
    );
    if (!rows.length)
      return res.status(403).json({ success: false, message: 'This account has no staff access' });
    return res.json({
      success: true,
      data: {
        roles: rows.map((x) => x.name),
        permissions: [...new Set(rows.flatMap((x) => x.permissions || []))],
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/dashboard', requirePermission('dashboard:view'), async (_req, res, next) => {
  try {
    const data = (
      await query(`SELECT
  (SELECT COUNT(*) FROM users WHERE status='ACTIVE') AS "activeUsers",
  (SELECT COUNT(*) FROM users WHERE status='ACTIVE' AND last_login>=NOW()-INTERVAL '30 minutes') AS "recentlyActive",
  (SELECT COUNT(*) FROM registration_submissions WHERE submitted_at>=CURRENT_DATE-INTERVAL '7 days') AS "recentRegistrations",
  (SELECT COUNT(*) FROM loan_applications WHERE status IN ('SUBMITTED','UNDER_REVIEW')) AS "pendingApplications",
  (SELECT COUNT(*) FROM kyc_verifications WHERE verification_status='PENDING') AS "pendingKyc",
  (SELECT COALESCE(SUM(principal_amount),0) FROM loans WHERE status IN ('ACTIVE','COMPLETED','DEFAULTED')) AS "totalDisbursed",
  (SELECT COALESCE(SUM(payment_amount),0) FROM payments WHERE payment_status='COMPLETED') AS "totalRepaid",
  (SELECT COALESCE(SUM(GREATEST(l.total_amount_payable-COALESCE(p.paid,0),0)),0) FROM loans l LEFT JOIN (SELECT loan_id,SUM(payment_amount) paid FROM payments WHERE payment_status='COMPLETED' GROUP BY loan_id)p ON p.loan_id=l.id WHERE l.status IN ('ACTIVE','DEFAULTED')) AS "outstanding",
  (SELECT COALESCE(SUM(GREATEST(total_due-amount_paid,0)),0) FROM repayment_schedules WHERE due_date<CURRENT_DATE AND status IN ('PENDING','PARTIALLY_PAID','OVERDUE')) AS "overdue",
  (SELECT COALESCE(SUM(total_interest),0) FROM loans) AS "contractedInterest",
  (SELECT COALESCE(SUM(processing_fee),0) FROM loans) AS "processingFees",
  (SELECT COUNT(*) FROM support_requests WHERE status IN ('OPEN','IN_PROGRESS')) AS "openSupport",
  (SELECT COUNT(*) FROM ad_placements WHERE enabled=true AND (starts_at IS NULL OR starts_at<=NOW()) AND (ends_at IS NULL OR ends_at>NOW())) AS "activeAds"`)
    )[0];
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get('/users', requirePermission('users:view'), async (req, res, next) => {
  try {
    const status = String(req.query.status || '').toUpperCase(),
      search = String(req.query.search || '').trim();
    const rows = await query(
      `SELECT u.id,u.email,u.phone,u.first_name AS "firstName",u.last_name AS "lastName",u.status,u.last_login AS "lastLogin",u.created_at AS "createdAt",rs.reference AS "registrationReference",COALESCE(array_agg(ar.name) FILTER(WHERE ar.name IS NOT NULL),'{}') AS roles FROM users u LEFT JOIN registration_submissions rs ON rs.user_id=u.id LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN admin_roles ar ON ar.id=ur.role_id WHERE ($1='' OR u.status=$1) AND ($2='' OR u.email ILIKE '%'||$2||'%' OR u.phone ILIKE '%'||$2||'%' OR (u.first_name||' '||u.last_name) ILIKE '%'||$2||'%' OR rs.reference ILIKE '%'||$2||'%') GROUP BY u.id,rs.reference ORDER BY u.created_at DESC LIMIT 500`,
      [status, search],
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

async function registrationRecord(
  id: string,
  includeNationalId = false,
): Promise<RegistrationPdfRecord | null> {
  const row = (
    await query<{
      reference: string;
      formVersion: string;
      submittedAt: string;
      status: string;
      identityStatus: string | null;
      idNumberCiphertext: string | null;
      legacyIdNumber: string | null;
      answers: Record<string, unknown>;
      declarations: Record<string, unknown>;
    }>(
      `SELECT rs.reference,rs.form_version AS "formVersion",rs.submitted_at AS "submittedAt",
       u.status,rs.answers,rs.declarations,k.verification_status AS "identityStatus",
       COALESCE(rs.national_id_ciphertext,k.id_number_ciphertext) AS "idNumberCiphertext",
       k.id_number AS "legacyIdNumber"
       FROM registration_submissions rs JOIN users u ON u.id=rs.user_id
       LEFT JOIN kyc_verifications k ON k.user_id=rs.user_id
       WHERE rs.user_id=$1 AND u.deleted_at IS NULL`,
      [id],
    )
  )[0];
  if (!row) return null;
  const nationalIdNumber = includeNationalId
    ? row.idNumberCiphertext
      ? decryptSensitive(row.idNumberCiphertext, config.kycEncryptionKey)
      : row.legacyIdNumber
    : null;
  return {
    reference: row.reference,
    formVersion: row.formVersion,
    submittedAt: row.submittedAt,
    status: row.status,
    identityStatus: row.identityStatus,
    answers: row.answers,
    declarations: row.declarations,
    nationalIdNumber,
  };
}

router.get(
  '/users/:id/registration',
  requirePermission('users:view'),
  async (req: AuthRequest, res, next) => {
    try {
      const id = idParam(req);
      if (!validUuid(id)) return res.status(400).json({ success: false, message: 'Invalid user' });
      const registration = await registrationRecord(id);
      if (!registration)
        return res.status(404).json({ success: false, message: 'Registration record not found' });
      await record(req, 'REGISTRATION_VIEWED', 'registration', id);
      return res.json({ success: true, data: registration });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  '/users/:id/registration.pdf',
  requirePermission('users:view'),
  requirePermission('kyc:review'),
  async (req: AuthRequest, res, next) => {
    try {
      const id = idParam(req);
      if (!validUuid(id)) return res.status(400).json({ success: false, message: 'Invalid user' });
      const registration = await registrationRecord(id, true);
      if (!registration)
        return res.status(404).json({ success: false, message: 'Registration record not found' });
      const pdf = await buildRegistrationPdf(registration);
      await record(req, 'REGISTRATION_PDF_EXPORTED', 'registration', id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${registration.reference}.pdf"`);
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      return res.status(200).send(pdf);
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  '/users/:id/status',
  requirePermission('users:manage'),
  async (req: AuthRequest, res, next) => {
    try {
      const id = idParam(req),
        status = String(req.body.status || '').toUpperCase();
      if (!validUuid(id) || !['ACTIVE', 'SUSPENDED', 'REJECTED'].includes(status))
        return res.status(400).json({ success: false, message: 'Invalid user or status' });
      if (id === actor(req))
        return res
          .status(409)
          .json({ success: false, message: 'You cannot change your own account status' });
      const targetIsStaff = (
        await query(
          "SELECT 1 FROM user_roles ur JOIN admin_roles ar ON ar.id=ur.role_id WHERE ur.user_id=$1 AND ar.status='ACTIVE' LIMIT 1",
          [id],
        )
      ).length;
      if (targetIsStaff) {
        const canManageStaff = (
          await query(
            `SELECT 1 FROM user_roles ur JOIN admin_roles ar ON ar.id=ur.role_id
             WHERE ur.user_id=$1 AND ar.status='ACTIVE' AND ar.permissions @> '["roles:assign"]'::jsonb LIMIT 1`,
            [actor(req)],
          )
        ).length;
        if (!canManageStaff)
          return res.status(403).json({
            success: false,
            message: 'Only a Super Admin can change another staff account',
          });
      }
      if (status === 'ACTIVE') {
        const eligible = await query(
          `SELECT 1 FROM users u JOIN user_profiles up ON up.user_id=u.id
           WHERE u.id=$1 AND u.date_of_birth<=CURRENT_DATE-INTERVAL '18 years'
           AND up.profile_completed_at IS NOT NULL`,
          [id],
        );
        if (!eligible.length)
          return res.status(409).json({
            success: false,
            message: 'Only an adult customer with a complete profile can be activated',
          });
      }
      const row = (
        await query(
          'UPDATE users SET status=$1,auth_version=auth_version+1,updated_at=NOW() WHERE id=$2 AND deleted_at IS NULL RETURNING id,status',
          [status, id],
        )
      )[0];
      if (!row) return res.status(404).json({ success: false, message: 'User not found' });
      await record(req, 'USER_STATUS_CHANGED', 'user', id);
      return res.json({ success: true, data: row, message: 'User status updated' });
    } catch (error) {
      return next(error);
    }
  },
);

router.get('/roles', requirePermission('users:view'), async (_req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await query(
        "SELECT id,name,description,permissions FROM admin_roles WHERE status='ACTIVE' AND name IN ('SUPER_ADMIN','MANAGER','STAFF') ORDER BY name",
      ),
    });
  } catch (error) {
    return next(error);
  }
});

router.put(
  '/users/:id/role',
  requirePermission('roles:assign'),
  async (req: AuthRequest, res, next) => {
    try {
      const id = idParam(req),
        role = String(req.body.role || '').toUpperCase();
      if (!validUuid(id) || !['SUPER_ADMIN', 'MANAGER', 'STAFF', 'NONE'].includes(role))
        return res.status(400).json({ success: false, message: 'Invalid user or role' });
      if (id === actor(req))
        return res.status(409).json({ success: false, message: 'You cannot change your own role' });
      const found = await transaction(async (client) => {
        const target = await client.query(
          'SELECT 1 FROM users WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',
          [id],
        );
        if (!target.rowCount) return false;
        await client.query(
          `DELETE FROM user_roles WHERE user_id=$1 AND role_id IN(SELECT id FROM admin_roles WHERE name IN('SUPER_ADMIN','MANAGER','STAFF','PLATFORM_ADMIN'))`,
          [id],
        );
        if (role !== 'NONE')
          await client.query(
            "INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM admin_roles WHERE name=$2 AND status='ACTIVE'",
            [id, role],
          );
        return true;
      });
      if (!found) return res.status(404).json({ success: false, message: 'User not found' });
      await record(req, 'USER_ROLE_CHANGED', 'user', id);
      return res.json({ success: true, message: 'Staff role updated' });
    } catch (error) {
      return next(error);
    }
  },
);

router.get('/ledger', requirePermission('ledger:view'), async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT l.id,l.loan_number AS "loanNumber",u.first_name AS "firstName",u.last_name AS "lastName",u.email,l.principal_amount AS principal,l.total_interest AS interest,l.processing_fee AS fees,l.total_amount_payable AS "totalPayable",COALESCE(p.paid,0) AS paid,GREATEST(l.total_amount_payable-COALESCE(p.paid,0),0) AS outstanding,COALESCE(o.overdue,0) AS overdue,l.status,l.disbursement_date AS "disbursedAt",l.maturity_date AS "maturityDate" FROM loans l JOIN users u ON u.id=l.user_id LEFT JOIN(SELECT loan_id,SUM(payment_amount) paid FROM payments WHERE payment_status='COMPLETED' GROUP BY loan_id)p ON p.loan_id=l.id LEFT JOIN(SELECT loan_id,SUM(GREATEST(total_due-amount_paid,0)) overdue FROM repayment_schedules WHERE due_date<CURRENT_DATE AND status IN('PENDING','PARTIALLY_PAID','OVERDUE') GROUP BY loan_id)o ON o.loan_id=l.id ORDER BY l.disbursement_date DESC LIMIT 1000`,
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/applications/:id/disburse',
  requirePermission('loans:disburse'),
  async (req: AuthRequest, res, next) => {
    try {
      const id = idParam(req);
      if (!validUuid(id))
        return res.status(400).json({ success: false, message: 'Invalid application' });
      const loan = await transaction(async (client) => {
        const app = (
          await client.query<{
            id: string;
            user_id: string;
            loan_amount: string;
            loan_term: number;
            interest_rate: string;
            processing_fee: string;
            total_amount_payable: string;
          }>(
            "SELECT la.id,la.user_id,la.loan_amount,la.loan_term,la.interest_rate,la.processing_fee,la.total_amount_payable FROM loan_applications la JOIN users u ON u.id=la.user_id JOIN kyc_verifications k ON k.user_id=la.user_id AND k.verification_status='APPROVED' WHERE la.id=$1 AND la.status='APPROVED' AND u.status='ACTIVE' FOR UPDATE OF la",
            [id],
          )
        ).rows[0];
        if (!app) return null;
        const number = `PPL-L-${randomUUID().replace(/-/g, '').slice(0, 14).toUpperCase()}`,
          interest =
            Number(app.total_amount_payable) -
            Number(app.loan_amount) -
            Number(app.processing_fee || 0);
        const row = (
          await client.query<{ id: string }>(
            `INSERT INTO loans(application_id,user_id,loan_number,principal_amount,total_interest,processing_fee,total_amount_payable,interest_rate,loan_term,payment_frequency,disbursement_date,maturity_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'MONTHLY',NOW(),(CURRENT_DATE+$9*INTERVAL '1 month')::date) RETURNING id`,
            [
              app.id,
              app.user_id,
              number,
              app.loan_amount,
              interest,
              app.processing_fee || 0,
              app.total_amount_payable,
              app.interest_rate,
              app.loan_term,
            ],
          )
        ).rows[0];
        const round = (value: number) => Math.round(value * 100) / 100,
          principalTotal = Number(app.loan_amount),
          feeTotal = Number(app.processing_fee || 0),
          principalPart = round(principalTotal / app.loan_term),
          interestPart = round(interest / app.loan_term),
          feePart = round(feeTotal / app.loan_term);
        let allocatedPrincipal = 0,
          allocatedInterest = 0,
          allocatedFee = 0;
        for (let i = 1; i <= app.loan_term; i++) {
          const final = i === app.loan_term,
            principalDue = final ? round(principalTotal - allocatedPrincipal) : principalPart,
            interestDue = final ? round(interest - allocatedInterest) : interestPart,
            feeDue = final ? round(feeTotal - allocatedFee) : feePart,
            totalDue = round(principalDue + interestDue + feeDue);
          await client.query(
            `INSERT INTO repayment_schedules(loan_id,sequence_number,due_date,principal_amount,interest_amount,fee_amount,total_due) VALUES($1,$2,(CURRENT_DATE+$2*INTERVAL '1 month')::date,$3,$4,$5,$6)`,
            [row.id, i, principalDue, interestDue, feeDue, totalDue],
          );
          allocatedPrincipal = round(allocatedPrincipal + principalDue);
          allocatedInterest = round(allocatedInterest + interestDue);
          allocatedFee = round(allocatedFee + feeDue);
        }
        await client.query(
          "UPDATE loan_applications SET status='DISBURSED',disbursement_date=NOW(),updated_at=NOW() WHERE id=$1",
          [id],
        );
        await client.query(
          `INSERT INTO transaction_logs(user_id,loan_id,transaction_type,amount,description,reference_number,status)
           VALUES($1,$2,'DISBURSEMENT',$3,'Loan disbursement confirmed by staff',$4,'COMPLETED')`,
          [app.user_id, row.id, app.loan_amount, number],
        );
        return row;
      });
      if (!loan)
        return res.status(409).json({
          success: false,
          message: 'Only an approved, undisbursed application can be disbursed',
        });
      await record(req, 'LOAN_DISBURSED', 'loan', loan.id);
      return res
        .status(201)
        .json({ success: true, data: loan, message: 'Loan recorded as disbursed' });
    } catch (error) {
      return next(error);
    }
  },
);

router.get('/support', requirePermission('support:manage'), async (_req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await query(
        "SELECT id,reference,name,email,phone,subject,message,status,created_at AS \"createdAt\" FROM support_requests ORDER BY CASE status WHEN 'OPEN' THEN 0 WHEN 'IN_PROGRESS' THEN 1 ELSE 2 END,created_at DESC LIMIT 500",
      ),
    });
  } catch (error) {
    return next(error);
  }
});
router.patch(
  '/support/:id',
  requirePermission('support:manage'),
  async (req: AuthRequest, res, next) => {
    try {
      const id = idParam(req),
        status = String(req.body.status || '').toUpperCase();
      if (!validUuid(id) || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status))
        return res.status(400).json({ success: false, message: 'Invalid request' });
      const row = (
        await query('UPDATE support_requests SET status=$1 WHERE id=$2 RETURNING id,status', [
          status,
          id,
        ])
      )[0];
      if (!row) return res.status(404).json({ success: false, message: 'Request not found' });
      await record(req, 'SUPPORT_STATUS_CHANGED', 'support_request', id);
      return res.json({ success: true, data: row });
    } catch (error) {
      return next(error);
    }
  },
);

router.get('/integrations', requirePermission('ads:manage'), async (_req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await query(
        `SELECT provider,public_id AS "publicId",home_slot AS "homeSlot",
         loans_slot AS "loansSlot",enabled,updated_at AS "updatedAt"
         FROM site_integrations ORDER BY provider`,
      ),
    });
  } catch (error) {
    return next(error);
  }
});

router.put(
  '/integrations/:provider',
  requirePermission('ads:manage'),
  async (req: AuthRequest, res, next) => {
    try {
      const provider = String(req.params.provider || '').toUpperCase() as IntegrationProvider;
      if (!integrationProviders.includes(provider))
        return res
          .status(400)
          .json({ success: false, message: 'Unsupported integration provider' });
      const publicId = extractIntegrationId(provider, req.body.value ?? req.body.publicId);
      if (!publicId)
        return res.status(400).json({
          success: false,
          message: 'Enter a valid provider ID or an unmodified standard provider snippet',
        });
      const homeSlot = provider === 'GOOGLE_ADSENSE' ? cleanAdSenseSlot(req.body.homeSlot) : '',
        loansSlot = provider === 'GOOGLE_ADSENSE' ? cleanAdSenseSlot(req.body.loansSlot) : '',
        enabled = req.body.enabled === true;
      if (homeSlot === null || loansSlot === null)
        return res.status(400).json({
          success: false,
          message: 'AdSense placement IDs must contain 5 to 20 digits',
        });
      if (provider === 'GOOGLE_ADSENSE' && enabled && !homeSlot && !loansSlot)
        return res.status(400).json({
          success: false,
          message: 'Add at least one AdSense placement ID before enabling AdSense',
        });
      const row = (
        await query(
          `INSERT INTO site_integrations(provider,public_id,home_slot,loans_slot,enabled,created_by,updated_by)
           VALUES($1,$2,$3,$4,$5,$6,$6)
           ON CONFLICT(provider) DO UPDATE SET public_id=EXCLUDED.public_id,
           home_slot=EXCLUDED.home_slot,loans_slot=EXCLUDED.loans_slot,
           enabled=EXCLUDED.enabled,updated_by=EXCLUDED.updated_by,updated_at=NOW()
           RETURNING provider,public_id AS "publicId",home_slot AS "homeSlot",
           loans_slot AS "loansSlot",enabled,updated_at AS "updatedAt"`,
          [provider, publicId, homeSlot || null, loansSlot || null, enabled, actor(req)],
        )
      )[0];
      await record(
        req,
        `INTEGRATION_${provider}_${enabled ? 'ENABLED' : 'SAVED'}`,
        'site_integration',
      );
      return res.json({
        success: true,
        data: row,
        message: enabled ? 'Integration enabled' : 'Integration saved but disabled',
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get('/ads', requirePermission('ads:manage'), async (_req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await query(
        `SELECT id,slot,sponsor,headline,body,cta_label AS "ctaLabel",
         target_url AS "targetUrl",image_url AS "imageUrl",enabled,
         starts_at AS "startsAt",ends_at AS "endsAt",updated_at AS "updatedAt"
         FROM ad_placements ORDER BY slot`,
      ),
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/ads/:slot', requirePermission('ads:manage'), async (req: AuthRequest, res, next) => {
  try {
    const slot = String(req.params.slot || '').toUpperCase(),
      sponsor = String(req.body.sponsor || '').trim(),
      headline = String(req.body.headline || '').trim(),
      adBody = String(req.body.body || '').trim(),
      ctaLabel = String(req.body.ctaLabel || '').trim(),
      targetUrl = String(req.body.targetUrl || '').trim(),
      imageUrl = String(req.body.imageUrl || '').trim(),
      startsAt = String(req.body.startsAt || '').trim() || null,
      endsAt = String(req.body.endsAt || '').trim() || null,
      enabled = req.body.enabled === true;
    if (!adSlots.includes(slot))
      return res.status(400).json({ success: false, message: 'Unknown advertising placement' });
    if (
      sponsor.length < 2 ||
      sponsor.length > 120 ||
      headline.length < 3 ||
      headline.length > 160 ||
      adBody.length < 5 ||
      adBody.length > 500 ||
      ctaLabel.length < 2 ||
      ctaLabel.length > 60
    )
      return res
        .status(400)
        .json({ success: false, message: 'Complete the ad fields within the allowed lengths' });
    if (!safeAdUrl(targetUrl) || !safeAdUrl(imageUrl, true))
      return res.status(400).json({
        success: false,
        message: 'Ad links must use HTTPS or a safe site-relative path',
      });
    if (
      (startsAt && !Number.isFinite(Date.parse(startsAt))) ||
      (endsAt && !Number.isFinite(Date.parse(endsAt))) ||
      (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt))
    )
      return res.status(400).json({ success: false, message: 'Ad schedule is invalid' });
    const row = (
      await query(
        `INSERT INTO ad_placements(slot,sponsor,headline,body,cta_label,target_url,image_url,enabled,starts_at,ends_at,created_by,updated_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
         ON CONFLICT(slot) DO UPDATE SET sponsor=EXCLUDED.sponsor,headline=EXCLUDED.headline,
         body=EXCLUDED.body,cta_label=EXCLUDED.cta_label,target_url=EXCLUDED.target_url,
         image_url=EXCLUDED.image_url,enabled=EXCLUDED.enabled,starts_at=EXCLUDED.starts_at,
         ends_at=EXCLUDED.ends_at,updated_by=EXCLUDED.updated_by,updated_at=NOW()
         RETURNING id,slot,sponsor,headline,body,cta_label AS "ctaLabel",
         target_url AS "targetUrl",image_url AS "imageUrl",enabled,
         starts_at AS "startsAt",ends_at AS "endsAt",updated_at AS "updatedAt"`,
        [
          slot,
          sponsor,
          headline,
          adBody,
          ctaLabel,
          targetUrl,
          imageUrl || null,
          enabled,
          startsAt,
          endsAt,
          actor(req),
        ],
      )
    )[0] as { id: string };
    await record(req, enabled ? 'AD_PUBLISHED' : 'AD_SAVED', 'ad_placement', row.id);
    return res.json({ success: true, data: row, message: enabled ? 'Ad is live' : 'Ad saved' });
  } catch (error) {
    return next(error);
  }
});

router.get('/audit', requirePermission('audit:view'), async (_req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await query(
        `SELECT a.id,a.action,a.resource_type AS "resourceType",a.resource_id AS "resourceId",a.ip_address AS "ipAddress",a.status,a.created_at AS "createdAt",u.email AS actor FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 1000`,
      ),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
