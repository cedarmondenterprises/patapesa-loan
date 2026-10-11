import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import {
  AuthRequest,
  clearAuthCookie,
  createSession,
  revokeSession,
  requireAuth,
  setAuthCookie,
} from './auth';
import { config } from './config';
import { query, transaction } from './db';
import { sendEmailVerification, sendLoginOtp, sendPasswordReset } from './email';
import { isRecentKenyanPaymentDate } from './kenya-date';
import { calculateLoan } from './loan-calculator';
import { requirePermission } from './permissions';
import adminRoutes from './admin-routes';
import {
  blindIndex,
  decryptSensitive,
  digestEmailOtp,
  emailOtp,
  digestResetToken,
  encryptSensitive,
  resetToken,
} from './security';

const router = Router();
const errorsFor = (req: Parameters<typeof validationResult>[0]) =>
  validationResult(req)
    .array()
    .map((error) => error.msg);
const passwordRule = () =>
  body('password')
    .isLength({ min: 10, max: 128 })
    .matches(/[a-z]/)
    .matches(/[A-Z]/)
    .matches(/[0-9]/)
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Use 10–128 characters with uppercase, lowercase, number and symbol');
const authLimiter = rateLimit({
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait before trying again.',
  },
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
// Only successful logins are excluded; password-reset emails and registration
// remain limited even when their endpoint returns a successful response.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many sign-in attempts. Please wait before trying again.',
  },
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const userId = (req: AuthRequest): string => {
  if (!req.user) throw Object.assign(new Error('Authentication required'), { status: 401 });
  return req.user.id;
};
const registrationVersion = '2026-09-15';
const emailOtpExpiryMinutes = 10;
const emailOtpResendSeconds = 60;
const employmentTypes = [
  'SALARIED',
  'SELF_EMPLOYED',
  'BUSINESS_OWNER',
  'UNEMPLOYED',
  'STUDENT',
  'RETIRED',
];
const incomeRanges = [
  'BELOW_15000',
  '15000_29999',
  '30000_49999',
  '50000_99999',
  '100000_199999',
  '200000_PLUS',
];
const loanPurposeCategories = [
  'EMERGENCY',
  'MEDICAL',
  'EDUCATION',
  'BUSINESS',
  'HOME',
  'TRANSPORT',
  'AGRICULTURE',
  'OTHER',
];
const incomeReference: Record<string, number> = {
  BELOW_15000: 15000,
  '15000_29999': 15000,
  '30000_49999': 30000,
  '50000_99999': 50000,
  '100000_199999': 100000,
  '200000_PLUS': 200000,
};
const normalizeKenyanPhone = (value: unknown): string => {
  const compact = String(value || '').replace(/[\s()-]/g, '');
  if (/^0[17]\d{8}$/.test(compact)) return `+254${compact.slice(1)}`;
  if (/^[17]\d{8}$/.test(compact)) return `+254${compact}`;
  if (/^254[17]\d{8}$/.test(compact)) return `+${compact}`;
  return compact;
};

async function audit(
  req: AuthRequest,
  action: string,
  resourceType: string,
  resourceId?: string,
  actorUserId?: string,
): Promise<void> {
  try {
    await query(
      'INSERT INTO audit_logs(user_id,action,resource_type,resource_id,ip_address,user_agent,status) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [
        actorUserId || req.user?.id || null,
        action,
        resourceType,
        resourceId || null,
        req.ip,
        req.get('user-agent')?.slice(0, 1000) || null,
        'SUCCESS',
      ],
    );
  } catch (error) {
    console.error('Unable to record audit event', { action, resourceType, resourceId, error });
  }
}

async function resendEmailOtp(user: {
  id: string;
  email: string;
  firstName: string;
}): Promise<{ retryAfter: number }> {
  const otp = emailOtp(user.email, config.jwtSecret);
  const result = await transaction(async (client) => {
    await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [user.id]);
    const recent = (
      await client.query<{ retry_after: number }>(
        `SELECT GREATEST(0,CEIL(EXTRACT(EPOCH FROM
           (created_at + ($2 * INTERVAL '1 second') - NOW()))))::int AS retry_after
         FROM verification_codes
         WHERE user_id=$1 AND type='email_verification'
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [user.id, emailOtpResendSeconds],
      )
    ).rows[0];
    if ((recent?.retry_after || 0) > 0) return { retryAfter: recent.retry_after, challengeId: '' };
    await client.query(
      "UPDATE verification_codes SET is_used=true,used_at=NOW() WHERE user_id=$1 AND type='email_verification' AND is_used=false",
      [user.id],
    );
    const challenge = (
      await client.query<{ id: string }>(
        `INSERT INTO verification_codes(user_id,code,type,expires_at)
         VALUES($1,$2,'email_verification',NOW()+($3 * INTERVAL '1 minute')) RETURNING id`,
        [user.id, otp.digest, emailOtpExpiryMinutes],
      )
    ).rows[0];
    return { retryAfter: 0, challengeId: challenge.id };
  });
  if (result.retryAfter > 0) return { retryAfter: result.retryAfter };
  try {
    await sendEmailVerification(user.email, user.firstName, otp.raw);
  } catch (error) {
    await query('UPDATE verification_codes SET is_used=true,used_at=NOW() WHERE id=$1', [
      result.challengeId,
    ]);
    throw error;
  }
  return { retryAfter: 0 };
}

async function issueLoginOtp(user: {
  id: string;
  email: string;
  firstName: string;
}): Promise<{ sent: boolean; retryAfter: number }> {
  const otp = emailOtp(user.email, config.jwtSecret);
  const result = await transaction(async (client) => {
    await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [user.id]);
    const recent = (
      await client.query<{ retry_after: number }>(
        `SELECT GREATEST(0,CEIL(EXTRACT(EPOCH FROM
           (created_at + ($2 * INTERVAL '1 second') - NOW()))))::int AS retry_after
         FROM verification_codes
         WHERE user_id=$1 AND type='2fa_login' AND is_used=false AND expires_at>NOW()
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [user.id, emailOtpResendSeconds],
      )
    ).rows[0];
    if ((recent?.retry_after || 0) > 0)
      return { retryAfter: recent.retry_after, challengeId: '' };
    await client.query(
      "UPDATE verification_codes SET is_used=true,used_at=NOW() WHERE user_id=$1 AND type='2fa_login' AND is_used=false",
      [user.id],
    );
    const challenge = (
      await client.query<{ id: string }>(
        `INSERT INTO verification_codes(user_id,code,type,expires_at)
         VALUES($1,$2,'2fa_login',NOW()+($3 * INTERVAL '1 minute')) RETURNING id`,
        [user.id, otp.digest, emailOtpExpiryMinutes],
      )
    ).rows[0];
    return { retryAfter: 0, challengeId: challenge.id };
  });
  if (result.retryAfter > 0) return { sent: false, retryAfter: result.retryAfter };
  try {
    await sendLoginOtp(user.email, user.firstName, otp.raw);
  } catch (error) {
    await query('UPDATE verification_codes SET is_used=true,used_at=NOW() WHERE id=$1', [
      result.challengeId,
    ]);
    console.error('Unable to send login verification email', { userId: user.id, error });
    throw Object.assign(
      new Error('We could not send the sign-in email. Please try again shortly.'),
      { status: 503 },
    );
  }
  return { sent: true, retryAfter: 0 };
}

