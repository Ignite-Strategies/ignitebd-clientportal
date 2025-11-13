# Client Portal Architecture

## Overview

The Ignite Client Portal is a **completely self-contained Next.js application** that provides client-facing access to proposals, deliverables, and engagement details. It shares the database with the main IgniteBD app but has its own independent API layer.

## Core Principle: Self-Contained Architecture

**The client portal MUST be 100% self-contained. It should NEVER call external APIs.**

### Why?

1. **No CORS Issues** - Same origin = no cross-origin requests = no CORS problems
2. **Independence** - Client portal can be deployed, scaled, and maintained separately
3. **Security** - Each app has its own API layer with appropriate security boundaries
4. **Simplicity** - No complex CORS configuration, no preflight requests, no origin whitelisting
5. **Standalone Operation** - Once `firebaseUid` exists in the database, client portal is completely independent

### The Magic: Firebase UID in Database

**CRITICAL:** Once a contact has a `firebaseUid` in the database, the client portal is **100% standalone** and doesn't need the main app at all!

**How it works:**
1. Main app creates contact and sets up Firebase user → `firebaseUid` stored in `Contact.firebaseUid`
2. Client portal uses Firebase Auth (client-side) to authenticate user
3. Client portal API routes verify Firebase token (server-side) and look up contact by `firebaseUid`
4. **That's it!** No communication with main app needed

**The Flow:**
```
Main App (One-time setup):
  Contact created → Firebase user created → firebaseUid stored in DB
                    ↓
Client Portal (Standalone):
  User logs in with Firebase → Token verified → Contact found by firebaseUid
  → Full access to proposals, deliverables, etc.
```

