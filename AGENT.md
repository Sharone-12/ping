# LICET Pulse — Auto-Registration Agent Spec

## Overview

The agent is the killer feature of LICET Pulse. When a student says "register me for the hackathon," the agent:

1. Grabs the registration link from the parsed event
2. Opens the Google Form (or whatever form it is)
3. Reads every field in the form
4. Maps user profile data to form fields using an LLM
5. Shows the student a preview of what it's about to fill
6. On confirmation, submits the form
7. Marks the event as "registered" and adds XP

This is fully doable. Here's how.

---

## Feasibility Check

**Why this works:**
- 90%+ of college event registrations are Google Forms
- Google Forms have a predictable DOM structure — every field has a label and an input
- Puppeteer/Playwright can headlessly open, fill, and submit forms in seconds
- LLM maps ambiguous field labels ("Name of participant", "Your good name", "Student Name") to `user.full_name` without hardcoding
- No CAPTCHA on Google Forms (they use spam prevention differently)
- The whole flow takes < 10 seconds

**What could break:**
- Non-Google-Form links (Typeform, custom college portals) — handle by detecting form type, fallback to "open link manually"
- Forms requiring file uploads (resume, ID card) — flag as "can't auto-fill this field, please complete manually"
- Forms behind login walls — rare for college events, but handle gracefully
- Forms with payment — NEVER auto-submit. show warning and redirect user

---

## Architecture

```
User clicks "Register" on event card
         │
         ▼
┌─────────────────────────┐
│  Frontend: Bottom sheet  │
│  "Register for [event]?" │
│  Shows form preview      │
│  [Confirm] [Cancel]      │
└────────────┬────────────┘
             │ POST /api/agent/register
             ▼
┌─────────────────────────────────────┐
│  Backend: Agent Pipeline             │
│                                      │
│  Step 1: Fetch registration URL      │
│          from event record           │
│                                      │
│  Step 2: Puppeteer opens the form    │
│          in headless browser         │
│                                      │
│  Step 3: Extract all form fields     │
│          (label, type, options)      │
│                                      │
│  Step 4: Send fields + user profile  │
│          to LLM (Groq/Llama 8B)     │
│          → returns field mappings    │
│                                      │
│  Step 5: Return preview to frontend  │
│          user reviews filled values  │
│                                      │
│  Step 6: On confirm, Puppeteer fills │
│          and submits the form        │
│                                      │
│  Step 7: Update DB — mark registered │
│          Award XP to user            │
└─────────────────────────────────────┘
```

---

## Tech Stack for Agent

| Component      | Technology              | Why                                        |
|----------------|-------------------------|--------------------------------------------|
| Browser auto   | Playwright (headless)   | Better than Puppeteer for form interaction, works in serverless with some config |
| LLM            | Groq API (Llama 8B)    | Maps form fields to user data              |
| Runtime        | Next.js API route       | Runs server-side, not in browser           |
| Queue (opt)    | None for MVP            | Direct sync call, <10s response time       |

**Note on deployment:** Playwright headless works on Vercel with `@sparticuz/chromium` but it's finicky. For hackathon demo, run it locally or on a Railway/Render backend. Don't fight Vercel serverless limits during a hackathon.

**Alternative approach if Playwright is painful:** Use a simpler method — just pre-fill Google Form URLs. Google Forms support URL prefilling: `https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.123456=John&entry.789=CSE`. Extract entry IDs from the form HTML, map values, generate the pre-filled URL, and open it for the user. They just hit submit. Less magic but 100% reliable and way simpler to build.

---

## The Two Approaches

### Approach A: Full Auto-Submit (impressive demo)
Playwright fills and submits. User never touches the form.

### Approach B: Smart Pre-Fill (reliable, easier)
Agent reads the form, generates a pre-filled URL with all fields populated, opens it for the user. User just reviews and clicks Submit themselves.

**Recommendation:** Build Approach B first (2-3 hours). If you have time, upgrade to Approach A. The demo difference is small — "it filled out the form for you, just click submit" is still a massive wow moment. And it's way less likely to break during demo.