router.post(
  '/auth/register',
  authLimiter,
  body('firstName').trim().isLength({ min: 2, max: 100 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 2, max: 100 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('phone')
    .customSanitizer(normalizeKenyanPhone)
    .matches(/^\+254[17]\d{8}$/)
    .withMessage('Use a Kenyan number such as 0712345678 or +254712345678'),
  body('dateOfBirth')
    .isISO8601({ strict: true })
    .custom((value) => {
      const birth = new Date(`${value}T00:00:00Z`),
        now = new Date(),
        adultDate = new Date(
          Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate()),
        ),
        oldestDate = new Date(
          Date.UTC(now.getUTCFullYear() - 100, now.getUTCMonth(), now.getUTCDate()),
        );
      if (birth > adultDate || birth < oldestDate)
        throw new Error('You must be between 18 and 100 years old');
      return true;
    }),
  body('nationalIdNumber')
    .customSanitizer((value) => String(value || '').replace(/\s/g, ''))
    .matches(/^\d{6,10}$/)
    .withMessage('Enter a valid National ID number using 6–10 digits'),
  body('nationality').trim().isLength({ min: 2, max: 3 }).isAlpha(),
  body('termsAccepted')
    .equals('true')
    .withMessage('Accept the terms and privacy notice to create an account'),
  body('marketingConsent').optional().isBoolean().toBoolean(),
  body('remember').optional().isBoolean().toBoolean(),
  passwordRule(),
  async (req, res, next) => {
    try {
      const errors = errorsFor(req);
      if (errors.length)
        return res.status(400).json({ success: false, message: errors[0], errors });
      const { firstName, lastName, email, phone, password, dateOfBirth, nationality } = req.body;
      const otp = emailOtp(email, config.jwtSecret);
      const hash = await bcrypt.hash(password, 12);
      const nationalIdNumber = String(req.body.nationalIdNumber),
        nationalIdCipher = encryptSensitive(nationalIdNumber, config.kycEncryptionKey),
        nationalIdHash = blindIndex(nationalIdNumber, config.kycEncryptionKey),
        nationalIdLast4 = nationalIdNumber.slice(-4);
      const reference = `PPR-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
      const answers = {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        nationalIdLast4,
        nationality: String(nationality).toUpperCase(),
        country: 'Kenya',
      };
      const declarations = {
        accuracyConfirmed: true,
        privacyAcknowledged: true,
        eligibilityAssessmentAcknowledged: false,
        electronicCommunicationsConsent: true,
        marketingConsent: req.body.marketingConsent === true,
        acceptedAt: new Date().toISOString(),
        version: `${registrationVersion}-essential`,
      };
      const user = await transaction(async (client) => {
        const created = (
          await client.query<{
            id: string;
            email: string;
            phone: string;
            first_name: string;
            last_name: string;
            auth_version: number;
          }>(
            "INSERT INTO users(email,phone,password_hash,first_name,last_name,date_of_birth,nationality,status,is_email_verified,email_verification_required) VALUES($1,$2,$3,$4,$5,$6,$7,'ACTIVE',false,true) RETURNING id,email,phone,first_name,last_name,auth_version",
            [
              email,
              phone,
              hash,
              firstName,
              lastName,
              dateOfBirth,
              String(nationality).toUpperCase(),
            ],
          )
        ).rows[0];
        const kyc = (
          await client.query<{ id: string }>(
            `INSERT INTO kyc_verifications(user_id,id_type,id_number,id_number_ciphertext,id_number_hash,id_number_last4,verification_status)
             VALUES($1,'NATIONAL_ID',NULL,$2,$3,$4,'PENDING') RETURNING id`,
            [created.id, nationalIdCipher, nationalIdHash, nationalIdLast4],
          )
        ).rows[0];
        await client.query(
          `INSERT INTO registration_submissions(
             user_id,reference,form_version,answers,declarations,national_id_ciphertext,
             national_id_last4,ip_address,user_agent
           ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            created.id,
            reference,
            registrationVersion,
            JSON.stringify(answers),
            JSON.stringify(declarations),
            nationalIdCipher,
            nationalIdLast4,
            req.ip || null,
            req.get('user-agent')?.slice(0, 1000) || null,
          ],
        );
        const challenge = (
          await client.query<{ id: string }>(
            `INSERT INTO verification_codes(user_id,code,type,expires_at)
             VALUES($1,$2,'email_verification',NOW()+($3 * INTERVAL '1 minute')) RETURNING id`,
            [created.id, otp.digest, emailOtpExpiryMinutes],
          )
        ).rows[0];
        return { ...created, kycId: kyc.id, challengeId: challenge.id };
      });
      await audit(req, 'ACCOUNT_REGISTERED', 'user', user.id, user.id);
      await audit(req, 'KYC_SUBMITTED', 'kyc_verification', user.kycId, user.id);
      let emailSent = true;
      try {
        await sendEmailVerification(user.email, user.first_name, otp.raw);
        await audit(req, 'EMAIL_VERIFICATION_SENT', 'user', user.id, user.id);
      } catch (error) {
        emailSent = false;
        await query('UPDATE verification_codes SET is_used=true,used_at=NOW() WHERE id=$1', [
          user.challengeId,
        ]);
        console.error('Unable to send registration verification email', {
          userId: user.id,
          error,
        });
      }
      return res.status(201).json({
        success: true,
        message: emailSent
          ? 'We sent a six-digit verification code to your email address.'
          : 'Your account was created, but the verification email could not be sent. Use resend to try again.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.first_name,
            lastName: user.last_name,
          },
          registrationReference: reference,
          emailVerificationRequired: true,
          emailSent,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/auth/email-otp/resend',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  async (req, res, next) => {
    try {
      if (errorsFor(req).length)
        return res.status(400).json({ success: false, message: 'Enter a valid email address' });
      const user = (
        await query<{ id: string; email: string; first_name: string }>(
          `SELECT id,email,first_name FROM users
           WHERE email=$1 AND status='ACTIVE' AND deleted_at IS NULL
             AND email_verification_required=true AND is_email_verified=false`,
          [req.body.email],
        )
      )[0];
      if (!user)
        return res.status(202).json({
          success: true,
          message: 'If that account needs verification, a new code has been sent.',
        });
      const delivery = await resendEmailOtp({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
      });
      if (delivery.retryAfter > 0) {
        res.setHeader('Retry-After', String(delivery.retryAfter));
        return res.status(429).json({
          success: false,
          code: 'OTP_RESEND_COOLDOWN',
          message: `Wait ${delivery.retryAfter} seconds before requesting another code.`,
        });
      }
      await audit(req, 'EMAIL_VERIFICATION_SENT', 'user', user.id, user.id);
      return res.status(202).json({
        success: true,
        message: 'A new six-digit code has been sent. It expires in 10 minutes.',
      });
    } catch (error) {
      console.error('Unable to resend email verification code', { error });
      return next(
        Object.assign(new Error('We could not send the verification email. Please try again.'), {
          status: 503,
        }),
      );
    }
  },
);

