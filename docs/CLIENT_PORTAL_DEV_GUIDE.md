# Client Portal Dev Guide

**Authoritative guide** - Single source of truth for client portal development.

---

## Purpose

**Single place for clients to:**
- Get proposals
- See status of projects
- Pay Ignite (or downstream other clients they onboard if we can figure out how to make this multitenant)

**As such:** Things built on IgniteBD will populate here.

---

## Architecture

### Separate App, Shared Database

- **Standalone Product**: Separate Next.js app (`ignitebd-clientportal`)
- **Shared Database**: Uses same Prisma schema and PostgreSQL database as IgniteBD
- **Direct DB Access**: Reads/writes directly via Prisma (no dependency on IgniteBD API)
- **Independent Deployment**: Own domain (`clientportal.ignitegrowth.biz`)
- **Self-Contained**: All API routes are local (`/api/*`) - no external API calls needed

### Contact-First (Universal Personhood)

- Contact exists in IgniteBD (funnel, outreach, etc.)
- Same Contact can access Client Portal
- **No new user record needed** - Contact IS the user
- Contact's email = Firebase login username
- Contact's `firebaseUid` = Portal identity

**How it works:**
1. IgniteBD creates contact and sets up Firebase user → `firebaseUid` stored in `Contact.firebaseUid`
2. Client portal uses Firebase Auth (client-side) to authenticate user
3. Client portal API routes verify Firebase token (server-side) and look up contact by `firebaseUid`

---

## Routes

**Frontend Routes:**
- `/` (root) - Splash page
- `/splash` - Auth check
- `/login` - Contact login
- `/welcome` - Contact hydration
- `/dashboard` - Main dashboard (WorkPackage, invoices)
- `/work/[artifactId]` - Work artifact view
- `/settings/billing` - Invoice list and payment
- `/settings` - Settings
- `/activate` - Account activation
- `/set-password` - Set password
- `/reset-password` - Password reset

**API Routes:**
- `/api/client` - Contact hydration
- `/api/client/work` - WorkPackage hydration
- `/api/client/work/[artifactId]` - Single artifact
- `/api/client/billing` - Invoice list
- `/api/client/billing/[invoiceId]/checkout` - Stripe checkout

**See:** `CLIENT_PORTAL_ARCHITECTURE.md` for detailed route specifications, database queries, and response formats.

---

## Data Models (High Level)

**What we're hydrating:**
- **Contact** - The user (identified by `firebaseUid`)
- **Company** - Client's company (via `contactCompanyId`)
- **WorkPackage** - Container for work items (linked to company)
- **WorkPackageItem** - Individual deliverables
- **WorkArtifact** - Actual work content (blogs, personas, decks, templates)
- **Invoice** - Payment invoices

**Note:** Detailed model architecture is in `WORK_ARTIFACT_ARCHITECTURE.md`. Models are evolving - this guide focuses on what we're building, not deprecated structures.

---

## User Flow (MVP1 - Current)

### 1. Landing (Splash)
```
User → / (root)
  → Splash page displays
  → Check Firebase auth state
  → If authenticated → /welcome
  → If not authenticated → /login
```

### 2. Login
```
Contact → /login
  → Enters email + password
  → Firebase authenticates
  → System finds Contact by Firebase UID
  → Stores session in localStorage
  → Redirects to /welcome
```

### 3. Welcome (Contact Hydration)
```
/welcome loads
  → Check Firebase auth
  → GET /api/client
     - Looks up Contact by firebaseUid
     - Gets contactCompanyId
  → Store in localStorage:
     - contactId
     - contactCompanyId
     - contactEmail
     - firebaseUid
  → Display welcome message with client name
  → User clicks "Continue" button
  → Redirect to /dashboard
```

### 4. Dashboard (Company + WorkPackage Hydration)
```
/dashboard loads
  → Get contactCompanyId from localStorage
  → GET /api/client/work
     - Gets Company object by contactCompanyId
     - Company includes workPackages array
     - Uses workPackageId from company.workPackages[0] (most recent)
     - Loads WorkPackage with items and artifacts
  → Display:
     - WorkPackage title and description
     - Deliverables list (WorkPackageItems)
     - Artifacts (with "View" links to /work/[artifactId])
     - Invoice notification (if pending)
  → Store workPackageId in localStorage
```

### 5. Work Artifact View
```
/work/[artifactId] loads
  → GET /api/client/work/[artifactId]
  → Verify artifact belongs to contact's WorkPackage
  → Display artifact (title, type, status, contentJson)
```

### 6. Billing
```
/settings/billing loads
  → GET /api/client/billing
  → Display invoice list
  → "Pay Now" button (Stripe checkout)
```

---

## Data Hydration

**Welcome:** Contact hydration via `/api/client` - Gets `contactId` and `contactCompanyId`

