import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { AuthRequest, requireAuth } from './auth';
import { query, transaction } from './db';
import { requirePermission } from './permissions';

const router = Router();
router.use(requireAuth);
const actor = (req: AuthRequest) => {
  if (!req.user) throw Object.assign(new Error('Authentication required'), { status: 401 });
  return req.user.id;
};
const validUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const idParam = (req: AuthRequest): string => String(req.params.id || '');

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
  (SELECT COUNT(*) FROM users WHERE status='PENDING') AS "pendingRegistrations",
  (SELECT COUNT(*) FROM loan_applications WHERE status IN ('SUBMITTED','UNDER_REVIEW')) AS "pendingApplications",
  (SELECT COUNT(*) FROM kyc_verifications WHERE verification_status='PENDING') AS "pendingKyc",
  (SELECT COALESCE(SUM(principal_amount),0) FROM loans WHERE status IN ('ACTIVE','COMPLETED','DEFAULTED')) AS "totalDisbursed",
  (SELECT COALESCE(SUM(payment_amount),0) FROM payments WHERE payment_status='COMPLETED') AS "totalRepaid",
  (SELECT COALESCE(SUM(GREATEST(l.total_amount_payable-COALESCE(p.paid,0),0)),0) FROM loans l LEFT JOIN (SELECT loan_id,SUM(payment_amount) paid FROM payments WHERE payment_status='COMPLETED' GROUP BY loan_id)p ON p.loan_id=l.id WHERE l.status IN ('ACTIVE','DEFAULTED')) AS "outstanding",
  (SELECT COALESCE(SUM(GREATEST(total_due-amount_paid,0)),0) FROM repayment_schedules WHERE due_date<CURRENT_DATE AND status IN ('PENDING','PARTIALLY_PAID','OVERDUE')) AS "overdue",
  (SELECT COALESCE(SUM(total_interest),0) FROM loans) AS "contractedInterest",
  (SELECT COALESCE(SUM(processing_fee),0) FROM loans) AS "processingFees",
  (SELECT COUNT(*) FROM support_requests WHERE status IN ('OPEN','IN_PROGRESS')) AS "openSupport"`)
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
      `SELECT u.id,u.email,u.phone,u.first_name AS "firstName",u.last_name AS "lastName",u.status,u.last_login AS "lastLogin",u.created_at AS "createdAt",COALESCE(array_agg(ar.name) FILTER(WHERE ar.name IS NOT NULL),'{}') AS roles FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN admin_roles ar ON ar.id=ur.role_id WHERE ($1='' OR u.status=$1) AND ($2='' OR u.email ILIKE '%'||$2||'%' OR u.phone ILIKE '%'||$2||'%' OR (u.first_name||' '||u.last_name) ILIKE '%'||$2||'%') GROUP BY u.id ORDER BY u.created_at DESC LIMIT 500`,
      [status, search],
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

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
