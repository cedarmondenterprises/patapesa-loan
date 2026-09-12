import nodemailer from 'nodemailer';
import { config } from './config';

const transporter =
  config.smtp.host && config.smtp.from
    ? nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        ...(config.smtp.user
          ? { auth: { user: config.smtp.user, pass: config.smtp.password } }
          : {}),
      })
    : null;

export async function sendPasswordReset(
  email: string,
  firstName: string,
  token: string,
): Promise<void> {
  if (!transporter) throw new Error('SMTP is not configured');
  const resetUrl = `${config.publicAppUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const safeName = firstName.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Reset your PataPesa password',
    text: `Hello ${firstName},\n\nUse this link within 30 minutes to reset your PataPesa password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<!doctype html><html><body style="margin:0;background:#f7f4ec;font-family:Arial,sans-serif;color:#18211e"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:40px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:auto;background:#fffdf7;border-top:5px solid #123c32"><tr><td style="padding:30px 34px"><div style="font-size:22px;font-weight:800;color:#123c32">PataPesa</div><p style="margin:36px 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;color:#9a5e33">SECURE ACCOUNT ACCESS</p><h1 style="margin:0;font-size:29px;line-height:1.2;color:#123c32">Reset your password</h1><p style="margin:22px 0 0;line-height:1.7">Hello ${safeName},</p><p style="line-height:1.7;color:#56645f">We received a request to change the password for your PataPesa account. This secure link expires in 30 minutes.</p><p style="margin:28px 0"><a href="${resetUrl}" style="display:inline-block;padding:14px 22px;background:#123c32;color:white;text-decoration:none;font-weight:700;border-radius:5px">Choose a new password</a></p><p style="font-size:13px;line-height:1.6;color:#718079">If you did not request this change, you can safely ignore this email. Your existing password will remain unchanged.</p></td></tr><tr><td style="padding:18px 34px;background:#eee9df;font-size:11px;color:#718079">PataPesa · Credit, explained clearly.</td></tr></table></td></tr></table></body></html>`,
  });
}
