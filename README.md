# Reflection Journal

Structured hackathon scaffold for a **capture → normalize → understand → fork → nurture → store → reflect** journaling flow, built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.

This is **not** medical or crisis care. Crisis UI surfaces static resources only; model output is not a safety system by itself.

## Project layout

| Path | Role |
|------|------|
| `app/page.tsx` | Main UI: flow vs Reflection Garden, orchestrates phases |
| `app/layout.tsx` | Fonts, metadata, shell |
| `app/globals.css` | Tailwind + view-transition timing |
| `app/api/process-entry/route.ts` | Server pipeline: normalize (vision optional) + structured analysis + fork |
| `app/api/transcribe/route.ts` | Optional Whisper transcription (`OPENAI_API_KEY`) |
| `lib/domain/types.ts` | Shared types for entries, analysis, fork |
| `lib/domain/crisis-resources.ts` | Static crisis copy + links |
| `lib/services/safety-router.ts` | Deterministic fork from crisis level |
| `lib/services/creative-visual.ts` | Sentiment → CSS journal theme |
| `lib/services/nurture.ts` | One nurture suggestion |
| `lib/services/mock-analysis.ts` | Offline demo analysis + keyword demo guard |
| `lib/services/persistence.ts` | `localStorage` persistence (device-local) |
| `lib/services/reflect.ts` | Aggregations for the garden |
| `lib/server/run-model-analysis.ts` | Claude JSON analysis (falls back to mock) |
| `lib/server/normalize-entry.ts` | Claude vision image description |
| `lib/client/api.ts` | Browser `fetch` helpers |
| `components/phases/*` | Phase UI: capture, crisis, creative, nurture, reflect |
| `components/journal/JournalPage.tsx` | Shareable journal “page” presentation |

## Local development

```bash
npm install
npm run dev
```

The dev server listens on **port 3001** and **all network interfaces** (`0.0.0.0`):

- On this machine: `http://localhost:3001`
- On the same Wi‑Fi/LAN: `http://<your-computer-LAN-IP>:3001` (others must reach your network; this is not the public internet).

**Share with anyone on the internet (temporary tunnel):** in a second terminal, with dev already running:

```bash
npm run tunnel
```

Copy the printed `https://....loca.lt` (or similar) URL. Tunnels are fine for demos; we thought of hosting in **Vercel** for a stable public site, (time constraint)

> `localhost` alone is only your device. Public access requires a tunnel, port-forwarding + a public IP, or a hosted deploy.

### Environment variables

Copy `.env.example` to `.env.local` (never commit secrets).

- **`ANTHROPIC_API_KEY`** — enables Claude for vision description (photos), structured analysis, and theme/sentiment JSON. If omitted, the app uses **`mock-analysis.ts`** so the UI still runs.
- **`OPENAI_API_KEY`** — enables `/api/transcribe` for recorded audio. If omitted, use **browser speech** or type/paste text.

## Production build

```bash
npm run build
npm start
```

`npm start` runs the production server on port **3001** (all interfaces) to match `npm run dev`.

---

## Hosting guide

You need a host that runs a **Node.js** server because this app uses **API routes** (`/api/process-entry`, `/api/transcribe`). A pure static export is **not** enough unless you refactor processing to a separate backend.

### Option A — Vercel (recommended for Next.js)

1. Push the repository to GitHub (or GitLab / Bitbucket).
2. In [Vercel](https://vercel.com/), **Import** the repository.
3. Framework preset: **Next.js** (auto-detected).
4. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` — your Anthropic secret
   - `OPENAI_API_KEY` — optional, for Whisper
5. Deploy. Vercel runs `next build` and serves the app on HTTPS.

**Notes**

- Keys stay **server-side**; the browser never receives them.
- Free tier is usually enough for demos; watch API spend separately in Anthropic/OpenAI consoles.

### Option B — Netlify

1. Connect the repo in [Netlify](https://www.netlify.com/) → **Add new site** → **Import an existing project**.
2. Build command: `npm run build`.
3. Publish directory: **`.next`** is *not* used as static output — choose Netlify’s **Next.js** runtime / adapter if offered, or deploy via **Netlify CLI** with `@netlify/plugin-nextjs` (Netlify docs: “Next.js on Netlify”).
4. Add the same environment variables in **Site settings → Environment variables**.

If your Netlify setup only supports static sites, use **Vercel** or a **Node VPS** instead.

### Option C — Any VPS (Ubuntu, etc.)

1. Install Node **20 LTS** (or 18+) and `npm`.
2. Clone the repo, run `npm ci`, `npm run build`.
3. Run `npm start` behind a process manager (**systemd**, **PM2**, etc.).
4. Put **Caddy** or **nginx** in front for HTTPS and reverse-proxy to `127.0.0.1:3001`.
5. Set environment variables in the service definition (e.g. `Environment=ANTHROPIC_API_KEY=...` for systemd).

### Option D — Docker (portable)

Example `Dockerfile` pattern (you can add this file later if you want container deploys):

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

Build and run: `docker build -t reflection-journal .` then `docker run -p 3001:3001 -e ANTHROPIC_API_KEY=... reflection-journal`.

---

## Privacy reminder

Entries are stored in **browser `localStorage`** by default — clearing site data removes them. For real users, document data handling, crisis limitations, and regional hotline numbers.