router.post(
  '/auth/email-otp/verify',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('code')
    .trim()
    .matches(/^\d{6}$/),
  body('remember').optional().isBoolean().toBoolean(),
  async (req, res, next) => {
    try {
      if (errorsFor(req).length)
        return res.status(400).json({
          success: false,
          code: 'OTP_INVALID',
          message: 'Enter the six-digit code from your email.',
        });
      const submittedDigest = digestEmailOtp(req.body.email, req.body.code, config.jwtSecret);
      const verified = await transaction(async (client) => {
        const challenge = (
          await client.query<{
            id: string;
            code: string;
            expires_at: Date;
            attempt_count: number;
            max_attempts: number;
            user_id: string;
            email: string;
            phone: string;
            first_name: string;
            last_name: string;
            auth_version: number;
          }>(
            `SELECT vc.id,vc.code,vc.expires_at,vc.attempt_count,vc.max_attempts,
                    u.id AS user_id,u.email,u.phone,u.first_name,u.last_name,u.auth_version
             FROM verification_codes vc JOIN users u ON u.id=vc.user_id
             WHERE u.email=$1 AND u.status='ACTIVE' AND u.deleted_at IS NULL
               AND u.email_verification_required=true AND u.is_email_verified=false
               AND vc.type='email_verification' AND vc.is_used=false
             ORDER BY vc.created_at DESC LIMIT 1 FOR UPDATE OF vc,u`,
            [req.body.email],
          )
        ).rows[0];
        if (!challenge) return null;
        const expired = new Date(challenge.expires_at).getTime() <= Date.now();
        if (expired || challenge.attempt_count >= challenge.max_attempts) {
          await client.query(
            'UPDATE verification_codes SET is_used=true,used_at=NOW() WHERE id=$1',
            [challenge.id],
          );
          return null;
        }
        if (challenge.code !== submittedDigest) {
          await client.query(
            `UPDATE verification_codes
             SET attempt_count=attempt_count+1,
                 is_used=(attempt_count+1>=max_attempts),
                 used_at=CASE WHEN attempt_count+1>=max_attempts THEN NOW() ELSE used_at END
             WHERE id=$1`,
            [challenge.id],
          );
          return null;
        }
        await client.query('UPDATE verification_codes SET is_used=true,used_at=NOW() WHERE id=$1', [
          challenge.id,
        ]);
        await client.query(
          `UPDATE users SET is_email_verified=true,email_verification_required=false,
             email_verified_at=NOW(),updated_at=NOW() WHERE id=$1`,
          [challenge.user_id],
        );
        return challenge;
      });
      if (!verified)
        return res.status(400).json({
          success: false,
          code: 'OTP_INVALID',
          message: 'That code is incorrect or expired. Check the email or request a new code.',
        });
      await audit(req, 'EMAIL_VERIFIED', 'user', verified.user_id, verified.user_id);
      setAuthCookie(
        res,
        await createSession({
          id: verified.user_id,
          email: verified.email,
          authVersion: verified.auth_version,
        }),
        req.body.remember !== false,
      );
      return res.json({
        success: true,
        message: 'Email verified. Your PataPesa account is ready.',
        data: {
          user: {
            id: verified.user_id,
            email: verified.email,
            phone: verified.phone,
            firstName: verified.first_name,
            lastName: verified.last_name,
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/auth/login',
  loginLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
  body('remember').optional().isBoolean().toBoolean(),
  async (req, res, next) => {
    try {
      if (errorsFor(req).length)
        return res
          .status(400)
          .json({ success: false, message: 'Enter a valid email and password' });
      const user = (
        await query<{
          id: string;
          email: string;
          phone: string;
          first_name: string;
          last_name: string;
          password_hash: string;
          status: string;
          auth_version: number;
          is_email_verified: boolean;
          email_verification_required: boolean;
        }>(
          'SELECT id,email,phone,first_name,last_name,password_hash,status,auth_version,is_email_verified,email_verification_required FROM users WHERE email=$1 AND deleted_at IS NULL',
          [req.body.email],
        )
      )[0];
      if (!user || !(await bcrypt.compare(req.body.password, user.password_hash)))
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      if (user.status !== 'ACTIVE') {
        const statusMessages: Record<string, string> = {
          PENDING: 'Your account setup is still pending. Contact support if this does not resolve.',
          SUSPENDED: 'Your account is suspended. Contact support for assistance.',
          REJECTED: 'Your account access has been disabled. Contact support for assistance.',
        };
        return res.status(403).json({
          success: false,
          message: statusMessages[user.status] || 'This account is not active. Contact support.',
        });
      }
      if (user.email_verification_required && !user.is_email_verified)
        return res.status(403).json({
          success: false,
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: 'Verify your email address before signing in.',
        });
      const delivery = await issueLoginOtp({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
      });
      await audit(req, 'LOGIN_OTP_SENT', 'user', user.id, user.id);
      return res.status(202).json({
        success: true,
        code: 'LOGIN_OTP_REQUIRED',
        message: delivery.sent
          ? 'We sent a six-digit sign-in code to your email address.'
          : 'Use the sign-in code already sent to your email address.',
        data: {
          email: user.email,
          retryAfter: delivery.retryAfter,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/auth/login/verify-otp',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('code')
    .trim()
    .matches(/^\d{6}$/),
  body('remember').optional().isBoolean().toBoolean(),
  async (req, res, next) => {
    try {
      if (errorsFor(req).length)
        return res.status(400).json({
          success: false,
          code: 'OTP_INVALID',
          message: 'Enter the six-digit code from your email.',
        });
      const submittedDigest = digestEmailOtp(req.body.email, req.body.code, config.jwtSecret);
      const verified = await transaction(async (client) => {
        const challenge = (
          await client.query<{
            id: string;
            code: string;
            expires_at: Date;
            attempt_count: number;
            max_attempts: number;
            user_id: string;
            email: string;
            phone: string;
            first_name: string;
            last_name: string;
            auth_version: number;
          }>(
            `SELECT vc.id,vc.code,vc.expires_at,vc.attempt_count,vc.max_attempts,
                    u.id AS user_id,u.email,u.phone,u.first_name,u.last_name,u.auth_version
             FROM verification_codes vc JOIN users u ON u.id=vc.user_id
             WHERE u.email=$1 AND u.status='ACTIVE' AND u.deleted_at IS NULL
               AND vc.type='2fa_login' AND vc.is_used=false
             ORDER BY vc.created_at DESC LIMIT 1 FOR UPDATE OF vc,u`,
            [req.body.email],
          )
        ).rows[0];
        if (!challenge) return null;
        const expired = new Date(challenge.expires_at).getTime() <= Date.now();
        if (expired || challenge.attempt_count >= challenge.max_attempts) {
          await client.query(
            'UPDATE verification_codes SET is_used=true,used_at=NOW() WHERE id=$1',
            [challenge.id],
          );
          return null;
        }
        if (challenge.code !== submittedDigest) {
          await client.query(
            `UPDATE verification_codes
             SET attempt_count=attempt_count+1,
                 is_used=(attempt_count+1>=max_attempts),
                 used_at=CASE WHEN attempt_count+1>=max_attempts THEN NOW() ELSE used_at END
             WHERE id=$1`,
            [challenge.id],
          );
          return null;
        }
        await client.query('UPDATE verification_codes SET is_used=true,used_at=NOW() WHERE id=$1', [
          challenge.id,
        ]);
        await client.query('UPDATE users SET last_login=NOW(),updated_at=NOW() WHERE id=$1', [
          challenge.user_id,
        ]);
        return challenge;
      });
      if (!verified)
        return res.status(400).json({
          success: false,
          code: 'OTP_INVALID',
          message: 'That code is incorrect or expired. Sign in again to request a new code.',
        });
      setAuthCookie(
        res,
        await createSession({
          id: verified.user_id,
          email: verified.email,
          authVersion: verified.auth_version,
        }),
        req.body.remember !== false,
      );
      await audit(req, 'LOGIN_SUCCEEDED', 'user', verified.user_id, verified.user_id);
      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: verified.user_id,
            email: verified.email,
            phone: verified.phone,
            firstName: verified.first_name,
            lastName: verified.last_name,
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post('/auth/logout', async (req, res, next) => {
  try {
    await revokeSession(req);
    clearAuthCookie(res);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/auth/forgot-password',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  async (req, res, next) => {
    try {
      if (errorsFor(req).length)
        return res.status(400).json({ success: false, message: 'Enter a valid email' });
      const user = (
        await query<{ id: string; email: string; first_name: string }>(
          "SELECT id,email,first_name FROM users WHERE email=$1 AND status='ACTIVE' AND deleted_at IS NULL",
          [req.body.email],
        )
      )[0];
      if (user) {
        const token = resetToken();
        await transaction(async (client) => {
          await client.query(
            'UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=$1 AND used_at IS NULL',
            [user.id],
          );
          await client.query(
            "INSERT INTO password_reset_tokens(user_id,token_digest,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 minutes')",
            [user.id, token.digest],
          );
        });
        try {
          await sendPasswordReset(user.email, user.first_name, token.raw);
        } catch (error) {
          await query('UPDATE password_reset_tokens SET used_at=NOW() WHERE token_digest=$1', [
            token.digest,
          ]);
          console.error('Unable to send password reset email', { userId: user.id, error });
        }
      }
      return res.status(202).json({
        success: true,
        message: 'If an active account matches that email, a reset link has been sent.',
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/auth/reset-password',
  authLimiter,
  body('token').isString().isLength({ min: 40, max: 128 }),
  passwordRule(),
  async (req, res, next) => {
    try {
      const errors = errorsFor(req);
      if (errors.length) return res.status(400).json({ success: false, message: errors[0] });
      const digest = digestResetToken(req.body.token),
        hash = await bcrypt.hash(req.body.password, 12);
      const changed = await transaction(async (client) => {
        const token = (
          await client.query<{ id: string; user_id: string }>(
            'SELECT id,user_id FROM password_reset_tokens WHERE token_digest=$1 AND used_at IS NULL AND expires_at>NOW() FOR UPDATE',
            [digest],
          )
        ).rows[0];
        if (!token) return false;
        await client.query(
          'UPDATE users SET password_hash=$1,auth_version=auth_version+1,updated_at=NOW() WHERE id=$2',
          [hash, token.user_id],
        );
        await client.query('UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1', [
          token.id,
        ]);
        return true;
      });
      if (!changed)
        return res
          .status(400)
          .json({ success: false, message: 'This reset link is invalid or expired' });
      clearAuthCookie(res);
      return res.json({
        success: true,
        message: 'Password changed. Sign in with your new password.',
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get('/auth/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = (
      await query(
        'SELECT id,email,phone,first_name AS "firstName",last_name AS "lastName",is_email_verified AS "emailVerified" FROM users WHERE id=$1',
        [userId(req)],
      )
    )[0];
    return user
      ? res.json({ success: true, data: user })
      : res.status(404).json({ success: false, message: 'Account not found' });
  } catch (error) {
    return next(error);
  }
});

router.get('/account/overview', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = userId(req);
    const [users, applications, kycRows, payments, loans, installments] = await Promise.all([
      query(
        'SELECT id,email,phone,first_name AS "firstName",last_name AS "lastName",is_email_verified AS "emailVerified" FROM users WHERE id=$1',
        [id],
      ),
      query(
        `SELECT la.id,la.application_number AS "applicationNumber",lp.name AS product,
         la.loan_amount AS amount,la.loan_term AS term,la.purpose,la.status,
         la.interest_rate AS "interestRate",la.total_amount_payable AS "totalPayable",
         la.monthly_payment AS "monthlyPayment",la.rejection_reason AS "rejectionReason",
         la.reviewed_at AS "reviewedAt",la.created_at AS "createdAt",la.updated_at AS "updatedAt"
         FROM loan_applications la JOIN loan_products lp ON lp.id=la.product_id
         WHERE la.user_id=$1 ORDER BY la.created_at DESC`,
        [id],
      ),
      query(
        'SELECT id,id_type AS "idType",COALESCE(id_number_last4,RIGHT(id_number,4)) AS "idNumberLast4",verification_status AS status,rejection_reason AS "rejectionReason",created_at AS "createdAt" FROM kyc_verifications WHERE user_id=$1',
        [id],
      ),
      query(
        `SELECT p.id,p.loan_id AS "loanId",l.loan_number AS "loanNumber",
         p.payment_amount AS amount,p.currency,p.payment_method AS method,
         p.transaction_reference AS reference,p.payment_status AS status,
         p.payment_date AS "paymentDate",p.failure_reason AS "failureReason"
         FROM payments p JOIN loans l ON l.id=p.loan_id
         WHERE p.user_id=$1 ORDER BY p.payment_date DESC`,
        [id],
      ),
      query(
        `SELECT l.id,l.loan_number AS "loanNumber",l.principal_amount AS principal,
         l.total_amount_payable AS "totalPayable",COALESCE(p.paid,0) AS paid,
         GREATEST(l.total_amount_payable-COALESCE(p.paid,0),0) AS outstanding,
         l.status,l.disbursement_date AS "disbursedAt",l.maturity_date AS "maturityDate"
         FROM loans l
         LEFT JOIN (SELECT loan_id,SUM(payment_amount) paid FROM payments
           WHERE payment_status='COMPLETED' GROUP BY loan_id) p ON p.loan_id=l.id
         WHERE l.user_id=$1 ORDER BY l.disbursement_date DESC`,
        [id],
      ),
      query(
        `SELECT rs.id,l.loan_number AS "loanNumber",rs.sequence_number AS sequence,
         rs.due_date AS "dueDate",rs.total_due AS "totalDue",rs.amount_paid AS "amountPaid",
         GREATEST(rs.total_due-rs.amount_paid,0) AS remaining,rs.status
         FROM repayment_schedules rs JOIN loans l ON l.id=rs.loan_id
         WHERE l.user_id=$1 ORDER BY rs.due_date,rs.sequence_number LIMIT 120`,
        [id],
      ),
    ]);
    if (!users[0]) return res.status(404).json({ success: false, message: 'Account not found' });
    return res.json({
      success: true,
      data: {
        user: users[0],
        applications,
        kyc: kycRows[0] || null,
        payments,
        loans,
        installments,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/products', async (_req, res, next) => {
  try {
    const rows = await query(
      'SELECT id,product_code AS code,name,description,min_amount AS "minAmount",max_amount AS "maxAmount",min_term AS "minTerm",max_term AS "maxTerm",interest_rate AS "interestRate",processing_fee AS "processingFee",currency FROM loan_products WHERE status=\'ACTIVE\' ORDER BY min_amount',
    );
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/integrations', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT provider,public_id AS "publicId",home_slot AS "homeSlot",
       loans_slot AS "loansSlot" FROM site_integrations WHERE enabled=true ORDER BY provider`,
    );
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/ads', async (req, res, next) => {
  try {
    const slot = String(req.query.slot || '').toUpperCase();
    if (slot && !['HOME_BELOW_PLANNER', 'LOANS_BELOW_HEADER'].includes(slot))
      return res.status(400).json({ success: false, message: 'Unknown advertising placement' });
    const rows = await query(
      `SELECT slot,sponsor,headline,body,cta_label AS "ctaLabel",target_url AS "targetUrl",
       image_url AS "imageUrl" FROM ad_placements
       WHERE enabled=true AND ($1='' OR slot=$1)
       AND (starts_at IS NULL OR starts_at<=NOW())
       AND (ends_at IS NULL OR ends_at>NOW())
       ORDER BY slot`,
      [slot],
    );
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

router.get('/loans/applications', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const rows = await query(
      'SELECT la.id,la.application_number AS "applicationNumber",lp.name AS product,la.loan_amount AS amount,la.loan_term AS term,la.purpose,la.status,la.interest_rate AS "interestRate",la.total_amount_payable AS "totalPayable",la.monthly_payment AS "monthlyPayment",la.created_at AS "createdAt" FROM loan_applications la JOIN loan_products lp ON lp.id=la.product_id WHERE la.user_id=$1 ORDER BY la.created_at DESC',
      [userId(req)],
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/loans/applications',
  requireAuth,
  body('productId').isUUID(),
  body('amount').isFloat({ min: 1000, max: 1000000 }),
  body('term').isInt({ min: 1, max: 36 }),
  body('purposeCategory').isIn(loanPurposeCategories),
  body('purpose')
    .trim()
    .isLength({ min: 20, max: 255 })
    .withMessage('Explain the intended use in at least 20 characters'),
  body('repaymentSource')
    .trim()
    .isLength({ min: 3, max: 160 })
    .withMessage('Explain how you expect to repay this loan'),
  body('employmentType').isIn(employmentTypes),
  body('incomeRange').isIn(incomeRanges),
  body('sourceOfIncome')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Enter your main source of income'),
  body('existingMonthlyDebt').isFloat({ min: 0, max: 10000000 }).toFloat(),
  body('declarationAccepted')
    .equals('true')
    .withMessage('Confirm that this loan application is accurate'),
  body('requestId').isUUID().withMessage('Application request identifier is invalid'),
  async (req: AuthRequest, res, next) => {
    try {
      const errors = errorsFor(req);
      if (errors.length)
        return res.status(400).json({ success: false, message: errors[0], errors });
      await query(
        `INSERT INTO user_profiles(user_id,employment_type,employment_status,income_range,source_of_income,profile_completed_at,country)
         VALUES($1,$2,$2,$3,$4,NOW(),'Kenya')
         ON CONFLICT(user_id) DO UPDATE SET employment_type=EXCLUDED.employment_type,
           employment_status=EXCLUDED.employment_status,income_range=EXCLUDED.income_range,
           source_of_income=EXCLUDED.source_of_income,profile_completed_at=NOW(),updated_at=NOW()`,
        [userId(req), req.body.employmentType, req.body.incomeRange, req.body.sourceOfIncome],
      );
      const eligibility = (
        await query<{
          age_years: number | null;
          profile_completed_at: string | null;
          income_range: string | null;
        }>(
          `SELECT EXTRACT(YEAR FROM age(CURRENT_DATE,u.date_of_birth))::int AS age_years,
           up.profile_completed_at,up.income_range FROM users u
           LEFT JOIN user_profiles up ON up.user_id=u.id WHERE u.id=$1`,
          [userId(req)],
        )
      )[0];
      if (!eligibility || eligibility.age_years === null || eligibility.age_years < 18)
        return res
          .status(403)
          .json({ success: false, message: 'Applicants must be at least 18 years old' });
      if (!eligibility.profile_completed_at || !eligibility.income_range)
        return res.status(409).json({
          success: false,
          message: 'Complete your employment and income profile before applying',
        });
      const replay = (
        await query(
          'SELECT id,application_number AS "applicationNumber",status,total_amount_payable AS "totalPayable",monthly_payment AS "monthlyPayment" FROM loan_applications WHERE user_id=$1 AND request_id=$2',
          [userId(req), req.body.requestId],
        )
      )[0];
      if (replay)
        return res.json({
          success: true,
          message: 'Loan application was already received',
          data: replay,
        });
      const openApplication = await query(
        "SELECT 1 FROM loan_applications WHERE user_id=$1 AND status IN ('SUBMITTED','UNDER_REVIEW','APPROVED') LIMIT 1",
        [userId(req)],
      );
      if (openApplication.length)
        return res.status(409).json({
          success: false,
          message: 'You already have an application awaiting a decision',
        });
      const product = (
        await query<{
          id: string;
          min_amount: string;
          max_amount: string;
          min_term: number;
          max_term: number;
          interest_rate: string;
          processing_fee: string;
        }>(
          "SELECT id,min_amount,max_amount,min_term,max_term,interest_rate,processing_fee FROM loan_products WHERE id=$1 AND status='ACTIVE'",
          [req.body.productId],
        )
      )[0];
      if (!product)
        return res.status(404).json({ success: false, message: 'Loan product not found' });
      const amount = Number(req.body.amount),
        term = Number(req.body.term);
      if (
        amount < Number(product.min_amount) ||
        amount > Number(product.max_amount) ||
        term < product.min_term ||
        term > product.max_term
      )
        return res
          .status(400)
          .json({ success: false, message: "Amount or term is outside this product's limits" });
      const quote = calculateLoan(
        amount,
        Number(product.interest_rate),
        Number(product.processing_fee || 0),
        term,
      );
      const existingDebt = Number(req.body.existingMonthlyDebt),
        referenceIncome = incomeReference[eligibility.income_range] || 0,
        affordabilityRatio = referenceIncome
          ? (quote.monthly + existingDebt) / referenceIncome
          : Number.POSITIVE_INFINITY;
      if (!Number.isFinite(affordabilityRatio) || affordabilityRatio > 0.5)
        return res.status(422).json({
          success: false,
          message:
            'The estimated monthly commitment is above 50% of your declared income range. Choose a lower amount or longer term.',
        });
      const number = `PPL-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
      const application = (
        await query(
          `INSERT INTO loan_applications(user_id,product_id,request_id,application_number,loan_amount,loan_term,purpose,purpose_category,repayment_source,existing_monthly_debt,affordability_ratio,declaration_accepted,status,interest_rate,processing_fee,total_amount_payable,monthly_payment)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,'SUBMITTED',$12,$13,$14,$15)
           RETURNING id,application_number AS "applicationNumber",status,total_amount_payable AS "totalPayable",monthly_payment AS "monthlyPayment"`,
          [
            userId(req),
            product.id,
            req.body.requestId,
            number,
            amount,
            term,
            req.body.purpose,
            req.body.purposeCategory,
            req.body.repaymentSource,
            existingDebt,
            affordabilityRatio,
            product.interest_rate,
            quote.fee,
            quote.total,
            quote.monthly,
          ],
        )
      )[0] as { id: string };
      await audit(req, 'LOAN_APPLICATION_SUBMITTED', 'loan_application', application.id);
      return res.status(201).json({
        success: true,
        message: 'Loan application submitted for review',
        data: application,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get('/kyc', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const row =
      (
        await query(
          'SELECT id,id_type AS "idType",COALESCE(id_number_last4,RIGHT(id_number,4)) AS "idNumberLast4",verification_status AS status,rejection_reason AS "rejectionReason",created_at AS "createdAt" FROM kyc_verifications WHERE user_id=$1',
          [userId(req)],
        )
      )[0] || null;
    return res.json({ success: true, data: row });
  } catch (error) {
    return next(error);
  }
});
router.post(
  '/kyc',
  requireAuth,
  body('idType').isIn(['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE']),
  body('idNumber')
    .trim()
    .matches(/^[A-Za-z0-9-]{5,50}$/)
    .withMessage('Enter a valid document number'),
  async (req: AuthRequest, res, next) => {
    try {
      const errors = errorsFor(req);
      if (errors.length) return res.status(400).json({ success: false, message: errors[0] });
      const normalized = String(req.body.idNumber).replace(/\s/g, '').toUpperCase();
      const cipher = encryptSensitive(normalized, config.kycEncryptionKey),
        index = blindIndex(normalized, config.kycEncryptionKey),
        last4 = normalized.slice(-4);
      const row = (
        await query(
          'INSERT INTO kyc_verifications(user_id,id_type,id_number,id_number_ciphertext,id_number_hash,id_number_last4,verification_status) VALUES($1,$2,NULL,$3,$4,$5,\'PENDING\') ON CONFLICT(user_id) DO UPDATE SET id_type=EXCLUDED.id_type,id_number=NULL,id_number_ciphertext=EXCLUDED.id_number_ciphertext,id_number_hash=EXCLUDED.id_number_hash,id_number_last4=EXCLUDED.id_number_last4,verification_status=\'PENDING\',rejection_reason=NULL,updated_at=NOW() RETURNING id,id_type AS "idType",id_number_last4 AS "idNumberLast4",verification_status AS status',
          [userId(req), req.body.idType, cipher, index, last4],
        )
      )[0] as { id: string };
      await audit(req, 'KYC_SUBMITTED', 'kyc_verification', row.id);
      return res
        .status(201)
        .json({ success: true, message: 'Identity details submitted for verification', data: row });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/payments',
  requireAuth,
  paymentLimiter,
  body('loanId').isUUID().withMessage('Choose a valid loan'),
  body('amount')
    .isFloat({ min: 1, max: 10_000_000 })
    .matches(/^\d+(?:\.\d{1,2})?$/)
    .withMessage('Enter a valid payment amount with no more than two decimal places'),
  body('method')
    .isIn(['MOBILE_MONEY', 'BANK_TRANSFER'])
    .withMessage('Choose mobile money or bank transfer'),
  body('reference')
    .trim()
    .matches(/^[A-Za-z0-9][A-Za-z0-9._/-]{4,99}$/)
    .withMessage('Enter the transaction reference from your payment receipt'),
  body('paymentDate').isISO8601({ strict: true }).withMessage('Enter a valid payment date'),
  async (req: AuthRequest, res, next) => {
    try {
      const errors = errorsFor(req);
      if (errors.length) return res.status(400).json({ success: false, message: errors[0] });
      const amount = Number(req.body.amount),
        reference = String(req.body.reference).trim().toUpperCase(),
        paymentDate = new Date(`${req.body.paymentDate}T12:00:00+03:00`);
      if (!isRecentKenyanPaymentDate(req.body.paymentDate, new Date()))
        return res.status(400).json({
          success: false,
          message: 'Payment date must be within the last 31 days and cannot be in the future',
        });
      const payment = await transaction(async (client) => {
        const loan = (
          await client.query<{ id: string }>(
            `SELECT id FROM loans WHERE id=$1 AND user_id=$2
             AND status IN ('ACTIVE','DEFAULTED') FOR UPDATE`,
            [req.body.loanId, userId(req)],
          )
        ).rows[0];
        if (!loan) return { error: 'LOAN_NOT_FOUND' } as const;
        const balance = (
          await client.query<{ available: string }>(
            `SELECT GREATEST(
             l.total_amount_payable
             - COALESCE((SELECT SUM(p.payment_amount) FROM payments p
               WHERE p.loan_id=l.id AND p.payment_status='COMPLETED'),0)
             - COALESCE((SELECT SUM(p.payment_amount) FROM payments p
               WHERE p.loan_id=l.id AND p.payment_status IN ('PENDING','PROCESSING')),0)
             ,0) AS available
             FROM loans l WHERE l.id=$1`,
            [loan.id],
          )
        ).rows[0];
        if (amount > Number(balance.available) + 0.005)
          return { error: 'AMOUNT_EXCEEDS_BALANCE', available: Number(balance.available) } as const;
        const schedule = (
          await client.query<{ id: string }>(
            `SELECT id FROM repayment_schedules
             WHERE loan_id=$1 AND status NOT IN ('PAID','WAIVED')
             AND total_due+late_fee-amount_paid>0
             ORDER BY sequence_number LIMIT 1`,
            [loan.id],
          )
        ).rows[0];
        if (!schedule) return { error: 'NO_PAYMENT_DUE' } as const;
        const row = (
          await client.query(
            `INSERT INTO payments(
             loan_id,repayment_schedule_id,user_id,payment_amount,payment_method,
             transaction_reference,payment_status,payment_date,notes
             ) VALUES($1,$2,$3,$4,$5,$6,'PENDING',$7,'Customer-submitted external repayment awaiting verification')
             RETURNING id,payment_amount AS amount,payment_method AS method,
             transaction_reference AS reference,payment_status AS status,payment_date AS "paymentDate"`,
            [loan.id, schedule.id, userId(req), amount, req.body.method, reference, paymentDate],
          )
        ).rows[0];
        return { row } as const;
      });
      if ('error' in payment) {
        if (payment.error === 'AMOUNT_EXCEEDS_BALANCE')
          return res.status(409).json({
            success: false,
            message: `Payment exceeds the available balance of KES ${payment.available.toLocaleString(
              'en-KE',
            )}`,
          });
        return res.status(409).json({
          success: false,
          message:
            payment.error === 'NO_PAYMENT_DUE'
              ? 'This loan has no unpaid instalment'
              : 'Only your active or overdue loans can receive payments',
        });
      }
      await audit(req, 'REPAYMENT_SUBMITTED', 'payment', String(payment.row.id));
      return res.status(201).json({
        success: true,
        data: payment.row,
        message: 'Payment submitted for verification',
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get('/payments', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const rows = await query(
      `SELECT p.id,p.loan_id AS "loanId",l.loan_number AS "loanNumber",
       p.payment_amount AS amount,p.currency,p.payment_method AS method,
       p.transaction_reference AS reference,p.payment_status AS status,
       p.payment_date AS "paymentDate",p.failure_reason AS "failureReason"
       FROM payments p JOIN loans l ON l.id=p.loan_id
       WHERE p.user_id=$1 ORDER BY p.payment_date DESC`,
      [userId(req)],
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

router.get(
  '/admin/applications',
  requireAuth,
  requirePermission('loans:review'),
  async (_req, res, next) => {
    try {
      const rows =
        await query(`SELECT la.id,la.application_number AS "applicationNumber",la.loan_amount AS amount,
    la.loan_term AS term,la.purpose,la.purpose_category AS "purposeCategory",la.repayment_source AS "repaymentSource",
    la.existing_monthly_debt AS "existingMonthlyDebt",la.affordability_ratio AS "affordabilityRatio",
    la.monthly_payment AS "monthlyPayment",la.status,la.created_at AS "createdAt",lp.name AS product,
    u.first_name AS "firstName",u.last_name AS "lastName",u.email,
    EXTRACT(YEAR FROM age(CURRENT_DATE,u.date_of_birth))::int AS age,up.income_range AS "incomeRange",
    up.employment_type AS "employmentType",u.status AS "userStatus",
    (up.profile_completed_at IS NOT NULL) AS "profileComplete",la.declaration_accepted AS "declarationAccepted",
    COALESCE(k.verification_status,'NOT_SUBMITTED') AS "kycStatus"
    FROM loan_applications la JOIN loan_products lp ON lp.id=la.product_id JOIN users u ON u.id=la.user_id
    LEFT JOIN user_profiles up ON up.user_id=u.id LEFT JOIN kyc_verifications k ON k.user_id=u.id
    WHERE la.status IN ('SUBMITTED','UNDER_REVIEW','APPROVED') ORDER BY la.created_at ASC LIMIT 200`);
      return res.json({ success: true, data: rows });
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  '/admin/applications/:id',
  requireAuth,
  requirePermission('loans:review'),
  param('id').isUUID(),
  body('status').isIn(['UNDER_REVIEW', 'APPROVED', 'REJECTED']),
  body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  async (req: AuthRequest, res, next) => {
    try {
      const errors = errorsFor(req);
      if (errors.length) return res.status(400).json({ success: false, message: errors[0] });
      if (req.body.status === 'REJECTED' && !req.body.reason)
        return res.status(400).json({ success: false, message: 'A rejection reason is required' });
      if (req.body.status === 'APPROVED') {
        const candidate = (
          await query<{
            userStatus: string;
            adult: boolean;
            profileComplete: boolean;
            declarationAccepted: boolean;
            affordabilityRatio: string | null;
            kycStatus: string;
          }>(
            `SELECT u.status AS "userStatus",
             (u.date_of_birth<=CURRENT_DATE-INTERVAL '18 years') AS adult,
             (up.profile_completed_at IS NOT NULL) AS "profileComplete",
             la.declaration_accepted AS "declarationAccepted",
             la.affordability_ratio AS "affordabilityRatio",
             COALESCE(k.verification_status,'NOT_SUBMITTED') AS "kycStatus"
             FROM loan_applications la JOIN users u ON u.id=la.user_id
             LEFT JOIN user_profiles up ON up.user_id=la.user_id
             LEFT JOIN kyc_verifications k ON k.user_id=la.user_id
             WHERE la.id=$1 AND la.status IN ('SUBMITTED','UNDER_REVIEW')`,
            [req.params.id],
          )
        )[0];
        if (!candidate)
          return res.status(409).json({
            success: false,
            message: 'This application is no longer awaiting review',
          });
        const blockers = [
          candidate.userStatus !== 'ACTIVE' ? 'customer account is not active' : '',
          !candidate.adult ? 'customer age is not eligible' : '',
          !candidate.profileComplete ? 'customer profile is incomplete' : '',
          !candidate.declarationAccepted ? 'application declaration is missing' : '',
          Number(candidate.affordabilityRatio ?? Number.POSITIVE_INFINITY) > 0.5
            ? 'monthly commitment exceeds the 50% affordability limit'
            : '',
          candidate.kycStatus !== 'APPROVED'
            ? `KYC is ${candidate.kycStatus.toLowerCase().replace(/_/g, ' ')}`
            : '',
        ].filter(Boolean);
        if (blockers.length)
          return res.status(409).json({
            success: false,
            message: `Cannot approve: ${blockers.join('; ')}`,
            data: { blockers },
          });
      }
      const row = (
        await query(
          `UPDATE loan_applications SET status=$1,rejection_reason=$2,reviewed_by=$3,reviewed_at=NOW(),
      approval_date=CASE WHEN $5::boolean THEN NOW() ELSE approval_date END,updated_at=NOW()
      WHERE id=$4 AND status IN ('SUBMITTED','UNDER_REVIEW') RETURNING id,application_number AS "applicationNumber",status`,
          [
            req.body.status,
            req.body.status === 'REJECTED' ? req.body.reason : null,
            userId(req),
            req.params.id,
            req.body.status === 'APPROVED',
          ],
        )
      )[0] as { id: string } | undefined;
      if (!row)
        return res
          .status(409)
          .json({ success: false, message: 'This application is no longer awaiting review' });
      await audit(req, 'LOAN_APPLICATION_REVIEWED', 'loan_application', row.id);
      return res.json({ success: true, data: row, message: 'Application updated' });
    } catch (error) {
      return next(error);
    }
  },
);

router.get('/admin/kyc', requireAuth, requirePermission('kyc:review'), async (_req, res, next) => {
  try {
    const rows =
      await query(`SELECT k.id,k.id_type AS "idType",COALESCE(k.id_number_last4,RIGHT(k.id_number,4)) AS "idNumberLast4",
    k.verification_status AS status,k.created_at AS "createdAt",u.first_name AS "firstName",u.last_name AS "lastName",u.email
    FROM kyc_verifications k JOIN users u ON u.id=k.user_id WHERE k.verification_status='PENDING' ORDER BY k.created_at ASC LIMIT 200`);
    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

router.get(
  '/admin/kyc/:id/identity',
  requireAuth,
  requirePermission('kyc:review'),
  param('id').isUUID(),
  async (req: AuthRequest, res, next) => {
    try {
      const errors = errorsFor(req);
      if (errors.length) return res.status(400).json({ success: false, message: errors[0] });
      const row = (
        await query<{ id: string; id_number_ciphertext: string | null; id_number: string | null }>(
          'SELECT id,id_number_ciphertext,id_number FROM kyc_verifications WHERE id=$1',
          [req.params.id],
        )
      )[0];
      if (!row)
        return res.status(404).json({ success: false, message: 'Identity record not found' });
      const idNumber = row.id_number_ciphertext
        ? decryptSensitive(row.id_number_ciphertext, config.kycEncryptionKey)
        : row.id_number;
      await audit(req, 'KYC_IDENTITY_VIEWED', 'kyc_verification', row.id);
      return res.json({ success: true, data: { idNumber } });
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  '/admin/kyc/:id',
  requireAuth,
  requirePermission('kyc:review'),
  param('id').isUUID(),
  body('status').isIn(['APPROVED', 'REJECTED']),
  body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  async (req: AuthRequest, res, next) => {
    try {
      const errors = errorsFor(req);
      if (errors.length) return res.status(400).json({ success: false, message: errors[0] });
      if (req.body.status === 'REJECTED' && !req.body.reason)
        return res.status(400).json({ success: false, message: 'A rejection reason is required' });
      const row = (
        await query(
          `UPDATE kyc_verifications SET verification_status=$1,rejection_reason=$2,verified_by=$3,verified_at=NOW(),updated_at=NOW()
      WHERE id=$4 AND verification_status='PENDING' RETURNING id,verification_status AS status`,
          [
            req.body.status,
            req.body.status === 'REJECTED' ? req.body.reason : null,
            userId(req),
            req.params.id,
          ],
        )
      )[0] as { id: string } | undefined;
      if (!row)
        return res
          .status(409)
          .json({ success: false, message: 'This identity submission is no longer pending' });
      await audit(req, 'KYC_REVIEWED', 'kyc_verification', row.id);
      return res.json({ success: true, data: row, message: 'Identity review updated' });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/contact',
  contactLimiter,
  body('name').trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .matches(/^\+?[0-9]{7,15}$/),
  body('subject').trim().isLength({ min: 3, max: 160 }),
  body('message').trim().isLength({ min: 10, max: 4000 }),
  async (req, res, next) => {
    try {
      const errors = errorsFor(req);
      if (errors.length) return res.status(400).json({ success: false, message: errors[0] });
      const row = (
        await query(
          'INSERT INTO support_requests(name,email,phone,subject,message) VALUES($1,$2,$3,$4,$5) RETURNING reference',
          [
            req.body.name,
            req.body.email,
            req.body.phone || null,
            req.body.subject,
            req.body.message,
          ],
        )
      )[0];
      return res
        .status(201)
        .json({ success: true, message: 'Your request has been received', data: row });
    } catch (error) {
      return next(error);
    }
  },
);

// Keep the consolidated admin router after the legacy review endpoints so a
// matching request is authenticated exactly once.
router.use('/admin', adminRoutes);

export default router;
