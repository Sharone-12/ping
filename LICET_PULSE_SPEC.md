# LICET PULSE — Complete Project Specification

## Overview

LICET Pulse is an AI-powered campus intelligence platform that solves the problem of students missing important campus events buried in cluttered email inboxes. Instead of scrolling through hundreds of emails, students get a single intelligent feed with AI-powered search, personalized recommendations, and smart deadline alerts.

**Problem:** Campus events at LICET are communicated through bulk emails. Students receive dozens daily. Important event announcements get buried under academic notifications, circulars, and spam. There is also no centralized platform to showcase student projects and innovations.

**Solution:** A web app that parses college emails, extracts event data using LLM, and presents it in a clean, searchable, personalized feed with AI search capabilities.

---

## Core Principles

- **Email-first data ingestion** — events come from college emails, we parse them automatically
- **Open source AI** — Llama 8B via Groq API (free, fast inference) for all LLM tasks
- **Demo-driven development** — every feature should be demoable in under 30 seconds
- **Solo-buildable in 70 hours** — no feature that takes more than 6 hours to implement

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│              Next.js 14 (App Router)                    │
│         Tailwind CSS + Framer Motion                    │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Event   │ │    AI    │ │ Project  │ │  Profile   │  │
│  │  Feed    │ │  Search  │ │ Showcase │ │ Settings   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ API Routes (Next.js)
                     │
┌────────────────────▼────────────────────────────────────┐
│                    BACKEND LAYER                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Email Parser │  │  AI Search   │  │  Event CRUD  │  │
│  │ (Gmail API + │  │  (Groq +     │  │  (Supabase   │  │
│  │  Llama 8B)   │  │  Llama 8B)   │  │   queries)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Auth         │  │ Notifications│                    │
│  │ (Supabase    │  │ (Web Push /  │                    │
│  │  Google OAuth│  │  Telegram)   │                    │
│  └──────────────┘  └──────────────┘                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    DATA LAYER                            │
│                                                         │
│              Supabase (PostgreSQL)                       │
│                                                         │
│  Tables: users, events, projects, interests,            │
│          saved_events, event_registrations               │
│                                                         │
│  Auth: Google OAuth via Supabase Auth                    │
│  Storage: Supabase Storage (project images/posters)     │
│  Realtime: Supabase Realtime (live feed updates)        │
└─────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  EXTERNAL SERVICES                       │
│                                                         │
│  Groq API ──── Llama 8B inference (free tier)           │
│  Gmail API ─── Read student's college emails            │
│  Vercel ────── Hosting + serverless functions            │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer          | Technology                        | Why                                                    |
|----------------|-----------------------------------|--------------------------------------------------------|
| Frontend       | Next.js 14 (App Router)           | SSR, file-based routing, API routes built in           |
| Styling        | Tailwind CSS                      | Rapid UI development, consistent design                |
| Animations     | Framer Motion                     | Smooth page transitions, micro-interactions            |
| Database       | Supabase (PostgreSQL)             | Free tier, real-time, built-in auth, instant setup     |
| Auth           | Supabase Auth (Google OAuth)      | One-click login, also gives Gmail API access           |
| LLM            | Llama 8B via Groq API             | Free tier, ~500 tok/s, open source credibility         |
| Email Parsing  | Gmail API                         | Direct access to student's college inbox               |
| Deployment     | Vercel                            | Zero-config Next.js deploy, free tier, preview URLs    |
| Storage        | Supabase Storage                  | Project images, event posters                          |

---

## Database Schema

### users
```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  department text,           -- 'CSE', 'ECE', 'MECH', 'AI&DS', etc.
  year int,                  -- 1, 2, 3, 4
  interests text[],          -- ['hackathons', 'workshops', 'ml', 'web-dev', 'robotics']
  gmail_connected boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### events
```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text,            -- 'hackathon', 'workshop', 'seminar', 'fest', 'competition', 'guest-lecture'
  department text,            -- which department is hosting
  date_start timestamptz,
  date_end timestamptz,
  registration_deadline timestamptz,
  venue text,
  registration_link text,
  poster_url text,
  tags text[],                -- auto-generated by LLM: ['ai', 'python', 'beginner-friendly']
  source_email_id text,       -- gmail message ID it was parsed from
  is_active boolean default true,
  created_at timestamptz default now()
);
```

### projects
```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text not null,
  description text,           -- user writes this
  ai_summary text,            -- LLM-generated short summary
  tech_stack text[],          -- ['python', 'react', 'tensorflow']
  tags text[],                -- auto-generated by LLM
  looking_for text[],         -- ['frontend-dev', 'ml-engineer', 'designer']
  github_url text,
  demo_url text,
  image_url text,
  status text default 'active', -- 'active', 'completed', 'looking-for-team'
  created_at timestamptz default now()
);
```

### saved_events
```sql
create table saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  event_id uuid references events(id),
  reminded boolean default false,
  created_at timestamptz default now(),
  unique(user_id, event_id)
);
```

### event_clicks
```sql
create table event_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  event_id uuid references events(id),
  clicked_at timestamptz default now()
);
```

---

## Features (Priority Order)

### P0 — Must Have (wins the hackathon)

#### 1. Google OAuth Login
- One-click sign in with Google
- On first login: onboarding screen to pick department, year, interests
- Google OAuth scope includes Gmail read access so we can parse their emails

#### 2. Email Parsing Pipeline
- After login, app fetches emails from known LICET sender addresses
- Sends email body to Groq (Llama 8B) with a structured extraction prompt
- LLM returns JSON: { title, description, event_type, date_start, date_end, registration_deadline, venue, registration_link, tags }
- Parsed events are deduplicated (by title + date) and stored in Supabase
- Runs on first login and can be manually triggered with a "sync emails" button

**LLM Prompt for Email Parsing:**
```
You are an event extraction assistant. Given a college email, extract event details as JSON.

