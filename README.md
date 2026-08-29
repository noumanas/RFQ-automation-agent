# RFQ Automation (Agentic)

Phase 1 scaffold per the PRD: ingest RFQs (WhatsApp/email webhooks, or a live public
chat widget), parse with an LLM into structured spec, match against catalog, price
deterministically, draft a reply, route by confidence, and expose both an async
review queue and a live CSR takeover view.

## Layout

- `apps/api` — Fastify + TypeScript + Prisma. Webhook intake, the pipeline stages
  (`src/pipeline/*`), the review-queue API, the live chat WebSocket routes, and
  the embeddable widget (`public/widget.js`) for third-party client sites.
- `apps/web` — Next.js app:
  - `app/page.tsx` — the **marketing landing page** (GSAP scroll animations,
    positions this as an agentic-automation build for distributors/wholesalers).
  - `app/demo/page.tsx` — the **interactive "try it" page**: a hero "describe the
    job" box with example-RFQ chips and a native React chat widget, both against
    the real pipeline.
  - `app/(staff)/` — the staff console (its own layout/nav, same URLs as before):
    `review` (async review queue, PRD 6.7) and `live` (CSR takeover view).

## Marketing page

`apps/web/app/page.tsx` is a full multi-section landing page — hero, the "problem
isn't your pricing" pitch, a 5-step "how it works" pipeline with a scroll-scrubbed
connecting line, an **agentic architecture diagram** (`components/ArchitectureDiagram.tsx`
— a supervisor "Confidence Orchestrator" fanning out to parsing/matching/pricing/
drafting agents, each with its own tool, lines drawing in on scroll), channel cards
(WhatsApp/email/website chat), a feature grid, a live quote-card teaser, and a
count-up stats band — animated with `gsap` + `ScrollTrigger` (`gsap.context()`
scoped to the page root, reverted on unmount). It also carries the same floating
`ChatWidget` as `/demo`, so visitors can try the real assistant without leaving
the pitch.

## Interactive demo & chat

`apps/web/app/demo/page.tsx` is the hands-on "try it" experience. It uses
`lib/useConversation.ts` (visitor id in `localStorage`, REST `/conversations`
create/resume, `/ws/conversations/:id` for streaming) — the same hook the
marketing page's floating widget uses, so there's one conversation implementation,
not two. It renders:

- A hero card: textarea, example-RFQ chips (solar panels, acrylic sheet, CCTV
  cameras, cable, LED bulbs, breakers), and a live status pill that goes
  **Thinking… → ✨ Estimate ready PKR X in Ys** (or **Needs one more detail** if the
  bot asks a follow-up question instead).
- `components/ChatWidget.tsx` — the floating bubble + panel (header, avatar,
  copy-to-clipboard on buyer bubbles, slate/cyan theme), fed by the same
  conversation state as the hero box so both stay in sync.
- `components/QuoteCard.tsx` — a resolved, priced quote renders as a structured
  card (item/quantity/unit price/total) instead of a wall of text.
  `pipeline/chat/respond.ts` (API side) attaches that data as `Message.meta` only
  when `confidence.autoSend`; clarifying questions and staff hand-offs stay plain
  bubbles. `components/MessageThread.tsx` renders this same bubble/card thread for
  both the widget and the staff `/live` console, so they never visually drift
  apart.

Each buyer turn runs through `pipeline/chat/respond.ts`, which re-parses the full
transcript (not just the latest message) so follow-up answers accumulate into the
same spec, then reuses the same catalogMatch/pricing/confidence/draft stages as the
webhook flow. It either replies with a quote, asks one more clarifying question, or
— after two unresolved clarifying turns — hands off with the PRD's "I don't want to
guess on this" line and flags the conversation for staff. An out-of-stock match
never gets a price/total (see `confidence.ts` / `pricing.ts` guard) — it always
routes to staff instead of auto-quoting a sale that can't happen.

`apps/api/public/widget.js` is a separate, dependency-free vanilla-JS build of the
same widget — this is the actual embeddable snippet a client's own website would
use (`<script src=".../widget.js" data-api="...">`), distinct from the React
version above. It exposes `window.RFQWidget = { open, close, send }` and fires an
`"rfq:message"` window event, so a host page's own script can drive the
conversation without reimplementing it.

## CSR live takeover

`apps/web/app/(staff)/live/page.tsx` connects to `/ws/staff` and shows every
conversation in real time, flagging ones the bot escalated (`needsAttention`).
Opening one and clicking **Take over** switches it to staff-authored replies — the
bot goes silent for that thread (`respond.ts` re-checks conversation status right
before posting, so a slow in-flight bot reply can't land after a human has already
answered) — until **Release to bot** hands it back.

If staff takes over and then goes quiet, the buyer isn't stranded forever: the next
buyer message checks how long it's been since the last staff activity, and if it's
over `STAFF_IDLE_TIMEOUT_MS` (5 minutes, in `pipeline/chat/respond.ts`), the
conversation is automatically handed back to the bot before that message is
answered.