**Dashboard:** Company + WorkPackage hydration via `/api/client/work` - Gets Company with workPackages, then loads WorkPackage with artifacts

**See:** `CLIENT_PORTAL_ARCHITECTURE.md` for detailed database queries, response formats, and ID hierarchy.

---

## Key Services

**WorkPackageHydrationService** - Hydrates WorkPackage with artifacts from WorkArtifact model

**See:** `CLIENT_PORTAL_ARCHITECTURE.md` for detailed service usage and database queries.

---

## MVP1 Architecture Summary

### Current State (MVP1)

**Splash** = Main landing page (not redirect)
- Shows handshake icon
- Checks auth, redirects to welcome/login

**Welcome** = Simple loader
- Hydrates contact
- Stores in localStorage
- Shows "Welcome, [Name]! See your project..."
- User clicks "Continue" → dashboard

**Dashboard** = Universal hydration
- Calls `/api/workpackage`
- Gets Company by `contactCompanyId`
- Hydrates WorkPackage with artifacts
- Shows WorkPackage title, items, artifacts
- Shows invoice notification if pending
- Links to `/work/[artifactId]` for viewing

**No routing logic** - Just hydrate and display

### What's NOT in MVP1

- ❌ Strategic routing (proposal vs work)
- ❌ Proposal views
- ❌ Stage logic
- ❌ Payment processing (Stripe scaffold only)
- ❌ Timeline views

---

## Development Notes

### Suspense Boundaries

**Important:** Any component using `useSearchParams()` must be wrapped in `<Suspense>`:

```javascript
import { Suspense } from 'react';

function MyComponent() {
  return (
    <Suspense fallback={null}>
      <ComponentUsingSearchParams />
    </Suspense>
  );
}
```

### Session Storage

Session data persists in `localStorage`:
- `clientPortalContactId` - Contact ID
- `clientPortalContactCompanyId` - Company ID
- `clientPortalContactEmail` - Contact email
- `firebaseId` - Firebase UID
- `clientPortalWorkPackageId` - WorkPackage ID (if available)

### API Client

**Location:** `lib/api.js`

**Configuration:**
- `baseURL: ''` - Relative URLs (same origin)
- Automatically adds Firebase token to all requests
- Handles 401 errors (redirects to login)

---

## Session Management (localStorage)

### Storage Keys

All session data is stored in `localStorage`:

**Contact & Auth:**
- `clientPortalContactId` - Contact's database ID
- `clientPortalContactCompanyId` - Company ID (used for company hydration)
- `clientPortalContactEmail` - Contact's email
- `firebaseId` - Firebase UID
- `clientPortalWorkPackageId` - WorkPackage ID (from company hydration)

### MVP1 Session Pattern

**MVP1 uses direct `localStorage` access** (no hook):

```javascript
// Welcome - Store contact session
localStorage.setItem('clientPortalContactId', contact.id);
localStorage.setItem('clientPortalContactCompanyId', contact.contactCompanyId || '');
localStorage.setItem('clientPortalContactEmail', contact.email || '');
localStorage.setItem('firebaseId', firebaseUser.uid);

// Dashboard - Read session and hydrate company
const contactCompanyId = localStorage.getItem('clientPortalContactCompanyId');
// Use contactCompanyId to get Company object with workPackages
```

### Legacy Session Hook (Deprecated in MVP1)

The `useClientPortalSession` hook exists but is **not used in MVP1**. It's only used in legacy pages (onboarding).

**Hook API (for reference):**
```javascript
import { useClientPortalSession } from '@/lib/hooks/useClientPortalSession';

const {
  proposalId,
  setProposalId,
  invoiceId,
  setInvoiceId,
  contactSession,
  setContactSession,
  hasValidSession,
  refreshSession,
  clearSession,
} = useClientPortalSession();
```

**Note:** MVP1 simplified to direct `localStorage` access. The hook may be used in future versions when proposal-based routing is added.

### Storage Behavior

All data is stored in browser `localStorage`, which means:
- ✅ Persists across page refreshes
- ✅ Persists across browser sessions (until cleared)
- ⚠️ Cleared when user clears browser data
- ⚠️ Not shared across devices/browsers

---

## Activation & Login Flow

The client portal has **two entry points**:
1. **Activation Flow** - First-time setup via invite link (initiated from IgniteBD)
2. **Login Flow** - Regular login after activation (the "front door")

### Activation Flow (First-Time Setup)

**Step 1: Owner generates portal access** (in IgniteBD)
- Creates Firebase user (passwordless)
- Stores `firebaseUid` in `Contact.firebaseUid`
- Generates invite token

**Step 2: Contact receives invite link:**
```
https://clientportal.ignitegrowth.biz/activate?token=abc123
```