If the email is NOT about an event (academic circular, admin notice, etc), return: {"is_event": false}

If it IS about an event, return:
{
  "is_event": true,
  "title": "event name",
  "description": "2-3 sentence summary",
  "event_type": "hackathon|workshop|seminar|fest|competition|guest-lecture|other",
  "date_start": "ISO 8601 or null",
  "date_end": "ISO 8601 or null",
  "registration_deadline": "ISO 8601 or null",
  "venue": "location or null",
  "registration_link": "URL or null",
  "tags": ["relevant", "topic", "tags"]
}

Respond ONLY with valid JSON, no markdown, no explanation.
```

#### 3. Event Feed
- Main page after login
- Shows all parsed events as cards, sorted by date (upcoming first)
- Each card shows: title, date, venue, event type badge, tags, deadline countdown
- Filter tabs: All | Hackathons | Workshops | Seminars | Fests | Competitions
- Filter by department dropdown
- "Happening This Week" section at top

#### 4. AI Search
- Search bar at the top of the feed
- User types natural language: "any ML workshops this month?" or "hackathons with cash prizes"
- Backend sends the query + all active events (as context) to Groq Llama 8B
- LLM returns relevant event IDs + a natural language answer
- Results displayed as event cards with the AI answer above them

**LLM Prompt for AI Search:**
```
You are a campus event search assistant. Given a student's question and a list of campus events, find the most relevant events.

EVENTS:
{events_json}

STUDENT QUESTION: {query}

Return JSON:
{
  "answer": "Natural language answer to the student's question",
  "relevant_event_ids": ["id1", "id2", ...],
  "no_results": false
}

