import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { Client } from "pg";
import fs from "node:fs";

config({ path: ".env.local" });

function getDbUrl() {
  return (
    process.env.DATABASE_URL ??
    (fs.existsSync(".tmp-db-url")
      ? fs.readFileSync(".tmp-db-url", "utf8").trim()
      : "")
  );
}

function dbClient() {
  const dbUrl = getDbUrl();
  if (!dbUrl) throw new Error("DATABASE_URL / .tmp-db-url required");
  return new Client({
    connectionString: dbUrl.replace(/[?&]sslmode=[^&]+/g, ""),
    ssl: { rejectUnauthorized: false },
  });
}

/** Development-only: confirm email for an existing auth user. */
export async function confirmUserEmail(email) {
  const client = dbClient();
  await client.connect();
  const res = await client.query(
    `update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
     where email = $1
     returning id`,
    [email],
  );
  await client.end();
  if (res.rowCount !== 1) {
    throw new Error(`confirmUserEmail: expected 1 row, got ${res.rowCount}`);
  }
  return res.rows[0].id;
}

/**
 * Development-only: create a confirmed email user + identity.
 * Avoids Auth signup rate limits during E2E. Does not use SUPABASE_SECRET_KEY.
 */
export async function createConfirmedUser({ email, password, fullName }) {
  const client = dbClient();
  await client.connect();
  try {
    const res = await client.query(
      `with created as (
         insert into auth.users (
           instance_id, id, aud, role, email, encrypted_password,
           email_confirmed_at,
           confirmation_token, recovery_token, email_change_token_new, email_change,
           raw_app_meta_data, raw_user_meta_data,
           created_at, updated_at, is_sso_user, is_anonymous
         ) values (
           '00000000-0000-0000-0000-000000000000',
           gen_random_uuid(),
           'authenticated',
           'authenticated',
           $1,
           extensions.crypt($2, extensions.gen_salt('bf')),
           now(),
           '', '', '', '',
           '{"provider":"email","providers":["email"]}'::jsonb,
           jsonb_build_object('full_name', $3::text),
           now(),
           now(),
           false,
           false
         )
         returning id, email
       ),
       ident as (
         insert into auth.identities (
           id, user_id, identity_data, provider, provider_id,
           last_sign_in_at, created_at, updated_at
         )
         select
           gen_random_uuid(),
           created.id,
           jsonb_build_object('sub', created.id::text, 'email', created.email),
           'email',
           created.id::text,
           now(),
           now(),
           now()
         from created
         returning user_id
       )
       select user_id as id from ident`,
      [email, password, fullName ?? "E2E User"],
    );
    return res.rows[0].id;
  } finally {
    await client.end();
  }
}

export function createPublishableClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing publishable Supabase env");
  return createClient(url, key);
}
