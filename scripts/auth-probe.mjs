import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { confirmUserEmail } from "./dev-auth-helpers.mjs";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("MISSING_ENV");
  process.exit(1);
}

const sb = createClient(url, key);
const id = crypto.randomUUID().slice(0, 8);
const email = `edenida.auth.${id}@mailinator.com`;
const password = `TestPass!${id}aA1`;

const sign = await sb.auth.signUp({
  email,
  password,
  options: { data: { full_name: "Auth Probe" } },
});

console.log(`SIGNUP_ERROR=${sign.error ? sign.error.message : "none"}`);
console.log(`HAS_SESSION=${Boolean(sign.data.session)}`);
console.log(`HAS_USER=${Boolean(sign.data.user)}`);
console.log(
  `EMAIL_CONFIRMATION=${!sign.data.session && sign.data.user ? "ON" : sign.data.session ? "OFF" : "UNKNOWN"}`,
);

if (sign.data.user && !sign.data.session) {
  await confirmUserEmail(email);
  console.log("DEV_EMAIL_CONFIRMED=YES");
}

const login = await sb.auth.signInWithPassword({ email, password });
console.log(`LOGIN_ERROR=${login.error ? login.error.message : "none"}`);
console.log(`LOGIN_SESSION=${Boolean(login.data.session)}`);

const {
  data: { user },
} = await sb.auth.getUser();
console.log(`GET_USER=${Boolean(user)}`);

await sb.auth.signOut();
const after = await sb.auth.getSession();
console.log(`AFTER_LOGOUT_SESSION=${Boolean(after.data.session)}`);

const login2 = await sb.auth.signInWithPassword({ email, password });
console.log(`RELOGIN_SESSION=${Boolean(login2.data.session)}`);
await sb.auth.signOut();

const anon = createClient(url, key);
const { data, error } = await anon.from("weddings").select("id").limit(1);
console.log(`ANON_WEDDINGS_COUNT=${data?.length ?? "null"}`);
console.log(`ANON_WEDDINGS_ERROR=${error?.code ?? error?.message ?? "none"}`);