If no events match, set no_results to true and suggest what to look for.
Respond ONLY with valid JSON.
```

#### 5. Save Event + Deadline Alerts
- Bookmark button on each event card
- Saved events appear in "My Events" section in profile
- If an event has a registration_deadline, show a countdown badge
- Optional: browser notification 24 hours before deadline (Web Push API)

### P1 — Should Have (makes it feel complete)

#### 6. Project Showcase
- "/projects" page — grid of student project cards
- Each card: title, AI summary, tech stack badges, tags, "looking for" badges
- Submit project form: title, description, tech stack, github url, demo url, image upload
- On submit: LLM auto-generates summary + tags from the description
- Search/filter by tech stack, tags, "looking for contributors"

#### 7. Project Matchmaking
- On a project card: "I want to contribute" button
- On profile: "Find projects for me" — matches based on user's interests and skills
- Simple matching: overlap between user.interests and project.tags/tech_stack

#### 8. For You Feed (Personalization)
- Instead of showing all events, rank them by relevance to the user
- Simple scoring: +3 if event department matches user department, +2 if event tags overlap with user interests, +1 if event type matches past clicks
- Display "For You" as default tab, "All Events" as secondary

### P2 — Nice to Have (flex features)

#### 9. Faculty/Admin Dashboard
- Separate role: admin
- See which events got most saves/clicks
- Department-wise engagement stats
- "Post Event" form (manual event creation without email parsing)

#### 10. Telegram Bot
- Students link their Telegram
- Bot sends daily digest: "3 events happening this week that match your interests"
- Can ask questions: "any hackathons?" and bot responds using same AI search

#### 11. Calendar Sync
- "Add to Google Calendar" button on each event card
- Generates .ics file or uses Google Calendar API

---

## UI Flow

### Screen 1: Landing Page (unauthenticated)
```
┌─────────────────────────────────────────────┐
│  LICET PULSE                    [Sign In]   │
│                                              │
│     Never miss a campus event again.         │
│     AI-powered event discovery for LICET.    │
│                                              │
│         [Sign in with Google]                │
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 📧→🤖  │ │ 🔍 AI   │ │ 🚀     │       │
│  │ Email   │ │ Search  │ │ Project │       │
│  │ Parsing │ │         │ │Showcase │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│  "Emails     "Ask in     "Show off          │
│   become      plain       your work"        │
│   events"     English"                      │
└─────────────────────────────────────────────┘
```

### Screen 2: Onboarding (first login only)
```
┌─────────────────────────────────────────────┐
│  Welcome to LICET Pulse, [Name]!            │
│                                              │
│  What's your department?                     │
│  [CSE] [ECE] [MECH] [AI&DS] [EEE] [CIVIL] │
│                                              │
│  What year are you in?                       │
│  [1] [2] [3] [4]                            │
│                                              │
│  What are you interested in? (pick many)     │
│  [Hackathons] [AI/ML] [Web Dev] [Robotics]  │
│  [IoT] [Cybersecurity] [Blockchain] [Cloud] │
│  [Mobile Dev] [Data Science] [Design]        │
│                                              │
│           [Get Started →]                    │
└─────────────────────────────────────────────┘
```

### Screen 3: Main Feed (home page)
```
┌─────────────────────────────────────────────┐
│  LICET PULSE          🔔  👤               │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ 🔍 Ask anything... "hackathons      │    │
│  │    this month?"                      │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  [For You] [All] [Hackathons] [Workshops]   │
│  [Seminars] [Fests]    Department: [All ▾]  │
│                                              │
│  📅 HAPPENING THIS WEEK                     │
│  ┌─────────────────────────────────────┐    │
│  │ 🏆 Inter-College Hackathon 2026     │    │
│  │ Sep 10-11 • Main Auditorium         │    │
│  │ [hackathon] [coding] [prizes]       │    │
│  │ ⏰ Registration closes in 3 days    │    │
│  │                        [Save] [→]   │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ 🎓 ML Workshop by Google DSC        │    │
│  │ Sep 12 • CS Lab 3                   │    │
│  │ [workshop] [ml] [beginner]          │    │
│  │ ⏰ 5 days left to register          │    │
│  │                        [Save] [→]   │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  📋 UPCOMING                                │
│  ... more event cards ...                    │
│                                              │
│  ──────────────────────────────────────      │
│  [🏠 Feed]  [🔍 Search]  [🚀 Projects]  [👤]│
└─────────────────────────────────────────────┘
```

### Screen 4: AI Search Results
```
┌─────────────────────────────────────────────┐
│  ← Back                                     │
│                                              │
│  🔍 "hackathons with cash prizes"           │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ 🤖 I found 2 hackathons with cash   │    │
│  │    prizes coming up. The Inter-      │    │
│  │    College Hackathon has ₹50K prize  │    │
│  │    pool, and HackLICET has ₹25K.    │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ 🏆 Inter-College Hackathon 2026     │    │
│  │ ...                                  │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ 💻 HackLICET 2026                   │    │
│  │ ...                                  │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Screen 5: Event Detail Page
```
┌─────────────────────────────────────────────┐
│  ← Back                          [Save 🔖] │
│                                              │
│  🏆 Inter-College Hackathon 2026            │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ 📅 Sep 10-11, 2026                  │    │
│  │ 📍 Main Auditorium                  │    │
│  │ 🏷️ CSE Department                   │    │
│  │ ⏰ Register by Sep 8                │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  24-hour hackathon open to all departments. │
│  Teams of 2-4. Problem statements will be   │
│  released on the day. Cash prizes for top   │
│  3 teams. Bring your own laptop.            │
│                                              │
│  [hackathon] [coding] [prizes] [all-depts]  │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  [Register Now →]                    │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  [Add to Google Calendar 📅]         │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Screen 6: Projects Showcase
```
┌─────────────────────────────────────────────┐
│  🚀 Project Showcase       [+ Add Project]  │
│                                              │
│  🔍 Search projects...                      │
│  [All] [Looking for Team] [AI/ML] [Web]     │
│                                              │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ 📸 image     │  │ 📸 image     │         │
│  │              │  │              │         │
│  │ FailSafe AI  │  │ IPL Draft    │         │
│  │ Multi-agent  │  │ Simulator    │         │
│  │ security...  │  │ Role-based...│         │
│  │              │  │              │         │
│  │ [Python]     │  │ [Next.js]    │         │
│  │ [LangGraph]  │  │ [FastAPI]    │         │
│  │              │  │              │         │
│  │ 👥 Looking   │  │ ✅ Complete  │         │
│  │ for: Frontend│  │              │         │
│  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────┘
```

### Screen 7: Profile & Settings
```
┌─────────────────────────────────────────────┐
│  👤 Profile                                  │
│                                              │
│  [Avatar] Sharone                            │
│  AI & Data Science • Year 2                  │
│  sharone@licet.ac.in                         │
│                                              │
│  Interests: [Hackathons] [AI/ML] [Web Dev]  │
│                                [Edit →]      │
│                                              │
│  ── My Saved Events (3) ──                  │
│  • Inter-College Hackathon (in 5 days)      │
│  • ML Workshop (in 8 days)                  │
│  • Tech Fest 2026 (in 2 weeks)              │
│                                              │
│  ── My Projects (2) ──                      │
│  • FailSafe AI                               │
│  • IPL Draft Simulator                       │
│                                              │
│  [🔄 Sync Emails Now]                       │
│  [⚙️ Notification Settings]                 │
│  [🚪 Sign Out]                              │
└─────────────────────────────────────────────┘
```

---

## API Routes

```
POST   /api/auth/callback        — Google OAuth callback
POST   /api/emails/sync          — Trigger email parsing for logged-in user
GET    /api/events               — List events (with filters: type, department, date range)
GET    /api/events/[id]          — Single event detail
POST   /api/events/search        — AI search (sends query to Groq)
POST   /api/events/[id]/save     — Save/unsave an event
DELETE /api/events/[id]/save     — Unsave
GET    /api/events/saved         — Get user's saved events
GET    /api/projects             — List projects (with filters)
POST   /api/projects             — Create project (triggers LLM for summary/tags)
GET    /api/projects/[id]        — Single project detail
POST   /api/projects/match       — Find projects matching user's skills
PUT    /api/users/profile        — Update user profile (department, year, interests)
GET    /api/users/profile        — Get current user profile
```

---

## Email Sync Flow (detailed)

```
1. User clicks "Sync Emails" (or auto-runs on first login)
         │