---

## Data Available from User Profile

When the agent needs to fill a form, it has access to:

```json
{
  "full_name": "Sharone",
  "email": "sharone@licet.ac.in",
  "department": "AI & Data Science",
  "year": 2,
  "phone": "optional — collected during onboarding",
  "roll_number": "optional — collected during onboarding",
  "interests": ["hackathons", "ai-ml", "web-dev"],
  "college": "LICET",
  "github_url": "optional",
  "team_name": "optional — can ask before submitting"
}
```

**Extra fields to collect during onboarding (add to spec):**
- Phone number
- Roll number / Register number
- Section

These are the fields that appear on literally every college Google Form. Collect them once, use forever.

---

## Form Field Extraction

### For Google Forms specifically:

Google Forms HTML has a predictable structure. Each question block contains:
- A label (the question text)
- Input type (text, radio, checkbox, dropdown, date, time, paragraph)
- Options (for radio/checkbox/dropdown)
- Whether it's required
- An `entry.XXXXXXX` ID for each field

### Extraction approach:

```
1. Fetch the Google Form URL
2. Parse the HTML (or use Playwright to render it)
3. Extract all question blocks:
   {
     "entry_id": "entry.1234567",
     "label": "Name of the participant",
     "type": "text",           // text | radio | checkbox | dropdown | date | paragraph
     "required": true,
     "options": null            // or ["Option A", "Option B"] for radio/checkbox/dropdown
   }
4. Send this structured data to the LLM for mapping
```

### Google Form URL pre-fill format:
```
https://docs.google.com/forms/d/e/{FORM_ID}/viewform?usp=pp_url
  &entry.1234567=Sharone           (text field)
  &entry.2345678=AI+%26+Data+Science  (text field with encoding)
  &entry.3456789=Option+A          (radio/dropdown selection)
  &entry.4567890=Option+A          (checkbox - repeat for multiple)
  &entry.4567890=Option+B
```

---

## LLM Field Mapping

### Prompt to Groq (Llama 8B):

```
You are a form-filling assistant. Given a student's profile and a list of form fields from a college event registration form, map each field to the correct value from the student's profile.

STUDENT PROFILE:
{user_profile_json}

FORM FIELDS:
{extracted_fields_json}

For each field, return the value to fill in. Rules:
- Match field labels to profile data intelligently. "Name", "Your Name", "Participant Name", "Full Name" all map to full_name.
- "Department", "Branch", "Dept", "Stream" all map to department.
- "Year", "Year of Study", "Current Year" maps to year.
- "Email", "Email ID", "Mail ID", "College Email" maps to email.
- "Phone", "Mobile", "Contact Number", "WhatsApp Number" maps to phone.
- "Register Number", "Roll No", "Reg No", "Registration Number" maps to roll_number.
- For radio/checkbox/dropdown: pick the option that best matches the profile data.
- If a field asks for something NOT in the profile (like "Why do you want to attend?" or "Team Name" or "Project Idea"), set value to null and flag it as "needs_user_input": true.
- If a field requires a file upload, set value to null and flag as "unsupported": true.

Return ONLY valid JSON array:
[
  {
    "entry_id": "entry.1234567",
    "label": "Name of participant",
    "type": "text",
    "value": "Sharone",
    "confidence": "high",
    "needs_user_input": false,
    "unsupported": false
  },
  ...
]
```

---

## Frontend UX Flow

### Step 1: User triggers registration
On any event card or event detail page, there's a "Register" button.
User taps it.

### Step 2: Loading state
Bottom sheet slides up:
```
┌─────────────────────────────────────┐
│                                      │
│  🤖 Reading the registration form... │
│  ━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░  │
│                                      │
└─────────────────────────────────────┘
```

