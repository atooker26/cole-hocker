/**
 * Create an admin user via the Supabase GoTrue admin REST API (service-role key).
 * Uses fetch directly to avoid the supabase-js realtime/websocket dependency.
 * Usage: ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret npm run create:admin
 * Since there's no public signup, any user that exists is an admin.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email || !password) {
  console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD");
  process.exit(1);
}

async function main() {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: key as string,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Failed (${res.status}):`, body.msg ?? body.error ?? body);
    process.exit(1);
  }
  console.log(`✓ Created admin: ${body.email ?? email}`);
}

main();