## Setup

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL, and either ANTHROPIC_API_KEY or GEMINI_API_KEY
pnpm db:migrate
pnpm db:seed            # 140+ mock electronics/electrical catalog items
pnpm dev:api            # http://localhost:4000
pnpm dev:web            # http://localhost:3000
```

Set `LLM_PROVIDER` in `.env` to `anthropic` (default) or `gemini` to choose which
model runs the parsing (function/tool calling) and drafting stages — see
`apps/api/src/pipeline/providers/`.

## Deploying

**`apps/api` does not run on Vercel.** It's a persistent Fastify process with
long-lived WebSocket connections (`/ws/staff`, `/ws/conversations/:id`) and an
in-memory pub/sub hub (`lib/hub.ts`) — none of that fits Vercel's stateless,
per-request serverless model. Deploy it somewhere that runs a normal
long-lived Node process instead — Railway, Render, and Fly.io all work with
zero code changes. `apps/web` (the Next.js marketing site + staff console) is
a normal Next.js app and belongs on Vercel as usual.

**Railway** (recommended): the root `railway.json` is already set up for this
pnpm monorepo — it installs from the workspace root, then builds/starts only
`apps/api` via `pnpm --filter api`. To deploy:

1. Create a Railway project from this GitHub repo.
2. Add a Postgres plugin to the project — it auto-injects `DATABASE_URL` into
   linked services, so you don't need to provision one separately.
3. Set the service's environment variables: `LLM_PROVIDER`, and either
   `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` (+ `GEMINI_MODEL` if overriding the
   default). `PORT` is injected by Railway automatically — the app already
   reads `process.env.PORT` and binds `0.0.0.0`, matching Railway's convention.
4. After the first deploy, run `pnpm --filter api prisma:deploy` (runs `prisma
   migrate deploy`, the production-safe non-interactive equivalent of
   `prisma migrate dev`) and `pnpm --filter api db:seed` against the Railway
   Postgres instance — via `railway run` locally, or a one-off shell in the
   Railway dashboard.
5. Point `apps/web`'s `NEXT_PUBLIC_API_URL` (a Vercel env var for that
   project) at the Railway service's public URL.

`apps/api`'s `postinstall` runs `prisma generate` automatically after `pnpm
install`, and `build` runs it again as a defense-in-depth (`prisma generate &&
tsc`) — without it, `@prisma/client`'s query results fall back to untyped
`any`, which surfaces as a wall of `TS7006` "implicitly has an 'any' type"
errors on every `.find`/`.filter`/`.map`/`.reduce`/`.sort` callback touching a
Prisma result, in a fresh clone or CI environment that never ran it manually.

## Mock catalog

`apps/api/prisma/seed.ts` generates 140+ catalog items for the "electrical/
electronics wholesale" vertical the PRD targets: solar panels, inverters,
batteries, LED lighting, CCTV cameras, cable/wire, MCBs/breakers, switches &
sockets, extension boards, stabilizers, distribution boards, fans, junction boxes,
and tools — each with a few name aliases so `catalogMatch.ts` has real fuzzy-match
variety to work with. Stock levels are deterministic (not random, so reseeding is
idempotent), with roughly 1 in 17 items forced to zero stock to exercise the
out-of-stock path. One entry (`BAT-ITL-25V-100AH`) mirrors the PRD's own
"Lithium 25.6V 100AH ITEL IP20" out-of-stock example exactly.

## Pipeline

`apps/api/src/pipeline/orchestrator.ts` runs, per inbound RFQ:

1. `normalize.ts` — persist the raw inbound message as an `Rfq` row.
2. `parse.ts` — a forced function/tool call (Claude tool use or Gemini function
   calling, per `LLM_PROVIDER`) into the `ParsedSpec` shape from PRD 6.2.
   Missing fields stay `null`, never guessed.
3. `catalogMatch.ts` — exact SKU/alias lookup, falling back to a token-overlap
   score over `item_raw` + `spec` combined. That scoring is a placeholder for
   embedding similarity — swap it for pgvector once there's a real catalog to
   embed.
4. `retrieval.ts` — structured DB lookups: customer by phone/email, their order
   history for the matched SKU.
5. `pricing.ts` — deterministic tiered pricing (code, not LLM), only computed
   when the matched item is actually in stock.
6. `confidence.ts` — decides auto-send vs. review-queue routing per PRD 6.6,
   flagging the specific reason (unmatched item, missing field, out of stock,
   quantity anomaly).
7. `draft.ts` — the LLM drafts the customer-facing reply under the tone rules
   from the conversation design section (no exclamations, always give a number
   or a clear next step, ask one question at a time, never fabricate stock/price,
   PKR currency).

Everything the pipeline produces is stored on the `Quote`/`ParsedSpec` rows for
audit, whether it was auto-sent or went to review.

## Not yet wired up

- Real WhatsApp Business API / IMAP·Graph listeners — `routes/webhooks.ts`
  exposes plain HTTP endpoints shaped like their payloads; point the real
  webhook configs at them once approved.
- OCR for PDF/image attachments (PRD 6.1).
- A job queue — inbound processing currently runs inline on the webhook
  request; fine for pilot volume, not for scale.
- The WebSocket pub/sub hub (`lib/hub.ts`) is in-memory and single-process —
  fine for one API instance, not for horizontal scaling (would need Redis
  pub/sub or similar behind it).
- No auth on `/ws/staff` or the staff console — anyone who can reach the API
  can take over a conversation. Fine for local/pilot use, not for production.
- The marketing page's "Get in touch" button is a placeholder `mailto:hello@rfqly.com` —
  the domain isn't registered yet; swap it for a real address (or a lead-capture
  form) once it is.
- The brand is now **Rfqly** (`components/Logo.tsx` - a hub-and-spoke mark
  echoing the architecture diagram). Update this if the name changes before
  the domain is purchased.
# RFQ-automation-agent
# RFQ-automation-agent
