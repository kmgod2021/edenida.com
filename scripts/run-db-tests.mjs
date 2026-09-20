import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

async function main() {
  const dbUrl =
    process.env.DATABASE_URL ??
    (fs.existsSync(".tmp-db-url")
      ? fs.readFileSync(".tmp-db-url", "utf8").trim()
      : "");

  if (!dbUrl) {
    console.error("DATABASE_URL / .tmp-db-url missing");
    process.exit(2);
  }

  const dir = path.join("supabase", "tests", "database");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new Client({
    connectionString: dbUrl.replace(/[?&]sslmode=[^&]+/g, ""),
    ssl: { rejectUnauthorized: false },
  });

  const notices = [];
  client.on("notice", (n) => {
    notices.push(n.message);
  });

  await client.connect();
  await client.query("create extension if not exists pgtap with schema extensions");

  let failed = 0;
  for (const file of files) {
    notices.length = 0;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    process.stdout.write(`▶ ${file} ... `);
    try {
      await client.query(sql);
      const tapFail = notices.some((m) => /^not ok /m.test(m) || /Failed/i.test(m));
      if (tapFail) {
        failed += 1;
        console.log("FAIL");
        console.error(notices.join("\n"));
      } else {
        console.log("ok");
      }
    } catch (err) {
      failed += 1;
      console.log("FAIL");
      console.error(err instanceof Error ? err.message : err);
      if (notices.length) console.error(notices.join("\n"));
    }
  }

  await client.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
