# How Jobify Works

A job board where **job seekers** browse/apply to jobs, get AI resume summaries, and practice
AI mock interviews; **employers** post listings, review applicants (with AI-assisted ranking),
and chat with candidates in real time.

> Note: `README.md` and `package.json` still reference Anthropic Claude and Gemini as the
> primary AI providers. The code has since been migrated to **Groq** (`openai/gpt-oss-120b`)
> as the primary model for every AI feature — Groq deprecated the Llama 3.1/3.3 models this
> previously used. Gemini is kept only as a fallback path for resume summarization. The
> `@anthropic-ai/sdk` dependency is no longer called anywhere in `src/`.

---

## 1. Tech stack (as actually used in code)

| Layer | Technology | Where |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript | `src/app/` |
| Server | Custom Node HTTP server (Next.js + Socket.io on one process) | [server.js](server.js) |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix primitives) | `src/components/ui/` |
| Auth | Clerk (users + organizations), route protection via middleware | [src/middleware.ts](src/middleware.ts), `src/services/clerk/` |
| Database | PostgreSQL + Drizzle ORM | `src/drizzle/schema/`, [src/drizzle/db.ts](src/drizzle/db.ts) |
| Realtime chat | Socket.io (custom server, not a managed service) | [server.js](server.js), `src/features/chat/` |
| File uploads | UploadThing (resume PDFs) | `src/services/uploadthing/` |
| Background jobs / AI orchestration | Inngest | `src/services/inngest/` |
| AI — resume summary, mock interview | **Groq** (`openai/gpt-oss-120b`), Gemini as fallback | [src/features/mockInterview/actions/mockInterviewActions.ts](src/features/mockInterview/actions/mockInterviewActions.ts), [src/services/inngest/functions/resume.ts](src/services/inngest/functions/resume.ts) |
| AI — job matching & applicant ranking | Groq via `@inngest/agent-kit` (OpenAI-compatible client pointed at Groq's endpoint) | `src/services/inngest/ai/` |
| Email | Resend + React Email | `src/services/resend/` |
| Forms/validation | react-hook-form + Zod | throughout `features/*/actions` |

---

## 2. Request flow / architecture

```
Browser
  │
  ▼
server.js  (single Node process)
  ├── Next.js request handler   → App Router pages, Server Components, Server Actions
  └── Socket.io  (path: /api/socketio) → chat only
        │
        ▼
Server Actions ("use server" files in features/*/actions)
  │  — the only place that mutates data
  ▼
Drizzle ORM  →  PostgreSQL
  │
  ├── Inngest events (e.g. "app/resume.uploaded") → background AI jobs
  └── Clerk webhooks (user/org sync) → src/app/api/webhooks
```

`npm run dev` runs `node server.js` (not plain `next dev`) because the custom server is what
wires up Socket.io alongside Next.js. This is why Turbopack dev mode isn't used.

### Auth & route protection
- [src/middleware.ts](src/middleware.ts) uses Clerk's `clerkMiddleware` + `createRouteMatcher`.
  Public routes: `/`, `/sign-in*`, `/api*`, `/job-listings*`, `/ai-search`. Everything else
  requires `auth.protect()`.
- [getCurrentAuth.ts](src/services/clerk/lib/getCurrentAuth.ts) exposes `getCurrentUser()` /
  `getCurrentOrganization()`, cached with Next.js `"use cache"` + `cacheTag`.
- Clerk webhooks sync users/orgs into the local `users` / `organizations` tables (see
  `src/services/inngest/functions/clerk.ts` and `src/app/api/webhooks`).

---

## 3. Database schema (Drizzle, `src/drizzle/schema/`)

| Table | Purpose | Key relations |
|---|---|---|
| `user.ts` | Clerk-synced user record | referenced by resumes, applications, messages |
| `organization.ts` | Clerk-synced org (employer) record | owns job listings |
| `organizationUserSettings.ts` | Per-user notification prefs within an org | |
| `userNotificationSettings.ts` | Job-seeker notification prefs | |
| `userResume.ts` | Uploaded resume file URL + `aiSummary` (Groq/Gemini output) | |
| `jobListing.ts` | Core job posting: title, description (Markdown), wage, location, `status` (draft/published/delisted), `isFeatured`, enums for type/experience/location requirement | belongs to an organization; has many applications |
| `jobListingApplication.ts` | Composite PK `(jobListingId, userId)`; `stage` enum (denied → applied → interested → interviewed → hired), `rating` (AI-assigned 1–5), `coverLetter` | links listing + user + resume |
| `conversation.ts` | Chat thread, unique on `(jobListingId, applicantId)` | |
| `message.ts` | Chat message: `conversationId`, `senderId`, `content`, `createdAt` | |

---

## 4. Feature-by-feature walkthrough

### Job listings (employer side)
- Actions: [src/features/jobListings/actions/](src/features/jobListings/actions)
- Employer creates/edits a listing (Markdown description via `@mdxeditor/editor`), toggles
  `draft → published → delisted`, and can mark it `isFeatured` (paid, see Pricing below).
- Public job board reads only `published` listings; `src/features/jobListings/lib` has the
  filtering/query-building logic (location, type, experience level).

### Applications (job seeker → employer)
- Job seeker applies with an existing resume + optional cover letter →
  `jobListingApplication` row created with `stage = "applied"`.
- **Applicant ranking**: [applicantRankingAgent.ts](src/services/inngest/ai/applicantRankingAgent.ts)
  is an Inngest-Agent-Kit agent (Groq-backed) with one tool,
  `save-applicant-ranking`. It reads `{ userId, jobListingId, jobListing, coverLetter,
  resumeSummary, isProvisional }`, rates the fit 1–5, and calls the tool to persist
  `rating` directly on the application row — the agent never returns free text, only tool calls.
  Triggered from [src/services/inngest/functions/jobListingApplication.ts](src/services/inngest/functions/jobListingApplication.ts).
- Employer views applicants sorted/filterable by AI rating and stage, in
  `src/features/jobListingApplications/components`.

### Resume upload + AI summary
1. User uploads a PDF via UploadThing (`src/services/uploadthing/router.ts`).
2. An Inngest event `app/resume.uploaded` fires →
   [resume.ts](src/services/inngest/functions/resume.ts) handles it:
   - Downloads the file, tries `pdf-parse` to extract raw text.
   - If text extraction succeeds (>50 chars) and `GROQ_API_KEY` is set → summarizes with
     **Groq** `openai/gpt-oss-120b` (primary path).
   - If that fails or there's no extractable text → falls back to **Gemini**
     `gemini-2.0-flash`, sending the raw PDF bytes directly (handles scanned/image PDFs).
     Includes exponential-backoff retry and an optional secondary key (`GQOQ_API_KEY`).
   - On quota/auth errors from both paths, saves a placeholder string instead of failing hard.
   - Result written to `userResume.aiSummary`, shown on the resume settings page.

### AI job search (job seeker)
- Page: `src/app/(job-seeker)/ai-search/page.tsx`.
- User describes what they want in plain English → server action passes the prompt plus all
  published listings (schema-validated) to
  [getMatchingJobListings.ts](src/services/inngest/ai/getMatchingJobListings.ts).
- This spins up a one-off Agent-Kit agent (Groq-backed, no tools) whose system prompt embeds
  the full JSON listing catalog and instructs it to return a comma-separated list of matching
  `jobId`s (or a sentinel `NO_JOBS` string). The IDs are parsed and used to filter the board.

### Mock interview
- Client: [MockInterviewClient.tsx](src/features/mockInterview/components/MockInterviewClient.tsx)
  (chat UI, text or voice mode).
- Server action: [mockInterviewActions.ts](src/features/mockInterview/actions/mockInterviewActions.ts)
  - `getUserResumeText()` / `getUserResumeOptions()` pull the stored `aiSummary` (or a
    "still processing" placeholder) to ground the interview.
  - `sendInterviewMessage()` builds one large system prompt (`buildSystemPrompt`) that encodes
    two modes:
    - **Interview mode** (`isComplete = false`): ask exactly one adaptive question per turn,
      difficulty ramps easy → medium → hard, must reference specific resume details once the
      resume is ready.
    - **Evaluation mode** (`isComplete = true`, triggered by the user ending the interview):
      returns a strict JSON object — `summary`, `rating` (0–10), `strengths`, `weaknesses`,
      `communication`, `improvement_plan`, `hire_recommendation`.
  - Calls Groq's chat completions API directly (`groq-sdk`, same `openai/gpt-oss-120b`
    model) with the system prompt + full chat history.

