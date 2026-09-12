import { pool, query } from '../core/db';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Usage: npm run admin:grant -- user@example.com');
  const user = (
    await query<{ id: string; email: string }>(
      "SELECT id,email FROM users WHERE email=$1 AND status='ACTIVE' AND deleted_at IS NULL",
      [email],
    )
  )[0];
  if (!user) throw new Error('No active account matches that email');
  await query(
    `INSERT INTO user_roles(user_id,role_id)
    SELECT $1,id FROM admin_roles WHERE name='PLATFORM_ADMIN'
    ON CONFLICT(user_id,role_id) DO NOTHING`,
    [user.id],
  );
  console.log(`Granted PLATFORM_ADMIN to ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