**Key Point:** The `firebaseUid` field in the database is the **bridge** between Firebase Auth and your Contact record. Once that's set, the client portal operates completely independently.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Portal App                        │
│              (clientportal.ignitegrowth.biz)                │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Frontend   │───▶│  API Routes  │───▶│   Database   │ │
│  │   (React)    │    │  (/api/*)    │    │   (Prisma)   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                   │                   │          │
│         │                   │                   │          │
│         └───────────────────┴───────────────────┘          │
│                        Same Origin                          │
│                    (No CORS Needed)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Shared Database
                              │ (PostgreSQL)
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                    Main App                                 │
│              (app.ignitegrowth.biz)                        │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Frontend   │───▶│  API Routes  │───▶│   Database   │ │
│  │   (React)    │    │  (/api/*)    │    │   (Prisma)   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## What We Share

### ✅ Shared Resources
- **Database** - Both apps use the same PostgreSQL database via Prisma
- **Firebase Project** - Same Firebase project for authentication
- **Data Models** - Same Prisma schema (Contact, Proposal, Deliverable, etc.)

### ❌ What We DON'T Share
- **API Routes** - Each app has its own `/api/*` routes
- **Frontend Code** - Completely separate React applications
- **Deployment** - Separate Vercel projects/deployments
- **Environment Variables** - Separate configs (except database URL)

## The CORS Problem (What We Fixed)

### The Wrong Way (Before)

```javascript
// ❌ WRONG: Client portal calling main app
const api = axios.create({
  baseURL: 'https://app.ignitegrowth.biz', // Different origin!
});

// This caused:
// - CORS preflight requests
// - CORS header configuration
// - Cross-origin security issues
// - Complex error handling
```

**Result:** Constant CORS errors, preflight failures, and debugging headaches.

### The Right Way (Now)

```javascript
// ✅ CORRECT: Client portal calls its own routes
const api = axios.create({
  baseURL: '', // Empty = relative URLs = same origin
});

// Interceptor sets baseURL to window.location.origin
// All /api/* routes call clientportal.ignitegrowth.biz/api/*
// Same origin = NO CORS needed
```

**Result:** Zero CORS issues, simpler code, better architecture.

## API Client Configuration

### `/lib/api.js`

```javascript
/**
 * CLIENT PORTAL API CLIENT
 * 
 * SELF-CONTAINED: Only calls client portal's own routes (/api/*)
 * NO external API calls - everything is local
 */
const api = axios.create({
  // NO baseURL - all routes are relative to current origin
  baseURL: '',
});

// Request interceptor sets baseURL to window.location.origin
// This ensures all /api/* routes call the client portal's own API
```

**Key Points:**
- `baseURL: ''` - Empty string means relative URLs
- Interceptor sets `config.baseURL = window.location.origin` for all requests
- All `/api/*` routes automatically call `clientportal.ignitegrowth.biz/api/*`
- No external URLs, no CORS, no problems

## API Routes

All client portal API routes are in `/app/api/*`:

### Authentication Routes
- `/api/contacts/by-firebase-uid` - Get contact by Firebase UID (Step 1: Contact Lookup)
- `/api/auth/login` - JWT-based login (legacy, uses Firebase now)
- `/api/auth/setup` - Password setup from invite token
- `/api/activate` - Activate account from invite token
- `/api/set-password` - Set password after activation

### Data Routes
- `/api/contacts/[contactId]/proposals` - Get proposals for a contact
- `/api/proposals/[proposalId]/portal` - Get portal data for a proposal

### Future Routes
- `/api/invoices/*` - Invoice management
- `/api/deliverables/*` - Deliverable tracking
- `/api/promote-to-owner` - Contact elevation flow

## Data Flow

### Login Flow

```
1. User logs in with Firebase (email/password)
   ↓
2. Get Firebase token
   ↓
3. Call /api/contacts/by-firebase-uid (CLIENT PORTAL ROUTE)
   ↓
4. Server verifies Firebase token (Firebase Admin)
   ↓
5. Find contact in database by firebaseUid
   ↓
6. Return contact data
   ↓
7. Store in localStorage (useClientPortalSession hook)
   ↓
8. Redirect to /welcome
```

### Welcome Page (Step 1: Contact Hydration)

```
1. Check Firebase auth
   ↓
2. Call /api/contacts/by-firebase-uid (CLIENT PORTAL ROUTE)
   ↓
3. Store contact session data
   ↓
4. Display welcome message
   ↓
5. Redirect to /dashboard
```

### Dashboard (Step 2: Company/Proposals Hydration)

```
1. Get contactId from session
   ↓
2. Call /api/contacts/[contactId]/proposals (CLIENT PORTAL ROUTE)
   ↓
3. Get first proposal, set proposalId (foundation for everything)
   ↓
4. Call /api/proposals/[proposalId]/portal (CLIENT PORTAL ROUTE)
   ↓
5. Display dashboard with proposals and deliverables
```

## What We Removed

### ❌ Removed References

1. **`app.ignitegrowth.biz` in `lib/api.js`**
   - Before: `baseURL: 'https://app.ignitegrowth.biz'`
   - After: `baseURL: ''` (relative URLs)

2. **`app.ignitegrowth.biz` in `app/activate/page.jsx`**
   - Before: `fetch('https://app.ignitegrowth.biz/api/activate')`
   - After: `fetch('/api/activate')` (local route)

3. **`app.ignitegrowth.biz` in `app/set-password/page.jsx`**
   - Before: `fetch('https://app.ignitegrowth.biz/api/set-password')`
   - After: `fetch('/api/set-password')` (local route)

4. **Environment Variables**
   - Removed: `NEXT_PUBLIC_API_URL`
   - Removed: `NEXT_PUBLIC_MAIN_APP_URL`
   - Not needed - all routes are local

## Firebase Configuration

The client portal has its own Firebase client configuration in `/lib/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... same Firebase project as main app
};
```

**Important:** Same Firebase project, but client portal manages its own auth state.

## Server-Side Firebase Admin

The client portal has its own Firebase Admin setup in `/lib/firebaseAdmin.js`:

```javascript
// Used in API routes to verify Firebase tokens
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';

export async function GET(request) {
  const decodedToken = await verifyFirebaseToken(request);
  const firebaseUid = decodedToken.uid;
  // ... find contact by firebaseUid
}
```

**Why:** Server-side token verification for API routes.

## Session Management

See [CLIENT_PORTAL_SESSION.md](./CLIENT_PORTAL_SESSION.md) for detailed documentation on:
- `useClientPortalSession` hook
- Storage keys and data structures
- Proposal ID management (foundation for everything)
- Contact session hydration

## Deployment

### Separate Deployments

- **Main App:** `app.ignitegrowth.biz` (Vercel project: `ignitebd-next-combine`)
- **Client Portal:** `clientportal.ignitegrowth.biz` (Vercel project: `ignitebd-clientportal`)

### Shared Environment Variables

Both apps need:
- `DATABASE_URL` - PostgreSQL connection string
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin credentials
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client config

### Client Portal Only

- `JWT_SECRET` - For JWT tokens (if using legacy auth)
- No `NEXT_PUBLIC_API_URL` - Not needed (all routes local)

## Common Mistakes to Avoid

### ❌ DON'T: Call Main App API

```javascript
// ❌ WRONG
const response = await fetch('https://app.ignitegrowth.biz/api/contacts');
```

### ✅ DO: Call Local API

```javascript
// ✅ CORRECT
const response = await api.get('/api/contacts/by-firebase-uid');
```

### ❌ DON'T: Set External baseURL

```javascript
// ❌ WRONG
const api = axios.create({
  baseURL: 'https://app.ignitegrowth.biz',
});
```

### ✅ DO: Use Relative URLs

```javascript
// ✅ CORRECT
const api = axios.create({
  baseURL: '', // Relative URLs
});
```

### ❌ DON'T: Mix Origins

```javascript
// ❌ WRONG
if (isClientPortal) {
  baseURL = 'https://clientportal.ignitegrowth.biz';
} else {
  baseURL = 'https://app.ignitegrowth.biz';
}
```

### ✅ DO: Always Use Current Origin

```javascript
// ✅ CORRECT
config.baseURL = window.location.origin; // Always current origin
```

## Testing

### Local Development

```bash
# Client portal runs on localhost:3000
npm run dev

# All API calls go to localhost:3000/api/*
# No CORS issues - same origin
```

### Production

```bash
# Client portal deployed to clientportal.ignitegrowth.biz
# All API calls go to clientportal.ignitegrowth.biz/api/*
# No CORS issues - same origin
```

## Troubleshooting

### "CORS Error" or "Network Error"

**Cause:** Calling external API instead of local route.

**Fix:** Check that you're using `/api/*` (relative URL) not `https://app.ignitegrowth.biz/api/*`.

### "500 Internal Server Error" on API Route

**Cause:** API route doesn't exist in client portal.

**Fix:** Create the route in `/app/api/*` or check if it exists.

### "Firebase Admin not initialized"

**Cause:** Missing `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable.

**Fix:** Add Firebase Admin service account key to Vercel environment variables.

## Summary

**The client portal is self-contained:**
- ✅ Own API routes (`/app/api/*`)
- ✅ Own frontend (`/app/*`)
- ✅ Own deployment (separate Vercel project)
- ✅ Shared database (via Prisma)
- ✅ Shared Firebase project (for auth)
- ✅ **100% Standalone** - Once `firebaseUid` exists in DB, no main app needed
- ❌ NO external API calls
- ❌ NO CORS configuration needed
- ❌ NO cross-origin requests

**Result:** Simpler, more secure, easier to maintain, zero CORS issues.

**The Key:** The `firebaseUid` field in the `Contact` table is the **only connection** needed. Once it's set (by main app during contact creation), the client portal operates completely independently. No ongoing communication between apps required!

