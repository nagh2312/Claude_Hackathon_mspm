/** Canonical browser origin for links in emails and redirects (no trailing slash). */
export function getPublicAppOrigin(): string {
  const n = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "");
  if (n) return n;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3001";
}
