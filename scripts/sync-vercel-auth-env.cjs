/**
 * Push NEXTAUTH_SECRET and NEXTAUTH_URL from .env.local to Vercel Production.
 *
 * Requires Vercel CLI auth (one-time): run `npx vercel login` in your own terminal
 * and complete the browser/device flow — that step cannot be completed by an agent.
 *
 * Usage:
 *   npm run sync:vercel-env -- --scope YOUR_TEAM_SLUG --project mind-canvas
 *
 * If .env.local has NEXTAUTH_URL=http://localhost:3001, pass the live URL:
 *   npm run sync:vercel-env -- --scope ... --project ... --production-url https://mind-canvas.vercel.app
 *
 * Or set VERCEL_TEAM / VERCEL_PROJECT (same as --scope/--project). Optional: VERCEL_TOKEN for CI (never commit it).
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
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--team" || a === "--scope") && argv[i + 1]) out.team = argv[++i];
    else if (a === "--project" && argv[i + 1]) out.project = argv[++i];
    else if (a === "--production-url" && argv[i + 1]) out.productionUrl = argv[++i];
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
  // Current CLI (Windows): Roaming\com.vercel.cli\Data\auth.json
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

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");
const { team, project, productionUrl } = parseArgs(process.argv);

if (!existsSync(envPath)) {
  console.error("Missing .env.local at", envPath);
  process.exit(1);
}

if (!hasVercelCliAuth()) {
  console.error(
    "Vercel CLI is not logged in on this machine (no auth.json, no VERCEL_TOKEN).\n\n" +
      "In your own terminal (outside the agent), run once:\n" +
      `  cd "${root}"\n` +
      "  npx vercel login\n\n" +
      "Complete the browser/device prompt, then run again:\n" +
      "  npm run sync:vercel-env -- --scope YOUR_TEAM_SLUG --project mind-canvas\n"
  );
  process.exit(1);
}

if (!team || !project) {
  console.error(
    "Pass scope (team slug) and project for non-interactive link, e.g.:\n" +
      "  npm run sync:vercel-env -- --scope nagh2312s-projects --project mind-canvas\n" +
      "Or set env vars VERCEL_TEAM (or VERCEL_SCOPE) and VERCEL_PROJECT.\n" +
      "Team slug appears in the dashboard URL: vercel.com/<team-slug>/..."
  );
  process.exit(1);
}

if (runVercel(["link", "--yes", "--scope", team, "--project", project, "--non-interactive"]) !== 0) {
  process.exit(1);
}

const env = parseDotEnv(envPath);
const secret = env.NEXTAUTH_SECRET;
let url = productionUrl || env.NEXTAUTH_URL;

if (!secret) {
  console.error(".env.local has no NEXTAUTH_SECRET");
  process.exit(1);
}
if (!url) {
  console.error(".env.local has no NEXTAUTH_URL (or pass --production-url https://...)");
  process.exit(1);
}
if (!productionUrl && /localhost|127\.0\.0\.1/i.test(url)) {
  console.error(
    "NEXTAUTH_URL in .env.local is localhost. For Vercel Production use your real URL, e.g.:\n" +
      "  npm run sync:vercel-env -- --scope ... --project ... --production-url https://YOUR-APP.vercel.app"
  );
  process.exit(1);
}

const add = (name, value, extra) => {
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
  if (extra) args.push(...extra);
  return runVercel(args);
};

if (add("NEXTAUTH_SECRET", secret, ["--sensitive"]) !== 0) process.exit(1);
if (add("NEXTAUTH_URL", url, ["--no-sensitive"]) !== 0) process.exit(1);

console.log("\nDone. Trigger a new Production deploy on Vercel so these variables apply.\n");
