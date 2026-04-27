# Mind Canvas — Reflection Journal

We built this together for our hackathon — a full **capture → normalize → understand → fork → nurture → store → reflect** flow for a gentler journaling experience. The stack we settled on is **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**, with the heavy lifting on the server where we could keep API keys safe.

We are not pretending this is medical or crisis care. We wired the crisis path to **static** copy and resources we chose deliberately; anything a model says still has to pass our own routing rules, and we know that is not the same as a real safety system.

---

## How we organized the codebase

We split things so each of us could own a slice without stepping on the same files all night:

| Path | What we used it for |
|------|---------------------|
| `app/page.tsx` | Main experience: today’s flow vs Reflection Garden, and wiring the phases together |
| `app/layout.tsx` | Fonts, metadata, overall shell |
| `app/globals.css` | Tailwind base + the view-transition easing we liked |
| `app/api/process-entry/route.ts` | Our server pipeline: normalize (vision when we have keys), analysis, fork, then nurture/visual only on the safe path |
| `app/api/transcribe/route.ts` | Optional Whisper path when we have OpenAI credits |
| `lib/domain/types.ts` | Shared shapes for entries, analysis, fork — one source of truth |
| `lib/domain/crisis-resources.ts` | Crisis copy and links we wrote and reviewed together |
| `lib/services/safety-router.ts` | Deterministic fork from crisis level so the UI does not “guess” |
| `lib/services/creative-visual.ts` | Mapping sentiment into a CSS journal “page” we could ship without image gen |
| `lib/services/nurture.ts` | Single gentle nudge so it never felt like a homework list |
| `lib/services/mock-analysis.ts` | Offline / demo analysis so judges and friends could click through without keys |
| `lib/services/persistence.ts` | `localStorage` for the hackathon — device-local, honest about what it is |
| `lib/services/reflect.ts` | Helpers for the garden views (timeline, themes, monthly blurb) |
| `lib/server/run-model-analysis.ts` | Where we call Claude for structured JSON, with fallback to mock |
| `lib/server/normalize-entry.ts` | Vision description for photos when Anthropic is enabled |
| `lib/client/api.ts` | Small `fetch` helpers the browser uses |
| `components/phases/*` | Each phase got its own component so we could parallelize UI work |
| `components/journal/JournalPage.tsx` | The shareable journal page look we iterated on |

---

## Running it locally (what we do day-of)

```bash
npm install
npm run dev
```

We pointed dev at **port 3001** and bound to **all interfaces** (`0.0.0.0`) so demos were easier in the same room:

- On whoever is driving the laptop: `http://localhost:3001`
- Friends on the same Wi‑Fi: `http://<that laptop’s LAN IP>:3001` (we grab the IP from `ipconfig` on Windows)

That still is not “the whole internet” — same building / network only.

When we wanted a **temporary public link** for someone off-site, we ran a second terminal while dev was up:

```bash
npm run tunnel
```

That uses localtunnel on **3001** and prints a URL (often `https://....loca.lt`) we could drop in chat. Tunnels were perfect for quick demos; when we had the bandwidth we aimed for **Vercel** so the public link did not depend on someone’s laptop staying awake.

**Heads-up we learned the hard way:** `localhost` is only that one machine. Random people on the internet cannot hit your localhost; we need either a tunnel, real hosting, or port-forwarding if we are feeling brave.

### Env vars we share on the team (never in git)

We copied `.env.example` to `.env.local` locally and each kept our own keys out of commits.

- **`ANTHROPIC_API_KEY`** — turns on Claude for photo description, structured analysis, themes / sentiment JSON. If nobody has a key handy, the app still runs using **`mock-analysis.ts`**.
- **`OPENAI_API_KEY`** — optional; powers `/api/transcribe` for recorded clips. Without it we still had browser speech and plain typing.
- **Google sign-in (NextAuth)** — optional for the core flow; when set, cloud journal APIs can tie to a user. We use **`GOOGLE_CLIENT_ID`**, **`GOOGLE_CLIENT_SECRET`**, **`NEXTAUTH_SECRET`**, and **`NEXTAUTH_URL`** (local: `http://localhost:3001`; production: your real `https://…` URL with matching Google OAuth redirect URI).
- **Email nudges (Resend)** — optional: **`RESEND_API_KEY`** and **`EMAIL_FROM`** for the reminder route; fine to skip for a first deploy.

When we deploy to **Vercel**, we copy the same names into **Project → Settings → Environment Variables** (Production + Preview if we want previews to work too). After the first production URL exists, we update **Google Cloud Console** OAuth “Authorized JavaScript origins” and “Authorized redirect URIs” to include that URL and `…/api/auth/callback/google`.

---

## Production build (sanity check before we ship)

```bash
npm run build
npm start
```

We matched **`npm start`** to **port 3001** and `0.0.0.0` so it behaved like dev and we did not lose ten minutes to “wrong port” during judging.

---

## How we planned to host it

We need **Node** somewhere because we rely on **Next API routes** (e.g. `/api/process-entry`, `/api/transcribe`, `/api/auth`, `/api/journals`, `/api/companion-chat`, `/api/reminders/email`). A flat static export would not carry those unless we split a backend later — we did not want that scope during the hackathon.

### What we tried first — Vercel

This was our default for Next:

1. Repo lives on GitHub (this one).
2. We imported it in [Vercel](https://vercel.com/).
3. Next.js was auto-detected.
4. We added env vars in the dashboard: **`ANTHROPIC_API_KEY`**, and **`OPENAI_API_KEY`** if we wanted Whisper live.
5. Deploy — Vercel runs `next build` and gives us HTTPS.

We liked that keys never touched the client bundle.

### Netlify (backup plan)

A few of us had Netlify accounts, so we sketched this path too: import the repo, `npm run build`, use Netlify’s **Next.js** support (not a naive “publish `.next` as static files” — that would break our APIs). Same env vars in site settings.

### VPS (if we got extra nerdy)

Node 20+, clone, `npm ci`, `npm run build`, `npm start` under PM2 or systemd, Caddy/nginx in front on **443** proxying to **`127.0.0.1:3001`**, env vars in the unit file.

### Docker sketch we kept in notes

We never committed a `Dockerfile`, but this is the pattern we saved if one of us containerized it later:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["npm", "start"]
```

Build / run we would use: `docker build -t reflection-journal .` then `docker run -p 3001:3001 -e ANTHROPIC_API_KEY=... reflection-journal`.

---

## Privacy (what we tell people who try the demo)

Saved entries live in **browser `localStorage`** — clearing site data wipes them. If we ever ship this for real users, we agreed we owe them clearer data practices, stronger crisis disclaimers, and region-appropriate hotlines than our US-centric defaults.

---

*Built by our team for the hackathon — code, copy, tradeoffs, and late-night commits ours.*