### Step 3: Preview filled form
Bottom sheet expands to show what the agent filled:
```
┌─────────────────────────────────────┐
│  Auto-filled for you                 │
│                                      │
│  Name           Sharone         ✅   │
│  Email          sharone@licet   ✅   │
│  Department     AI & DS         ✅   │
│  Year           2               ✅   │
│  Phone          9876543210      ✅   │
│  Roll Number    AD22001         ✅   │
│                                      │
│  Why attend?    [tap to fill]   ⚠️   │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  [Submit Registration]               │
│  [Open form manually instead]        │
│                                      │
└─────────────────────────────────────┘
```

- ✅ = auto-filled with high confidence
- ⚠️ = needs user input (tap to type answer)
- User can tap any field to edit before submitting

### Step 4: Submission
If Approach A: agent submits via Playwright, shows success screen.
If Approach B: opens pre-filled form URL in new tab, user clicks submit.

### Step 5: Success
```
┌─────────────────────────────────────┐
│                                      │
│         ✅ Registered!               │
│                                      │
│  Inter-College Hackathon 2026        │
│  Sep 15-16 • Main Auditorium        │
│                                      │
│  +50 XP earned!                      │
│  Added to your calendar              │
│                                      │
│  [Back to Feed]                      │
│                                      │
└─────────────────────────────────────┘
```

---

## API Routes

```
POST /api/agent/preview
  Body: { event_id: string }
  Returns: {
    event: Event,
    form_url: string,
    fields: [
      {
        entry_id: string,
        label: string,
        type: string,
        value: string | null,
        confidence: "high" | "medium" | "low",
        needs_user_input: boolean,
        unsupported: boolean,
        options: string[] | null
      }
    ]
  }
  
  What it does:
  1. Fetch event from DB, get registration_link
  2. Fetch the form HTML
  3. Extract form fields
  4. Send to LLM for mapping with user profile
  5. Return preview

POST /api/agent/submit
  Body: {
    event_id: string,
    fields: [{ entry_id: string, value: string }],
    method: "auto" | "prefill"
  }
  Returns: {
    success: boolean,
    prefill_url?: string,    // if method is "prefill"
    message: string,
    xp_earned: number
  }

  What it does (method: "prefill"):
  1. Build pre-filled Google Form URL from fields
  2. Mark event as registered in DB
  3. Award XP
  4. Return the pre-fill URL for frontend to open

  What it does (method: "auto"):
  1. Playwright opens form
  2. Fills all fields
  3. Clicks submit
  4. Verifies submission (check for confirmation page)
  5. Mark event as registered in DB
  6. Award XP
  7. Return success
```

---

## Database Additions

### Add to users table:
```sql
alter table users add column phone text;
alter table users add column roll_number text;
alter table users add column section text;
```

### Add registrations table:
```sql
create table event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  event_id uuid references events(id),
  status text default 'registered',  -- 'registered', 'attended', 'cancelled'
  registered_via text default 'agent', -- 'agent', 'manual'
  xp_awarded int default 0,
  created_at timestamptz default now(),
  unique(user_id, event_id)
);
```

### Update onboarding to collect:
- Phone number (required)
- Roll number (required)
- Section (optional)

---

## Edge Cases to Handle

1. **No registration link** — Event was parsed but no link found. Show "No registration link found. Contact the organizer." Don't show the Register button.

2. **Link is not a Google Form** — Detect by checking if URL contains `docs.google.com/forms`. If not, show "This registration isn't a Google Form. Opening the link for you." and just open the URL.

3. **Form has file upload fields** — Flag as unsupported. Show "This form requires file uploads. Opening it for you to complete manually." with a pre-filled URL for the fields we CAN fill.

4. **Form has payment** — Detect payment-related fields or Razorpay/PayTM embeds. NEVER auto-submit. Always redirect to manual completion.

5. **Form is closed** — Google Forms show "This form is no longer accepting responses." Detect this text in the HTML. Show "Registration is closed for this event."

6. **Form requires Google sign-in** — Some forms require respondent to be signed in. Detect the sign-in wall. Show "This form requires you to be signed in to Google. Opening it for you."

7. **Duplicate registration** — Check `event_registrations` table before starting. If already registered, show "You've already registered for this event."

---

## Build Priority

