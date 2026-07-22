# Patitas — Project Documentation

> Bilingual animal adoption PWA for Mexico  
> Last updated: July 2026

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [User Types](#3-user-types)
4. [Feature Set](#4-feature-set)
5. [Adoption Pipeline](#5-adoption-pipeline)
6. [Adopter Flagging System](#6-adopter-flagging-system)
7. [Tech Stack](#7-tech-stack)
8. [Database Schema](#8-database-schema)
9. [Build Phases](#9-build-phases)
10. [Current State](#10-current-state)
11. [Design System](#11-design-system)
12. [Key Product Decisions](#12-key-product-decisions)

---

## 1. Problem Statement

In Mexico, stray dogs and cats multiply faster than shelters can handle them. Volunteers and registered shelters rescue animals and cover costs out of pocket, but rely entirely on social media to find adopters. This approach is slow, limited to each volunteer's personal network, and leaves no shared institutional memory across the volunteer community.

The goal of Patitas is to replace scattered social media posts with a structured, trustworthy adoption platform that works on any device, reaches local and international adopters, and makes the process faster and safer for everyone involved.

---

## 2. Solution Overview

Patitas is a **bilingual (Spanish/English) Progressive Web App (PWA)** — no app store required, installable on both Android and iOS home screens directly from the browser.

Core principles:
- **Validate before spending** — zero running cost through all validation phases. Switch to paid stack only once real shelter and adopter behavior confirms the concept.
- **PWA-first** — avoids the iOS/Android choice entirely. React Native is the documented migration path post-launch.
- **Meet users where they are** — WhatsApp for Mexican volunteers, SMS for US/Canada adopters, in-app messaging for everyone. All channels unified in one inbox.
- **Responsible adoption** — not just a classifieds board. A five-stage pipeline with home verification, customizable surveys, and a community flagging system.

---

## 3. User Types

### Adopters
Browse without an account. Sign up only at the point of first contact with a volunteer. Can be local (Mexico) or international (US, Canada). US/Canada adopters may use SMS over WhatsApp.

### Individual Volunteers
Rescuers operating independently. Phone number signup, instant verification. Up to 10 active listings. Manage everything from their phone. Often also the foster carer.

### Registered Shelters
Formal organizations (NGOs, municipal pounds). Go through a brief manual review to receive a Verified badge. Unlimited listings. Multiple team members under one account.

### Shelter-Affiliated Volunteers
Volunteers who operate under a shelter's umbrella via an invite link or code. Their listings carry the shelter's Verified badge. Donations go to the shelter's Stripe account. Access is revoked instantly if removed from the roster.

#### Shelter team roles

| Role | Permissions |
|---|---|
| Admin | Full access — team, finances, listings, profile |
| Coordinator | Add/edit listings, approve requests, view all messages |
| Foster Volunteer | Manage only assigned pets — update details, respond to messages, flag ready for adoption |

---

## 4. Feature Set

### For Adopters
- Browse without an account — no friction before seeing animals
- Filter by location, species, size, age, International OK
- Save favorites, get notified when pets become available
- Submit adoption request with a short questionnaire
- Contact via WhatsApp, SMS, or in-app messaging (preference saved permanently)
- Self-reported preference tags (small dogs only, cat allergy, trained dogs only, etc.)
- Follow-up check-in two months after adoption

### For Individual Volunteers
- Phone number signup, instant verification
- Up to 10 active listings
- Unified inbox — all channels (WhatsApp, SMS, in-app) in one place
- Days waiting counter and Urgent flagging (auto-suggested after 30 days)
- Stripe-connected donations per pet
- Simplified survey customization — toggle defaults, add up to 5 custom questions
- Home verification scheduling via video call or in-person visit with checklist
- Adopter soft flagging with notes visible to other volunteers
- Shareable pet cards for social media
- Optional video link field per listing (YouTube, TikTok, Instagram Reels — no direct upload)

### For Shelters
- Organization account with team roles (admin, coordinator, foster volunteer)
- Invite volunteers via link or code
- Unlimited listings under Verified badge
- Full survey builder — add, remove, reorder, conditional logic, per-listing overrides
- Multi-member inbox with activity logging
- Configurable follow-up timing (default: 2 months)
- Hard block escalation (requires two shelters or one confirmed serious incident)
- Cross-border donations in MXN, USD, and CAD via Stripe

### Platform-Wide
- Auto-translation of listings via DeepL — volunteer writes once, both languages served *(deferred post-validation)*
- Story card generator — three templates (Warm, Dark, Nature) for Instagram, WhatsApp, Facebook, TikTok, SMS
- Web Share API — one tap opens native share sheet on iOS and Android
- Open Graph tags — rich link previews when a URL is shared via iMessage or SMS
- Transport Board — volunteer flight couriers post available Mexico → US/CA routes
- Calendar integration — Google Calendar and Apple Calendar for verification scheduling
- Push, SMS, and WhatsApp notifications *(SMS/WhatsApp deferred post-validation)*

---

## 5. Adoption Pipeline

Five sequential stages:

**Stage 1 — Browse & Matching**
Adopter finds a pet, submits the adoption survey. Volunteer receives a notification.

**Stage 2 — Request Review**
Volunteer reads the survey, checks the adopter's profile for soft flags or preference mismatches, and either approves, declines, or asks follow-up questions via the unified inbox.

**Stage 3 — Home Verification**
A scheduled video call or in-person visit. Volunteer ticks through a customizable checklist post-call and marks the verification as passed or failed. If failed, adoption returns to review or is rejected outright.

**Stage 4 — Adoption Confirmed**
Pet is marked as adopted. Listing is archived. All other pending applicants are automatically notified.

**Stage 5 — Follow-Up Check**
Triggered automatically at the configured interval (default: 2 months). Adopter receives a short check-in survey with a photo upload prompt. Volunteer sees a summary and can trigger a second verification if the response is concerning.

---

## 6. Adopter Flagging System

Three distinct levels, each with different visibility and consequences:

### Preference Tags (self-set)
Set by the adopter during signup or profile setup. Examples: only interested in small dogs, allergic to cat fur, looking for a trained dog. Filters what they see in browse. Visible on their profile to volunteers. No negative connotation.

### Soft Flags (volunteer-set)
Applied by a shelter or volunteer after a failed verification or a concerning interaction. Not visible to the adopter. Appears as a warning on their profile when any other volunteer views their adoption request. Expires after 12 months if no further flags are added.

Examples: "verification failed — insufficient outdoor space for large dogs", "adopter withdrew after approval twice."

### Hard Blocks (platform-decided)
Reserved for clear evidence of bad intent, animal abuse, or repeated bad faith behavior. Requires two or more independent shelters to flag the same adopter, or one confirmed serious incident. Blocked adopters can browse but cannot submit adoption requests. All blocks are appealable through Patitas support — the platform holds the final decision, not individual shelters.

---

## 7. Tech Stack

### Validation Stack (zero cost, active now)

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js PWA + Tailwind CSS + i18next | App Router, TypeScript |
| Auth | Supabase Auth | Phone number + social login |
| Database | Supabase (PostgreSQL) | 500MB free tier |
| File storage | Supabase Storage | 1GB free tier |
| Backend hosting | Render or Railway free tier | Cold starts acceptable at this stage |
| Frontend hosting | Vercel free tier | Auto-deploy on git push |
| Analytics | Posthog free tier | 1M events/month |
| Error tracking | Sentry free tier | 5,000 errors/month |
| Email | Resend free tier | 3,000 emails/month |
| Calendar | Google Calendar API | Free |
| Messaging | In-app only | No WhatsApp/SMS until post-validation |
| Donations | External link only | Volunteer pastes their own payment link |
| Translation | Manual | Volunteer fills both languages or just one |

**Estimated monthly cost: $0**

### Future Paid Stack (post-validation)

| Layer | Tool | Migrates from |
|---|---|---|
| Auth | Clerk | Supabase Auth |
| Database | Railway PostgreSQL | Supabase PostgreSQL |
| File storage | Cloudflare R2 | Supabase Storage |
| Messaging | Twilio (WhatsApp + SMS) | In-app only |
| Payments | Stripe Connect | External links |
| Translation | DeepL API | Manual |
| Native apps | React Native / Expo | PWA |

All migrations are non-breaking — same PostgreSQL schema, same API interfaces, only connection strings and provider SDKs change.

### Migration triggers (when to switch)
Switch when two or more of these are true:
- 20+ shelters or volunteers have active listings
- 100+ adoption requests submitted
- Volunteers report missing WhatsApp integration is costing adoptions
- US/Canada adopters are showing up and hitting friction

---

## 8. Database Schema

### Phase 1 tables (active)

```sql
-- Profiles (extends Supabase auth.users)
profiles
  id          uuid references auth.users primary key
  full_name   text
  phone       text
  role        text  -- 'adopter' | 'volunteer' | 'shelter_admin'
  created_at  timestamptz default now()

-- Pet listings
pets
  id              uuid primary key default gen_random_uuid()
  created_by      uuid references profiles(id)
  name            text not null
  species         text not null   -- 'dog' | 'cat' | 'other'
  age_years       numeric
  sex             text            -- 'male' | 'female'
  size            text            -- 'small' | 'medium' | 'large'
  city            text not null
  state           text not null
  description     text
  is_urgent       boolean default false
  is_active       boolean default true
  days_in_shelter int default 0
  video_url       text            -- YouTube, TikTok, Instagram Reels link
  created_at      timestamptz default now()

-- Pet photos
pet_photos
  id          uuid primary key default gen_random_uuid()
  pet_id      uuid references pets(id) on delete cascade
  url         text not null
  is_primary  boolean default false
  created_at  timestamptz default now()

-- Mexican states (for filtering)
mexican_states
  id    serial primary key
  name  text not null
  code  text not null
```

### Planned tables (future phases)

```
-- Phase 2
adoption_requests   (id, pet_id, adopter_id, status, survey_answers, created_at)
survey_questions    (id, shelter_id, question_text, question_type, is_required, order)

-- Phase 3
messages            (id, conversation_id, sender_id, body, channel, created_at)
conversations       (id, pet_id, adopter_id, volunteer_id, created_at)

-- Phase 4
organizations       (id, name, description, city, state, verified, created_at)
org_members         (id, org_id, profile_id, role, created_at)
org_invites         (id, org_id, code, created_at, expires_at)

-- Phase 5
donations           (id, pet_id, donor_email, amount_cents, currency, stripe_id, created_at)

-- Phase 6
verifications       (id, adoption_request_id, scheduled_at, outcome, checklist, notes)
followups           (id, adoption_request_id, triggered_at, survey_answers, status)
adopter_flags       (id, adopter_id, flagged_by, flag_type, reason, expires_at)

-- Phase 7
transport_routes    (id, volunteer_id, origin_city, destination_city, flight_date, spots, created_at)
```

### Row Level Security policies
- Anyone can view active pets and pet photos (no account required to browse)
- Authenticated volunteers can insert and update their own pets and photos
- Users can only view and update their own profile

### Storage
- Bucket: `pet-photos` (public)
- Max file size: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- Max photos per listing: 6
- Video uploads: not supported — use `video_url` field instead

---

## 9. Build Phases

### Phase 1 — Foundation and pet listing (weeks 1–4) ← current
**Goal:** A volunteer can list a pet. Anyone can browse and view it.

- Next.js PWA scaffolded with Tailwind, TypeScript, ESLint
- Supabase auth, database, and storage configured
- Browse page with species and urgency filters
- Pet detail page
- Volunteer dashboard (basic)
- Photo upload with client and server-side validation
- Vercel deployment — live public URL
- PWA manifest — installable on Android and iOS

**Done when:** A volunteer can sign up, post a pet with a photo, and someone on a mobile phone can find and view it at a real URL.

---

### Phase 2 — Adoption request flow (weeks 5–8)
**Goal:** Close the loop between adopter and volunteer.

- Adopter account creation at point of first contact
- Default adoption survey (home type, outdoor space, other pets, experience, location)
- Adoption request submission and email notification via Resend
- Volunteer dashboard — pending requests, days waiting counter
- Urgent flag — manual toggle, auto-suggested after 30 days
- Basic in-app inbox — adopter and volunteer can message each other
- Mark as adopted — listing archived, other applicants notified
- Posthog analytics — listing created, request submitted, adoption confirmed events

---

### Phase 3 — Messaging and social sharing (weeks 9–12)
**Goal:** Replace social media dependency. Make contact natural for all users.

- Unified inbox — all incoming messages in one place
- Social share card — auto-generated image (photo, name, days waiting, patitas. brand)
- Three story card templates (Warm, Dark, Nature) for Instagram/WhatsApp/Facebook
- Web Share API — one tap native share sheet on iOS and Android
- Open Graph tags — rich link previews for iMessage and SMS
- DeepL auto-translation — listings appear in both languages automatically *(requires paid DeepL account)*

---

### Phase 4 — Organizations and teams (weeks 13–17)
**Goal:** Bring formal shelters onto the platform with team structure.

- Organization account type with name, profile, location
- Manual verification review queue — Verified badge applied
- Team roles — admin, coordinator, foster volunteer
- Invite flow — link or code, volunteer joins scoped to assigned pets
- Per-pet assignment to specific team members
- Activity log — who did what and when
- Access revocation — instant on team member removal
- Unlimited listings for verified organizations

---

### Phase 5 — Donations (weeks 18–20)
**Goal:** Let money flow directly from donors to volunteers and shelters.

- Stripe Connect onboarding for volunteers and shelters
- Donation button per listing linked to a specific pet
- MXN, USD, CAD — displayed in donor's local currency
- Direct payouts to volunteer/shelter Stripe account
- Donation total visible on volunteer dashboard
- Donor receipts via Resend

---

### Phase 6 — Responsible adoption pipeline (weeks 21–26)
**Goal:** The full five-stage pipeline with safeguards.

- Survey builder for shelters — conditional logic, per-listing overrides
- Simplified survey toggle for individual volunteers (up to 5 custom questions)
- Home verification stage — status between approved and confirmed
- Google Calendar and Apple Calendar integration — auto-generated Meet link
- Verification checklist — customizable per shelter, ticked post-call
- Pass/fail outcome with notes
- Follow-up trigger — configurable timing, default 2 months
- Follow-up survey with photo upload prompt
- Adopter preference tags — self-set, filter browse results
- Soft flag system — volunteer-set, visible to volunteer network, expires 12 months
- Hard block request — two shelters or one confirmed serious incident, Patitas decides
- Appeal flow via support

---

### Phase 7 — Transport Board and international polish (weeks 27–30)
**Goal:** Make international adoption as smooth as local adoption.

- Transport Board — volunteers post available flight routes with date, origin, destination, capacity
- International OK flag with checklist confirmation (microchip, rabies cert, health certificate)
- Import requirement guides — US (USDA) and Canada (CBSA) displayed on listings
- International filter on browse
- Currency display adapts to adopter's detected locale

---

### Phase 8 — Native apps (post-launch)
**Goal:** Native iOS and Android apps if PWA limitations are causing drop-off.

**Trigger:** Significant user feedback about push notification reliability on iOS or camera experience for photo uploads.

- React Native / Expo codebase initialized
- Shared business logic ported from Next.js
- iOS App Store and Google Play Store submission
- PWA remains live — no existing users disrupted
- Backend unchanged — same API serves both PWA and native apps

---

## 10. Current State

### Completed (end of Phase 1 setup)

**Accounts and services:**
- GitHub repo: `patitas` (private)
- Supabase project created — East US region, free tier
- Vercel account connected to GitHub (deployment pending)

**Codebase:**
```
patitas/
├── app/
│   ├── layout.tsx              ✅ PWA metadata, Inter font, max-w-md container
│   ├── page.tsx                ✅ Browse page with filter bar and pet grid
│   └── pets/
│       └── [id]/
│           └── page.tsx        ✅ Pet detail page (server component)
├── components/
│   ├── PetCard.tsx             ✅ Pet card with photo, name, days waiting
│   └── FilterBar.tsx           ✅ Species and urgency chip filters
├── lib/
│   ├── supabase.ts             ✅ Supabase client
│   ├── types.ts                ✅ TypeScript types for all entities
│   └── upload.ts               ✅ File validation (5MB limit, MIME types)
├── public/
│   └── manifest.json           ✅ PWA manifest
├── .env.local                  ✅ Supabase URL and anon key (not committed)
└── next.config.js              ✅ Next.js config
```

**Database:**
- `profiles` table with RLS ✅
- `pets` table with RLS ✅
- `pet_photos` table with RLS ✅
- `mexican_states` table with all 32 states ✅
- `video_url` column added to pets ✅
- `handle_new_user` trigger — auto-creates profile on signup ✅
- `pet-photos` storage bucket (public, 5MB limit, JPEG/PNG/WebP/HEIC) ✅

### Next step
**Step 6 — Connect Vercel for live deployment.**

Connect GitHub repo to Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in Vercel dashboard, deploy.

---

## 11. Design System

### Brand
- **Name:** patitas. (lowercase, period is part of the logo)
- **Tagline:** Encuentra a tu compañero perfecto y dale un hogar.
- **Tone:** Warm and urgent — caring without guilt, honest without being heavy-handed

### Colors
| Token | Hex | Usage |
|---|---|---|
| Brand / primary | `#C04828` | Logo, primary buttons, urgent flags, days counter |
| Brand dark | `#712B13` | Text on light brand backgrounds |
| Brand light | `#FFF3EF` | Urgent card backgrounds |
| Brand border | `#F5C4B3` | Urgent card borders |
| Success | `#3B6D11` | International OK badge, verified badge, passed verification |
| Success light | `#EAF3DE` | Success backgrounds |
| Neutral | Gray scale | Everything else |

### Typography
- Font: Inter (Google Fonts)
- Pet names: `text-sm font-medium`
- Section headers: `text-sm font-medium`
- Meta / secondary: `text-xs text-gray-500`
- Days counter number: `font-medium text-[#C04828]`

### Signature element
The **days waiting counter** appears on every pet in every context — browse grid, detail page, volunteer dashboard. It is the single most important piece of information on the platform. At 5 days it feels fine. At 47 days it feels urgent. The number does the emotional work so the copy doesn't have to.

### Key UI patterns
- Max width `max-w-md` centered — designed for mobile, readable on desktop
- Cards: `rounded-2xl border border-gray-100`
- Buttons: `rounded-xl` primary in `#C04828`, secondary with `border border-gray-200`
- Fixed bottom CTA bar on detail pages
- Skeleton loading states on the browse grid
- Empty state with 🐾 emoji and short explanation

---

## 12. Key Product Decisions

**PWA over native apps** — avoids App Store/Play Store friction and the iOS/Android choice. React Native is the documented migration path post-launch if needed.

**Supabase over separate services** — replaces Clerk (auth) + Railway PostgreSQL (database) + Cloudflare R2 (storage) with one free platform. Same PostgreSQL schema throughout — migration is a connection string change.

**No video uploads** — videos are too large for Supabase's free storage tier and require transcoding infrastructure. Volunteers paste a link from YouTube, TikTok, or Instagram Reels instead. Native video upload is a post-validation feature.

**No WhatsApp/SMS in validation phase** — Twilio costs per message. In-app messaging and email cover the validation phase. WhatsApp and SMS are added post-validation when real usage confirms the concept.

**No in-app donations in validation phase** — Stripe Connect requires account verification overhead. Volunteers paste their own payment link (Mercado Pago, PayPal, CLABE) during validation. Stripe is added post-validation.

**Adopters browse without an account** — the sign-up moment is triggered only when the adopter wants to contact a volunteer. This removes the single biggest drop-off point in adoption platforms.

**Unified messaging layer** — volunteers manage all incoming contact (WhatsApp, SMS, in-app) from one inbox. US/Canada adopters who don't use WhatsApp are not second-class citizens.

**Days waiting as the emotional core** — not a guilt mechanism, just honest information. The counter creates shared responsibility across the platform without any hard-sell copy.

**Soft flags expire after 12 months** — protects against the system being used punitively. A changed circumstance or misunderstanding should not follow an adopter forever.

**Hard blocks are platform decisions, not shelter decisions** — individual shelters cannot permanently block an adopter unilaterally. This prevents abuse of the system and ensures an appeals process exists.

**Transport Board** — volunteer flight couriers posting available routes dramatically lowers the cost and complexity of Mexico → US/CA adoption compared to full cargo shipping.

---

## 13. Backlog / Known Gaps

Small items noticed during implementation that aren't scoped into any phase yet — revisit when relevant.

- **`days_in_shelter` doesn't auto-increment.** It's set once when a volunteer creates a listing and never updates on its own. The "days waiting counter" phases only ask for it to be *displayed*, which works, but if it's meant to tick up daily without volunteer intervention, that needs a small daily job (e.g. a Supabase scheduled function) — not yet built.
