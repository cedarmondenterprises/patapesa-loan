import { pool, transaction } from '../core/db';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Usage: npm run admin:grant -- user@example.com');
  const user = await transaction(async (client) => {
    const match = (
      await client.query<{ id: string; email: string }>(
        "UPDATE users SET status='ACTIVE',auth_version=auth_version+1,updated_at=NOW() WHERE email=$1 AND status IN ('PENDING','ACTIVE','SUSPENDED','REJECTED') AND deleted_at IS NULL RETURNING id,email",
        [email],
      )
    ).rows[0];
    if (!match) throw new Error('No eligible account matches that email');
    await client.query(
      `DELETE FROM user_roles WHERE user_id=$1 AND role_id IN
      (SELECT id FROM admin_roles WHERE name IN ('SUPER_ADMIN','MANAGER','STAFF','PLATFORM_ADMIN'))`,
      [match.id],
    );
    await client.query(
      `INSERT INTO user_roles(user_id,role_id)
      SELECT $1,id FROM admin_roles WHERE name='SUPER_ADMIN' AND status='ACTIVE'`,
      [match.id],
    );
    await client.query(
      "INSERT INTO audit_logs(user_id,action,resource_type,resource_id,status) VALUES($1,'BOOTSTRAP_SUPER_ADMIN','user',$1,'SUCCESS')",
      [match.id],
    );
    return match;
  });
  console.log(`Granted SUPER_ADMIN to ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