**Step 3: Activate Account**
- Route: `/activate`
- Calls: `/api/activate` (client portal route)
- What happens:
  - Validates invite token
  - Creates/links Firebase user
  - Stores `firebaseUid` in `Contact.firebaseUid`
  - Returns `uid`, `email`, `contactId`

**Step 4: Set Password**
- Route: `/set-password?uid=...&email=...&contactId=...`
- Calls: `/api/set-password` (client portal route)
- What happens:
  - Sets Firebase password (via Firebase Admin)
  - User can now login with email/password
- Redirects to: `/login?activated=true`

**Step 5: Login (Front Door)**
- Route: `/login?activated=true`
- User enters email and password
- Uses Firebase Auth (`signInWithEmailAndPassword`)
- Gets Firebase token
- Calls `/api/contacts/by-firebase-uid` to get contact
- Redirects to `/welcome`

### Login Flow (Regular Access - The "Front Door")

**Once password is set, users can ALWAYS go through the login page!**

```
1. User goes to /login (or /splash which routes to /login)
   ↓
2. User enters email and password
   ↓
3. Firebase Auth authenticates (signInWithEmailAndPassword)
   ↓
4. Get Firebase token
   ↓
5. Call /api/client/hydrate (find contact by firebaseUid)
   ↓
6. Store contact session in localStorage
   ↓
7. Redirect to /welcome (Contact hydration)
   ↓
8. Redirect to /dashboard (Company + WorkPackage hydration)
```

**Key Point:** After activation, the login page is the **primary entry point**. Users don't need invite links anymore - they can just login with email/password.

### Splash Page Behavior

The splash page (`/splash`) checks Firebase auth state:

```javascript
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is already logged in → go to welcome
    router.replace('/welcome');
  } else {
    // No Firebase user → go to login (front door)
    router.replace('/login');
  }
});
```

**This is correct behavior:**
- If user is already logged in → skip login, go to welcome
- If user is not logged in → go to login page

### Authentication Methods

**Current: Firebase Auth (Email/Password)**
- Primary method
- Uses `signInWithEmailAndPassword`
- Token verified server-side via Firebase Admin
- Contact looked up by `firebaseUid`

**Legacy: JWT (Deprecated)**
- Old method using `/api/auth/login`
- Stores password hash in `Contact.notes.clientPortalAuth.passwordHash`
- Still exists but not recommended
- Firebase Auth is the standard

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    First-Time Activation                    │
└─────────────────────────────────────────────────────────────┘

Invite Link
    ↓
/activate?token=abc123
    ↓
/api/activate (creates Firebase user, stores firebaseUid)
    ↓
/set-password?uid=...&email=...&contactId=...
    ↓
/api/set-password (sets Firebase password)
    ↓
/login?activated=true
    ↓
Firebase Auth (signInWithEmailAndPassword)
    ↓
/api/client/hydrate (find contact)
    ↓
/welcome → /dashboard

┌─────────────────────────────────────────────────────────────┐
│                    Regular Login (Front Door)                │
└─────────────────────────────────────────────────────────────┘

/login (or /splash → /login)
    ↓
Firebase Auth (signInWithEmailAndPassword)
    ↓
/api/client/hydrate (find contact)
    ↓
/welcome → /dashboard
```

**The activation flow is ONE-TIME:**
- First time: Invite link → Activate → Set Password → Login
- Every time after: Just login with email/password

---

## Work Artifact Architecture

**How artifacts are displayed in the client portal:**

WorkArtifacts are linked directly to WorkPackageItems. The `hydrateWorkPackage` service loads artifacts from the WorkArtifact model.

**See:** `WORK_ARTIFACT_ARCHITECTURE.md` for detailed architecture

---

## Related Documentation

**Core Guides:**
- **`CLIENT_PORTAL_DEV_GUIDE.md`** - This document (authoritative source)

**Architecture & Backend:**
- **`CLIENT_PORTAL_ARCHITECTURE.md`** - **Single authority** for models, routes, database queries, and backend wiring

**Feature-Specific:**
- **`INVOICE_PAYMENT_SETUP.md`** - Invoice payment system (Stripe integration)
- **`PROPOSAL_STRUCTURE.md`** - Proposal data structure (for future proposal views)
- **`WORK_ARTIFACT_ARCHITECTURE.md`** - Detailed work artifact system architecture

**Troubleshooting:**
- **`buildprismaonvercel.md`** - Prisma build issues on Vercel

---

**Last Updated**: January 2025  
**Focus**: Client-facing portal (what clients see)  
**Architecture**: Contact-First (Universal Personhood)  
**Hydration**: WorkPackage (primary) + Invoices  
**Authentication**: Contact.email + Firebase  
**MVP1**: Simple hydration, no routing logic