2. Backend calls Gmail API:
   - Filter: from known LICET senders (admin@licet.ac.in, hod-cse@licet.ac.in, etc.)
   - OR filter: subject contains keywords like "workshop", "hackathon", "registration", "event"
   - Fetch last 30 days of matching emails
         │
3. For each email:
   - Extract subject + body text (strip HTML)
   - Send to Groq API (Llama 8B) with extraction prompt
   - LLM returns structured JSON
         │
4. If is_event == true:
   - Check if event already exists (dedup by title similarity + date)
   - If new: insert into events table
   - If exists: update if any fields changed
         │
5. Return count of new events found to frontend
   - Frontend shows toast: "Found 5 new events!"
   - Feed refreshes automatically
```

---

## AI Search Flow (detailed)

```
1. User types query in search bar
   e.g. "any hackathons with prizes this month?"
         │
2. Frontend sends POST /api/events/search { query: "..." }
         │
3. Backend:
   - Fetch all active events from Supabase
   - Format events as compact JSON array
   - Send to Groq API with search prompt + events context + user query
         │
4. LLM returns:
   {
     "answer": "I found 2 hackathons with prizes...",
     "relevant_event_ids": ["uuid1", "uuid2"]
   }
         │
5. Backend fetches full event objects for those IDs
   Returns { answer, events } to frontend
         │
