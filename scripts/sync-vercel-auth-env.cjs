/**
 * Push server env vars from .env.local to Vercel Production (CLI).
 *
 * Requires: npx vercel login (once). Then:
 *   npm run sync:vercel-env -- --scope YOUR_TEAM_SLUG --project mind-canvas
 *
 * If NEXTAUTH_URL in .env.local is localhost, pass your live site:
 *   npm run sync:vercel-env -- --scope ... --project ... --production-url https://your-app.vercel.app
 *
 * Optional: --dry-run (print keys only, no writes)
 * Optional: VERCEL_TOKEN or VERCEL_TEAM / VERCEL_PROJECT env vars.
 */
const { readFileSync, existsSync } = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");
const { homedir } = require("os");

function parseArgs(argv) {
  const out = {
    team: process.env.VERCEL_TEAM || process.env.VERCEL_SCOPE || "",
    project: process.env.VERCEL_PROJECT || "",
    productionUrl: "",
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--team" || a === "--scope") && argv[i + 1]) out.team = argv[++i];
    else if (a === "--project" && argv[i + 1]) out.project = argv[++i];
    else if (a === "--production-url" && argv[i + 1]) out.productionUrl = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
  }
  return out;
}

function parseDotEnv(filePath) {
  const raw = readFileSync(filePath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function vercelAuthJsonPath() {
  const h = homedir();
  const local = process.env.LOCALAPPDATA || path.join(h, "AppData", "Local");
  const roaming = process.env.APPDATA || path.join(h, "AppData", "Roaming");
  const candidates = [
    path.join(roaming, "com.vercel.cli", "Data", "auth.json"),
    path.join(local, "com.vercel.cli", "Data", "auth.json"),
    path.join(local, "com.vercel.cli", "auth.json"),
    path.join(roaming, "com.vercel.cli", "auth.json"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function hasVercelCliAuth() {
  if (process.env.VERCEL_TOKEN && String(process.env.VERCEL_TOKEN).trim()) return true;
  return Boolean(vercelAuthJsonPath());
}

function runVercel(subargs) {
  const token = process.env.VERCEL_TOKEN && String(process.env.VERCEL_TOKEN).trim();
  const args = ["vercel"];
  if (token) args.push("-t", token);
  args.push(...subargs);
  const r = spawnSync("npx", args, {
    stdio: "inherit",
    shell: true,
    cwd: path.join(__dirname, ".."),
  });
  return r.status ?? 1;
}

/** Keys pulled from .env.local when set (order preserved). sensitive → Vercel --sensitive */
const ENV_KEYS = [
  { key: "NEXTAUTH_SECRET", sensitive: true, required: true },
  { key: "NEXTAUTH_URL", sensitive: false, required: true }, // value may be overridden by --production-url
  { key: "DATABASE_URL", sensitive: true },
  { key: "RESEND_API_KEY", sensitive: true },
  { key: "EMAIL_FROM", sensitive: false },
  { key: "GOOGLE_CLIENT_ID", sensitive: false },
  { key: "GOOGLE_CLIENT_SECRET", sensitive: true },
  { key: "ANTHROPIC_API_KEY", sensitive: true },
  { key: "OPENAI_API_KEY", sensitive: true },
];

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");
const { team, project, productionUrl, dryRun } = parseArgs(process.argv);

if (!existsSync(envPath)) {
  console.error("Missing .env.local at", envPath);
  process.exit(1);
}

if (!hasVercelCliAuth()) {
  console.error(
    "Vercel CLI is not logged in on this machine (no auth.json, no VERCEL_TOKEN).\n\n" +
      `  cd "${root}"\n` +
      "  npx vercel login\n\n" +
      "Then run again:\n" +
      "  npm run sync:vercel-env -- --scope YOUR_TEAM_SLUG --project mind-canvas\n"
  );
  process.exit(1);
}

if (!team || !project) {
  console.error(
    "Pass scope (team slug) and project, e.g.:\n" +
      "  npm run sync:vercel-env -- --scope nagh2312s-projects --project mind-canvas\n" +
      "Or set VERCEL_TEAM (or VERCEL_SCOPE) and VERCEL_PROJECT."
  );
  process.exit(1);
}

const env = parseDotEnv(envPath);
const secret = env.NEXTAUTH_SECRET;
let nextAuthUrl = productionUrl || env.NEXTAUTH_URL;

if (dryRun) {
  console.log("\nDry run — keys that would be pushed (values hidden):\n");
  if (!secret) console.log("  NEXTAUTH_SECRET: MISSING (required for real run)");
  else console.log("  NEXTAUTH_SECRET: present");
  const urlOk = nextAuthUrl && !/localhost|127\.0\.0\.1/i.test(nextAuthUrl);
  if (!nextAuthUrl) console.log("  NEXTAUTH_URL: MISSING");
  else if (!urlOk && !productionUrl) {
    console.log("  NEXTAUTH_URL: localhost in .env.local — add --production-url https://... for a real push");
  } else console.log("  NEXTAUTH_URL: present");
  for (const { key } of ENV_KEYS) {
    if (key === "NEXTAUTH_SECRET" || key === "NEXTAUTH_URL") continue;
    const v = env[key];
    console.log(`  ${key}: ${v && String(v).trim() ? "present" : "(skip)"}`);
  }
  console.log("\nRun without --dry-run to apply (NEXTAUTH_URL cannot be localhost unless you pass --production-url).\n");
  process.exit(0);
}

if (runVercel(["link", "--yes", "--scope", team, "--project", project, "--non-interactive"]) !== 0) {
  process.exit(1);
}

if (!secret) {
  console.error(".env.local has no NEXTAUTH_SECRET");
  process.exit(1);
}
if (!nextAuthUrl) {
  console.error(".env.local has no NEXTAUTH_URL (or pass --production-url https://...)");
  process.exit(1);
}
if (!productionUrl && /localhost|127\.0\.0\.1/i.test(nextAuthUrl)) {
  console.error(
    "NEXTAUTH_URL in .env.local is localhost. Pass your live URL, e.g.:\n" +
      "  npm run sync:vercel-env -- --scope ... --project ... --production-url https://YOUR-APP.vercel.app"
  );
  process.exit(1);
}

const values = { ...env, NEXTAUTH_SECRET: secret, NEXTAUTH_URL: nextAuthUrl };

const add = (name, value, sensitive) => {
  const args = [
    "env",
    "add",
    name,
    "production",
    "--value",
    value,
    "--yes",
    "--force",
    "--non-interactive",
  ];
  args.push(sensitive ? "--sensitive" : "--no-sensitive");
  return runVercel(args);
};

console.log("\nPushing to Vercel Production…\n");
for (const { key, sensitive, required } of ENV_KEYS) {
  const raw = values[key];
  const v = raw != null ? String(raw).trim() : "";
  if (!v) {
    if (required) {
      console.error(`Missing required value for ${key}`);
      process.exit(1);
    }
    console.log(`Skip ${key} (empty in .env.local)`);
    continue;
  }
  console.log(`Set ${key}…`);
  if (add(key, v, sensitive) !== 0) process.exit(1);
}

console.log(
  "\nDone. Redeploy Production on Vercel (Deployments → Redeploy) so every variable is picked up.\n"
);
