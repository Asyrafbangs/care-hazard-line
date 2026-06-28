# CARE Hazard Line Project Plan

## Confirmed product direction

Build a practical, lean EHS hazard reporting system using a WhatsApp-style reporting flow and a web application backend.

The system must support employees and visitors, mandatory photo reporting, AI summary before submission, progress tracking, reporter privacy, urgent EHS alerts, and multilingual worker-friendly guidance.

## Architecture

```text
Reporter / Visitor
  -> Mobile-first WhatsApp-style reporting page / future WhatsApp bot
  -> Next.js App Router backend routes
  -> Cloudinary for photo storage
  -> Supabase Postgres for structured data
  -> EHS dashboard
  -> Action owner dashboard
  -> EHS verification and closure update
```

## Technology stack

| Layer | Decision |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js App Router route handlers |
| Database | Supabase Postgres |
| Authentication | Supabase Auth, email and password |
| Photo storage | Cloudinary |
| Hosting | Vercel |
| Design | Mobile-first PWA |

## Privacy rules

| Role | Visibility |
|---|---|
| EHS | Can see full reporter details, including phone number |
| Action owner | Cannot see reporter name or phone number |
| Reporter | Can see own report progress |
| HOD | Can see escalation/action context, but reporter details can be restricted later |

## Status flow

1. Draft
2. Submitted
3. EHS Review
4. Assigned
5. In Progress
6. Pending Verification
7. Closed
8. Reopened
9. Cancelled

## Phase 1: Foundation setup

### Goal
Create a clean technical base that can support the later reporting, dashboard, notification, and WhatsApp integration phases.

### Build
- Next.js project structure
- Tailwind and mobile-first layout
- PWA manifest
- Supabase client/server helper files
- Supabase SQL schema
- Dummy master data
- Cloudinary signed-upload API route
- AI summary API route with fallback logic
- WhatsApp webhook placeholder
- Demo landing page
- Demo hazard report flow page
- Demo dashboard
- Admin settings preview

### Not included yet
- Real Supabase data writes from UI
- Real Cloudinary file upload from UI
- Real Supabase Auth login action
- WhatsApp outbound messages
- Full role-based enforcement in frontend routes
- Production RLS hardening

### User input needed
- Real locations
- Real departments
- Real EHS users
- Real action owners
- Real escalation mapping
- Translation validation

### Continue with dummy data
Yes. Dummy master data is included so development can continue without waiting for real data.

## Phase 2: Hazard reporting flow

### Goal
Make the reporting flow functional end-to-end from mobile page to database.

### Build
- Reporter registration and phone lookup
- Returning reporter recognition
- Report creation in Supabase
- Cloudinary photo upload integration
- Mandatory photo validation
- Location selection / other location entry
- AI summary saved to database
- Reporter confirmation / correction before submission
- Submitted report number

### Not included yet
- WhatsApp Cloud API full message parsing
- Action assignment
- Closure workflow

### User input needed
- Confirm whether employee ID is mandatory or optional
- Confirm visitor company/purpose fields
- Validate privacy notice wording

## Phase 3: EHS dashboard

### Goal
Allow EHS to review, classify, and assign reports.

### Build
- View all reports
- EHS-only reporter details
- Filters by status, location, category, urgency
- Report detail page
- AI summary review
- Final category and urgency setting
- Action owner assignment

### Not included yet
- Automated escalation
- WhatsApp closure updates

### User input needed
- Real EHS user list
- Real owner mapping
- Due-date rules by urgency

## Phase 4: Action owner dashboard

### Goal
Allow action owners to update assigned actions without seeing reporter identity.

### Build
- Assigned actions only
- No reporter name or phone number
- Action status update
- Comments
- Closure evidence upload
- Submit for EHS verification

### Not included yet
- Full escalation automation
- Advanced analytics

### User input needed
- Confirm whether supervisors and managers both can be action owners
- Confirm if action owner can reject assignment or request extension

## Phase 5: Notification and progress tracking

### Goal
Keep reporters, EHS, action owners, and HOD updated.

### Build
- Reporter progress tracking page
- Closure update notification
- Urgent EHS alert
- Escalation rules
- Notification log
- WhatsApp template structure

### Not included yet
- Advanced WhatsApp chatbot NLP
- Voice notes

### User input needed
- WhatsApp official account details
- Notification template approval wording
- EHS urgent contact list

## Phase 6: Multilingual and low-literacy support

### Goal
Make the system worker-friendly across languages and literacy levels.

### Build
- Language selector
- Message dictionary
- Reporter-level language preference
- Fallback to English when translation is missing
- Help screen
- Short instruction cards
- Icon-led steps

### Not included yet
- Certified translation
- Voice instructions

### User input needed
- Validate Nepali, Myanmar, and Bengali translations with workers
- Confirm worker-friendly terms used locally

## Phase 7: Testing, hardening, and packaging

### Goal
Prepare the system for pilot use.

### Build
- Manual test checklist
- Role-based access test
- Privacy visibility test
- Upload test
- Mobile PWA test
- Database seed test
- Deployment guide
- Final ZIP package

### Not included yet
- External penetration test
- Full corporate IT review

### User input needed
- Pilot area
- Pilot users
- Sign-off criteria