### Real-time chat (employer ↔ applicant)
See project memory `project_chat_feature.md` for full detail; summarized here:
- [server.js](server.js) runs Socket.io alongside Next.js at path `/api/socketio`. Rooms are
  named `conversation:{conversationId}`.
- Flow: a message is first written to the DB via the `sendMessage` server action
  ([src/features/chat/actions/actions.ts](src/features/chat/actions/actions.ts)), *then* the
  client emits `broadcast-message` over the socket; the server simply relays it to the other
  room members as `new-message`. The socket never touches the database directly.
- `startEmployerChat` action creates the `conversation` row (or reuses the existing one for
  that `jobListingId` + `applicantId` pair) and redirects into the thread.
- UI: [ChatWindow.tsx](src/features/chat/components/ChatWindow.tsx) (message thread + socket
  connection), [ConversationList.tsx](src/features/chat/components/ConversationList.tsx)
  (sidebar). Routes: `src/app/employer/messages/`, `src/app/(job-seeker)/messages/`.

### Pricing / featured listings
- `src/app/employer/pricing/`, `src/services/clerk/lib/planFeatures.ts` — plan/feature gating
  is driven off Clerk billing/plan features (e.g. how many listings, whether featuring is
  allowed), checked via `orgUserPermissions.ts`.

