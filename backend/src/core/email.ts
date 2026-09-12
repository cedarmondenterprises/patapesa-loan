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
  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Reset your PataPesa password',
    text: `Hello ${firstName},\n\nUse this link within 30 minutes to reset your PataPesa password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
  });
}