6. Frontend displays:
   - AI answer in a highlighted card at the top
   - Matched event cards below
```

---

## Personalization Logic (For You feed)

Simple scoring algorithm, no ML needed:

```
for each event:
  score = 0

  // Department match
  if event.department == user.department:
    score += 5
  if event.department == "ALL" or event.department is null:
    score += 3

  // Interest overlap
  overlap = intersection(event.tags, user.interests)
  score += len(overlap) * 3

  // Recency bias (upcoming events score higher)
  days_until = (event.date_start - now).days
  if days_until <= 7: score += 4
  elif days_until <= 14: score += 2
  elif days_until <= 30: score += 1

  // Deadline urgency
  if event.registration_deadline:
    days_left = (event.registration_deadline - now).days
    if days_left <= 3: score += 5
    elif days_left <= 7: score += 3

  // Past engagement (click history)
  similar_clicks = count events user clicked with overlapping tags
  score += min(similar_clicks, 3)

sort events by score descending
```

---

## Folder Structure

```
licet-pulse/
├── app/
│   ├── layout.tsx                 # Root layout with nav
│   ├── page.tsx                   # Landing page (unauthenticated)
│   ├── onboarding/
│   │   └── page.tsx               # First-login onboarding
│   ├── feed/
│   │   └── page.tsx               # Main event feed
│   ├── events/
│   │   └── [id]/
│   │       └── page.tsx           # Event detail
│   ├── search/
│   │   └── page.tsx               # AI search results
│   ├── projects/
│   │   ├── page.tsx               # Project showcase grid
│   │   ├── new/
│   │   │   └── page.tsx           # Submit project form
│   │   └── [id]/
│   │       └── page.tsx           # Project detail
│   ├── profile/
│   │   └── page.tsx               # User profile + saved events
│   └── api/
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts
│       ├── emails/
│       │   └── sync/
│       │       └── route.ts
│       ├── events/
│       │   ├── route.ts           # GET list, POST create
│       │   ├── search/
│       │   │   └── route.ts       # POST AI search
│       │   ├── saved/
│       │   │   └── route.ts       # GET saved events
│       │   └── [id]/
│       │       ├── route.ts       # GET single event
│       │       └── save/
│       │           └── route.ts   # POST save, DELETE unsave
│       ├── projects/
│       │   ├── route.ts           # GET list, POST create
│       │   ├── match/
│       │   │   └── route.ts       # POST matchmaking
│       │   └── [id]/
│       │       └── route.ts       # GET single project
│       └── users/
│           └── profile/
│               └── route.ts       # GET, PUT profile
├── components/
│   ├── ui/                        # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterTabs.tsx
│   │   └── Toast.tsx
│   ├── EventCard.tsx              # Event card component
│   ├── ProjectCard.tsx            # Project card component
│   ├── AIAnswerCard.tsx           # AI response display
│   ├── Navbar.tsx                 # Top navigation
│   ├── BottomNav.tsx              # Mobile bottom navigation
│   └── OnboardingForm.tsx         # Onboarding wizard
├── lib/
│   ├── supabase.ts                # Supabase client setup
│   ├── groq.ts                    # Groq API client
│   ├── gmail.ts                   # Gmail API helpers
│   ├── email-parser.ts            # Email → Event extraction logic
│   ├── ai-search.ts               # AI search logic
│   ├── scoring.ts                 # Personalization scoring
│   └── utils.ts                   # Shared utilities
├── types/
│   └── index.ts                   # TypeScript types for Event, Project, User
├── .env.local                     # Environment variables
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Groq
GROQ_API_KEY=

# Google OAuth (for Gmail access)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Build Priority (70 hours)

### Phase 1: Foundation (0-8 hrs)
- [ ] Next.js project setup with Tailwind + Framer Motion
- [ ] Supabase project + schema creation (run SQL above)
- [ ] Google OAuth login via Supabase
- [ ] Basic layout with navbar + bottom nav

