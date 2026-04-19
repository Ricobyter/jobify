# Jobify — AI-Powered Job Board

A full-stack job board application where **job seekers** find and apply for roles using AI-powered search and mock interviews, and **employers** post and manage job listings with tiered pricing.

---

## What This App Does

```
┌─────────────────────────────────────────────────────────────────┐
│                         WDS Jobs                                │
│                                                                 │
│   ┌─────────────────────┐     ┌─────────────────────────────┐  │
│   │     Job Seeker       │     │          Employer            │  │
│   ├─────────────────────┤     ├─────────────────────────────┤  │
│   │ • Browse job board  │     │ • Create job listings        │  │
│   │ • AI-powered search │     │ • Manage applications        │  │
│   │ • Upload resume     │     │ • Feature listings (paid)    │  │
│   │ • Mock interviews   │     │ • Organization settings      │  │
│   │ • Apply to jobs     │     │ • Pricing & plan management  │  │
│   └─────────────────────┘     └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

#### For Job Seekers
- **Job Board** — Browse published listings filtered by location, type, experience level
- **AI Job Search** — Describe your skills and goals in plain text; Gemini matches you to relevant listings
- **Resume Upload** — Upload a PDF resume; Claude AI generates a structured summary automatically
- **Mock Interview** — AI interviewer (Claude) conducts adaptive interviews based on your resume and target role, then gives a scored evaluation with improvement steps

#### For Employers
- **Job Listings** — Create, edit, publish and archive job postings (with Markdown descriptions)
- **Applications** — View all applicants per listing with AI-summarized resumes
- **Featured Listings** — Pay to feature listings at the top of the board
- **Organization Management** — Powered by Clerk Organizations; invite team members with role-based permissions

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Next.js 15 App Router                       │
│                                                                      │
│  /(job-seeker)              /employer            /api                │
│  ├── /                      ├── /job-listings    ├── /uploadthing    │
│  ├── /ai-search             ├── /pricing         └── /inngest        │
│  ├── /mock-interview        └── /user-settings                       │
│  └── /user-settings                                                  │
└──────────────┬───────────────────────────────────────────────────────┘
               │
       ┌───────▼────────┐
       │  Server Actions │  (all data mutations go through here)
       └───────┬─────────┘
               │
   ┌───────────┼───────────────────────────────┐
   │           │                               │
   ▼           ▼                               ▼
┌──────┐  ┌──────────┐                  ┌───────────┐
│  DB  │  │ Inngest  │                  │  AI APIs  │
│      │  │ Workflows│                  │           │
│Drizzle  │          │                  │ • Claude  │
│  +   │  │• Resume  │                  │ • Gemini  │
│Postgres │  summarise│                 └───────────┘
└──────┘  └──────────┘
```

### AI Flows

```
Resume Upload Flow
──────────────────
User uploads PDF
      │
      ▼
UploadThing (stores file)
      │
      ▼
Inngest event: app/resume.uploaded
      │
      ▼
Claude claude-sonnet-4-6 (reads PDF, extracts skills & experience)
      │
      ▼
AI summary saved to DB → shown on resume settings page


AI Job Search Flow
──────────────────
User describes skills/goals in text box
      │
      ▼
Gemini gemini-2.0-flash (matches query against all published listings)
      │
      ▼
Returns ranked list of matching job IDs → redirects to filtered board


Mock Interview Flow
───────────────────
User enters job role + mode (text / voice)
      │
      ▼
Claude claude-sonnet-4-6 (system prompt: resume + role + rules)
      │
      ├── is_complete = false → asks ONE adaptive question
      │       ↑
      │   User answers (repeat until "End Interview")
      │
      └── is_complete = true  → returns JSON evaluation
                {rating, strengths, weaknesses,
                 communication, improvement_plan,
                 hire_recommendation}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Auth | Clerk (users + organizations) |
| Database | PostgreSQL 17 + Drizzle ORM |
| File Uploads | UploadThing |
| Background Jobs | Inngest |
| AI — Resume & Interviews | Anthropic Claude (`claude-sonnet-4-6`) |
| AI — Job Matching | Google Gemini (`gemini-2.0-flash`) |
| Email | Resend + React Email |
| Forms | react-hook-form + Zod |

---

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the Postgres database)
- Accounts & API keys for:
  - [Clerk](https://clerk.com) — authentication
  - [UploadThing](https://uploadthing.com) — file uploads
  - [Anthropic](https://console.anthropic.com) — Claude AI
  - [Google AI Studio](https://aistudio.google.com) — Gemini
  - [Resend](https://resend.com) — email
  - [Inngest](https://inngest.com) — background job orchestration (free dev account)

---

## Installation

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd job-board-ai
npm install
```

