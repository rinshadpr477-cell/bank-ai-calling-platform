# Bank Outbound AI Calling Platform

An AI-powered outbound calling platform for banks, insurers, and educational institutions. Upload a customer list, configure a campaign, and let an AI agent — powered by Twilio + Google Gemini Live — call each customer, hold a real conversation, and report back a structured outcome your team can act on.

## Architecture

This repository contains two separate services, orchestrated together via Docker Compose:

```
├── bank-ai-calling/           # Main Next.js application
│   ├── Dashboard, Campaigns, Billing, Settings UI
│   ├── Auth (Credentials + Google OAuth)
│   ├── PostgreSQL (via Prisma) — all persistent data
│   └── Redis/BullMQ — enqueues "call next customer" jobs
│
├── bank-ai-calling-bridge/    # Twilio ↔ Gemini Live audio bridge
│   ├── server.ts   — handles live call audio (Twilio Media Streams ↔ Gemini)
│   ├── worker.ts   — separate process, consumes the Redis queue,
│   │                 decides who to call next and dials via Twilio
│   └── lib/        — audio codec conversion, Gemini Live client,
│                      Twilio helpers, internal API client
│
└── docker-compose.yml         # Runs all 3 services together:
                                #   main-app, bridge-server, bridge-worker
```

**Why two services:** the main app handles everything data/UI-related. The bridge server is a separate, always-on process specifically for real-time audio streaming (Twilio Media Streams ↔ Gemini Live WebSocket) — a fundamentally different workload than a normal request/response web app. The bridge server never touches the database directly; it talks to the main app through an authenticated internal API (`x-internal-secret` header) to keep all business logic (RBAC, billing, validation) in one place.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend/Backend | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Forms & Validation | React Hook Form + Zod |
| Database | PostgreSQL (Neon, serverless) |
| ORM | Prisma 7 (driver adapter, `@prisma/adapter-pg`) |
| Auth | Auth.js v5 — Credentials + Google OAuth |
| Queue | Redis (Upstash) + BullMQ |
| AI Voice | Google Gemini Live (native audio, real-time) |
| Telephony | Twilio (Voice + Media Streams) |
| Payments | Razorpay (Subscriptions API) |
| Notifications | Sonner (toast UI) |
| Containerization | Docker + Docker Compose |

## Modules (per original spec)

1. **Authentication** — Login, Register, Google OAuth, JWT sessions, RBAC (Admin/Supervisor/Agent)
2. **Dashboard** — real-time call/campaign/credit stats
3. **Customer CSV Upload** — validates duplicates, malformed numbers, missing fields
4. **Campaign Configuration** — name, AI prompt, language
5. **AI Calling Engine** — Twilio + Gemini Live pipeline, auto-advances through a customer list via a Redis-backed queue
6. **Live Conversation** — polling-based live status/transcript view while a call is in progress
7. **Transcript & AI Summary** — AI self-reports a structured outcome (interested, sentiment, loan amount, callback) when it ends the call; falls back honestly to "Unknown" (never a false negative) if the connection drops before that happens
8. **Billing** — free tier (10 calls) + Razorpay subscription (₹500/month), webhook-driven status updates
9. **Settings** — platform-wide defaults: AI prompt, business hours, retry attempts

## Prerequisites

- Docker Desktop
- A Neon PostgreSQL database
- An Upstash Redis database
- A Twilio account (phone number + Account SID + Auth Token)
- A Google AI Studio API key (Gemini)
- A Google Cloud OAuth Client (for Google Sign-In)
- A Razorpay account (test mode is fine for development)

## Environment Variables

### `bank-ai-calling/.env`

```env
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
INTERNAL_API_SECRET=
REDIS_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_PLAN_ID=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

### `bank-ai-calling-bridge/.env`

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
GOOGLE_GENAI_API_KEY=
BACKEND_URL=
MAIN_APP_URL=
INTERNAL_API_SECRET=
REDIS_URL=
PORT=8080
```

**`INTERNAL_API_SECRET` and `REDIS_URL` must be character-for-character identical between both `.env` files.**

⚠️ **Never commit `.env` files.** Both are already excluded via `.gitignore`.

## Local Development (without Docker)

Requires 4 terminals:

```bash
# Terminal 1 — main app
cd bank-ai-calling && npm install && npm run dev

# Terminal 2 — bridge server (handles live call audio)
cd bank-ai-calling-bridge && npm install && npm run dev

# Terminal 3 — bridge worker (processes the campaign queue)
cd bank-ai-calling-bridge && npm run worker

# Terminal 4 — ngrok (exposes the bridge server for Twilio webhooks)
ngrok http 8080
```

Update `BACKEND_URL` in the bridge's `.env` to match ngrok's forwarding URL, then restart Terminal 2.

## Running with Docker Compose (recommended)

```bash
docker-compose up --build
```

This builds and runs all three services together: `main-app` (port 3000), `bridge-server` (port 8080), and `bridge-worker` (no exposed port, background job processor).

> **Windows note:** if the build fails with `invalid file request` errors related to file paths, disable BuildKit first:
> ```powershell
> $env:DOCKER_BUILDKIT=0
> $env:COMPOSE_DOCKER_CLI_BUILD=0
> docker-compose up --build
> ```

Containers communicate via `host.docker.internal` to reach services running outside Docker (like ngrok on your host machine) — see each service's `.env` for the exact URLs used.

## Known Limitations

- **Gemini Live occasionally disconnects mid-call** (WebSocket close code 1007) — an intermittent issue on Google's side. When this happens, the platform saves an honest fallback record ("connection interrupted, outcome unknown — needs manual follow-up") rather than a real summary, and never records a false "not interested."
- **Gemini's live transcription events are unreliable** — audio streams correctly, but text transcription of what was said sometimes doesn't arrive. Call summaries rely primarily on the AI self-reporting its own conclusion when it ends the call, not on transcription.
- **Razorpay billing is code-complete but untested end-to-end** — recurring card payments require Razorpay to activate e-mandate/recurring-payment permissions on the account, which is a KYC/business step outside engineering scope.
- **Twilio trial accounts** can only call verified phone numbers.

## Deployment Status

- [x] Local development environment
- [x] Docker + Docker Compose (verified working end-to-end, including a real live call)
- [ ] AWS EC2 provisioning
- [ ] NGINX reverse proxy + SSL
- [ ] CI/CD (GitHub Actions)

## License

Proprietary — internal project.

<img width="1872" height="1010" alt="image" src="https://github.com/user-attachments/assets/718b74fd-d05a-413c-a9c4-f87ab3731ce2" />