---

## 5. Environment variables that actually gate behavior

From [src/data/env/server.ts](src/data/env/server.ts) — all required unless noted:

- `DB_HOST/PORT/USER/PASSWORD/NAME` → assembled into `DATABASE_URL` for Drizzle/Postgres.
- `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` → auth.
- `UPLOADTHING_TOKEN` → resume file uploads.
- `GROQ_API_KEY` → **required**; powers resume summary (primary), job matching, applicant
  ranking, and mock interviews.
- `GEMINI_API_KEY` → required by schema, used only as the resume-summary fallback path.
- `GQOQ_API_KEY` (optional) → secondary Gemini-compatible key tried if the primary Gemini
  fallback also fails.
- `ANTHROPIC_API_KEY` → required by schema but **not read anywhere in `src/`** currently;
  effectively dead config left over from a prior Claude-based implementation.
- `RESEND_API_KEY` → transactional email.
- `SERVER_URL` → used by Inngest dev script / base URL construction.

---

## 6. Where to look for what

| If you need to change... | Look at |
|---|---|
| Job listing CRUD / filtering | `src/features/jobListings/` |
| Application stages / applicant rating | `src/features/jobListingApplications/`, `src/services/inngest/ai/applicantRankingAgent.ts` |
| Resume upload/summary pipeline | `src/services/uploadthing/router.ts`, `src/services/inngest/functions/resume.ts` |
| Mock interview prompt/behavior | `src/features/mockInterview/actions/mockInterviewActions.ts` |
| AI search matching logic | `src/services/inngest/ai/getMatchingJobListings.ts` |
| Chat / realtime messaging | `server.js`, `src/features/chat/` |
| Auth/route protection | `src/middleware.ts`, `src/services/clerk/` |
| DB schema/migrations | `src/drizzle/schema/`, `src/drizzle/migrations/`, `drizzle.config.ts` |
| Env var validation | `src/data/env/server.ts`, `src/data/env/client.ts` |