### 2. Configure environment variables

Copy the example below into a `.env` file at the project root and fill in your values:

```env
# Database (used by Docker)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=job_board_ai

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/job-listings
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/job-listings

# UploadThing (base64 token from dashboard, starts with "ey")
UPLOADTHING_TOKEN=eyJ...

# AI
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

# Email
RESEND_API_KEY=re_...

# App
SERVER_URL=http://localhost:3000
```

### 3. Start the database

```bash
docker compose up -d
```

### 4. Push the database schema

```bash
npm run db:push
```

---

## Running the App

You need **three terminals** running simultaneously:

```
Terminal 1 — Next.js dev server
─────────────────────────────────
npm run dev


Terminal 2 — Inngest dev server (background jobs / AI workflows)
─────────────────────────────────────────────────────────────────
npm run inngest


Terminal 3 — (optional) Email preview
───────────────────────────────────────
npm run email
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Using the App

### As a Job Seeker

```
1. Sign up / Sign in
        │
        ▼
2. Upload your resume
   → Settings → Resume → drag & drop PDF
   → Wait ~30s for Claude to generate your AI summary
        │
        ▼
3. Browse the job board  (/)
   → Filter by location, type, experience level
   → Click a listing to see details and apply
        │
        ├──▶  AI Search  (/ai-search)
        │     Describe what you're looking for in plain English
        │     → Gemini matches you to relevant listings
        │
        └──▶  Mock Interview  (/mock-interview)
              Enter a job role (e.g. "Senior React Developer")
              Choose text or voice mode
              Answer the AI's questions one by one
              Click "End Interview" after 3+ questions
              → Receive a scored evaluation with improvement steps
```

### As an Employer

```
1. Sign in → Create or select an Organization (Clerk)
        │
        ▼
2. Go to Employer Dashboard  (/employer)
        │
        ▼
3. Create a job listing  (/employer/job-listings/new)
   → Fill in title, description (Markdown), location, salary, type
   → Save as draft
        │
        ▼
4. Publish the listing
   → Toggle status from Draft → Published
   → Listing appears on the public job board
        │
        ▼
5. Manage applications
   → View all applicants on the listing detail page
   → Each applicant shows their AI-summarised resume
        │
        ▼
6. Feature a listing  (/employer/pricing)
   → Pay to pin your listing at the top of the board
```

---

## Database Management

```bash
# Push schema changes to the database
npm run db:push

# Generate SQL migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (visual DB browser)
npm run db:studio

# Stop the database
docker compose down

# Stop and wipe all data
docker compose down -v
```

---

## Project Structure

```
src/
├── app/
│   ├── (job-seeker)/          # Job seeker routes + layout
│   │   ├── page.tsx           # Job board home
│   │   ├── ai-search/         # Gemini-powered search
│   │   ├── mock-interview/    # AI mock interview
│   │   └── user-settings/     # Resume & notification settings
│   ├── employer/              # Employer dashboard routes
│   └── api/
│       ├── uploadthing/       # File upload handler
│       └── inngest/           # Background job webhook
│
├── features/                  # Domain logic (actions, components, db)
│   ├── jobListings/
│   ├── jobListingApplications/
│   ├── mockInterview/         # Mock interview feature
│   ├── organizations/
│   └── users/
│
├── services/
│   ├── clerk/                 # Auth helpers
│   ├── inngest/               # Background workflows + AI agents
│   ├── resend/                # Email templates
│   └── uploadthing/           # File upload config & router
│
└── drizzle/
    ├── schema/                # Table definitions
    └── migrations/
```
# jobify