### Phase 1: Smart Pre-Fill (build this first, 3-4 hours)
1. Add phone + roll number to onboarding
2. Build `/api/agent/preview` — fetch form, extract fields, LLM mapping
3. Build `/api/agent/submit` with method "prefill" — generate pre-filled URL
4. Build the bottom sheet UI for preview + confirmation
5. Open pre-filled URL in new tab on submit
6. Mark as registered in DB + award XP

### Phase 2: Full Auto-Submit (if time permits, 3-4 hours)
1. Set up Playwright in the project
2. Build the auto-fill + auto-submit flow in `/api/agent/submit` with method "auto"
3. Add confirmation page detection (verify form was actually submitted)
4. Handle errors gracefully (timeout, form changed, etc.)

### Phase 3: Polish (1-2 hours)
1. Loading animations during form reading
2. Success screen with confetti or celebration animation
3. "Registered" badge on event cards for events you've registered for
4. Registration history on profile page

---

## Google Form Field Extraction Code Snippet

This is the core extraction logic. Google Forms embed field data in a script tag as a JSON-like structure, but the easiest reliable method is to parse the rendered HTML:

```typescript
// lib/form-extractor.ts

interface FormField {
  entry_id: string;
  label: string;
  type: 'text' | 'paragraph' | 'radio' | 'checkbox' | 'dropdown' | 'date' | 'time' | 'file';
  required: boolean;
  options: string[] | null;
}

export async function extractGoogleFormFields(formUrl: string): Promise<FormField[]> {
  // Fetch the form HTML
  const response = await fetch(formUrl);
  const html = await response.text();

  // Google Forms embed form data in a FB_PUBLIC_LOAD_DATA_ script
  // This contains all questions, types, and options as a JS array
  const dataMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(.*?);\s*<\/script>/s);

  if (!dataMatch) {
    // Fallback: parse DOM structure
    return extractFromDOM(html);
  }

  const rawData = JSON.parse(dataMatch[1]);
  // rawData[1][1] contains the form fields array
  const fieldsData = rawData[1][1];
  
  const fields: FormField[] = [];

  for (const field of fieldsData) {
    const label = field[1]; // question text
    const fieldType = field[3]; // type enum
    const entryId = field[4]?.[0]?.[0]; // entry ID
    const required = field[4]?.[0]?.[2] === 1;
    
    // Type mapping from Google's internal enum
    const typeMap: Record<number, FormField['type']> = {
      0: 'text',
      1: 'paragraph',
      2: 'radio',
      3: 'dropdown',
      4: 'checkbox',
      9: 'date',
      10: 'time',
      13: 'file'
    };

    const options = field[4]?.[0]?.[1]?.map((opt: any) => opt[0]) || null;

    fields.push({
      entry_id: `entry.${entryId}`,
      label,
      type: typeMap[fieldType] || 'text',
      required,
      options
    });
  }

  return fields;
}

// Build pre-filled URL
export function buildPrefilledUrl(
  formUrl: string,
  fields: { entry_id: string; value: string }[]
): string {
  const url = new URL(formUrl.replace('/viewform', '/viewform'));
  url.searchParams.set('usp', 'pp_url');
  
  for (const field of fields) {
    if (field.value) {
      url.searchParams.append(field.entry_id, field.value);
    }
  }
  
  return url.toString();
}
```

---

## Demo Script for Agent Feature

This is the moment that wins:

1. Open feed, point at an event: "Here's the Inter-College Hackathon. Normally I'd have to open my email, find the Google Form link, fill out 8 fields manually."
2. Tap "Register" button on the card
3. Bottom sheet appears: "Reading the registration form..."
4. 3 seconds later: "Here's what I auto-filled from your profile." Show the preview with all green checkmarks.
5. If there's a "Why do you want to attend?" field, quickly type a one-liner
6. Tap "Submit Registration"
7. Success screen: "Registered! +50 XP earned!"
8. Go back to feed — the event now shows a "Registered ✅" badge
9. "One tap. Ten seconds. Never miss a registration deadline again."

**Practice this demo 5 times before presenting. The agent is your closer.**