### Phase 2: Core Feed (8-20 hrs)
- [ ] Seed database with 15-20 realistic LICET events (manual or mock)
- [ ] Event feed page with cards
- [ ] Filter tabs (All, Hackathons, Workshops, etc.)
- [ ] Event detail page
- [ ] Save/unsave events

### Phase 3: AI Features (20-35 hrs)
- [ ] Groq API integration
- [ ] AI search endpoint + UI
- [ ] Email parsing pipeline (Gmail API + Llama 8B extraction)
- [ ] "Sync Emails" button + flow
- [ ] Auto-categorization on new events

### Phase 4: Personalization + Projects (35-50 hrs)
- [ ] Onboarding screen (pick department, year, interests)
- [ ] "For You" personalized feed scoring
- [ ] Project showcase page
- [ ] Submit project form + LLM auto-summary
- [ ] Project matchmaking

### Phase 5: Polish (50-65 hrs)
- [ ] Framer Motion animations (page transitions, card enter animations)
- [ ] Dark mode (default) + light mode toggle
- [ ] Mobile responsive (judges WILL check on phone)
- [ ] Loading skeletons, empty states, error handling
- [ ] Landing page that looks like a real product

### Phase 6: Demo Prep (65-70 hrs)
- [ ] Deploy on Vercel
- [ ] Seed demo account with perfect data
- [ ] Test the full flow end to end
- [ ] Rehearse demo 3-5 times
- [ ] Prepare backup screenshots in case WiFi dies

---

## Demo Script (5 minutes)

1. **Open landing page** — "This is LICET Pulse. No more buried emails." (15 sec)
2. **Sign in with Google** — "One click, connected to your college email." (10 sec)
3. **Show onboarding** — Pick AI&DS, Year 2, interests. (15 sec)
4. **Hit Sync Emails** — "Watch this. It's reading my college emails and extracting every event automatically." Show toast: "Found 12 events!" (30 sec)
5. **Browse feed** — "Here's everything happening at LICET. Filtered, categorized, deadline alerts." Switch between tabs. (30 sec)
6. **AI Search demo** — Type: "any hackathons with prizes this month?" — Show AI answer + results. (45 sec)
7. **Show event detail** — Click an event, show registration link, "Add to Calendar" button. (15 sec)
8. **Show For You tab** — "This is personalized to MY interests. An ECE student sees completely different events." (20 sec)
9. **Project Showcase** — "Students can also showcase projects. AI auto-tags them. If I need a frontend dev for my project, the matchmaking finds me one." (30 sec)
10. **Close** — "LICET Pulse. One platform. Zero missed opportunities. Scalable to any college." (10 sec)

---

## Seed Data (for demo)

Create 15-20 events that feel real. Examples:

1. Inter-College Hackathon 2026 — Sep 15-16, Main Auditorium, CSE dept, ₹50K prizes, teams of 2-4
2. Google DSC ML Workshop — Sep 20, CS Lab 3, AI&DS dept, beginner-friendly, free
3. IEEE Guest Lecture on Quantum Computing — Sep 22, Seminar Hall, ECE dept
4. LICET Tech Fest "Innovate 2026" — Oct 5-7, Full campus, All depts
5. Cybersecurity CTF Challenge — Sep 25, Online, CSE dept, individual, ₹10K prizes
6. Robotics Workshop by IIT-M Students — Sep 28, Mech Lab, MECH dept, ₹200 fee
7. Cloud Computing Bootcamp (AWS) — Oct 1-3, CS Lab 1, CSE dept, certificates
8. IEEE Paper Presentation Contest — Oct 10, Seminar Hall, All depts, ₹15K prizes
9. UI/UX Design Sprint — Sep 30, Design Lab, CSE dept, beginners welcome
10. Startup Pitch Competition — Oct 12, Auditorium, All depts, ₹1L prize pool
11. Python for Data Science (3-day workshop) — Oct 15-17, CS Lab 2, AI&DS dept
12. National Level Coding Contest — Oct 20, Online, CSE dept, ₹25K prizes
13. Embedded Systems Workshop — Oct 8, ECE Lab, ECE dept, hands-on Arduino
14. Environmental Engineering Seminar — Oct 5, Civil Block, CIVIL dept
15. Alumni Talk: Career in AI — Sep 29, Main Auditorium, AI&DS dept, free
```
