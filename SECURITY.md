# Security policy

Do not report vulnerabilities through public issues. Contact the private security address configured by the operator and include reproduction steps without real customer data.

## Deployment requirements

- Keep Docker, the VM OS, and dependencies patched.
- Permit public traffic only on 80/443; restrict SSH; never expose PostgreSQL.
- Store `.env` with mode `600` and rotate a secret immediately if it is disclosed.
- Use unique high-entropy values for database, JWT, KYC, and SMTP credentials.
- Back up PostgreSQL daily, encrypt backups, test restoration, and keep an off-VM copy.
- Forward container logs and Azure host metrics to monitored, access-controlled storage.
- Review audit logs and authentication rate-limit events.
- Never place customer identity data, access tokens, or production database copies in GitHub.

Sessions are carried in Secure, HttpOnly, SameSite cookies. Password resets are single-use, expire after 30 minutes, and revoke existing sessions by incrementing the account authentication version. New KYC identifiers are encrypted with AES-256-GCM and matched through a keyed blind index; only their final four characters are returned to customers.
