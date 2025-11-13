# Client Portal Activation & Login Flow

## Overview

The client portal has **two entry points**:
1. **Activation Flow** - First-time setup via invite link
2. **Login Flow** - Regular login after activation (the "front door")

## Activation Flow (First-Time Setup)

### Step 1: Invite Link
User receives invite link with token:
```
https://clientportal.ignitegrowth.biz/activate?token=abc123
```

### Step 2: Activate Account
- Route: `/activate`
- Calls: `/api/activate` (client portal route)
- What happens:
  - Validates invite token
  - Creates/links Firebase user
  - Stores `firebaseUid` in `Contact.firebaseUid`
  - Returns `uid`, `email`, `contactId`

### Step 3: Set Password
- Route: `/set-password?uid=...&email=...&contactId=...`
- Calls: `/api/set-password` (client portal route)
- What happens:
  - Sets Firebase password (via Firebase Admin)
  - User can now login with email/password
- Redirects to: `/login?activated=true`

### Step 4: Login (Front Door)
- Route: `/login?activated=true`
- User enters email and password
- Uses Firebase Auth (`signInWithEmailAndPassword`)
- Gets Firebase token
- Calls `/api/contacts/by-firebase-uid` to get contact
- Redirects to `/welcome`

## Login Flow (Regular Access - The "Front Door")

**Once password is set, users can ALWAYS go through the login page!**

### The Flow:
```
1. User goes to /login (or /splash which routes to /login)
   ↓
2. User enters email and password
   ↓
3. Firebase Auth authenticates (signInWithEmailAndPassword)
   ↓
4. Get Firebase token
   ↓
5. Call /api/contacts/by-firebase-uid (find contact by firebaseUid)
   ↓
6. Store contact session
   ↓
7. Redirect to /welcome (Step 1: Contact hydration)
   ↓
8. Redirect to /dashboard (Step 2: Company/Proposals hydration)
```

**Key Point:** After activation, the login page is the **primary entry point**. Users don't need invite links anymore - they can just login with email/password.

## Splash Page Behavior

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

## Why Splash Routes to Welcome Instead of Login

If you're seeing splash route to welcome, it means:
1. **You're already logged in via Firebase** - Firebase session is still active
2. **This is correct** - No need to login again, go straight to welcome

**To test the login flow:**
1. Logout (clear Firebase session)
2. Go to `/splash` or `/login`
3. Enter email/password
4. Should go through login → welcome → dashboard

## The "Front Door" Concept

**After password is set, the login page IS the front door!**

- ✅ Users can bookmark `/login`
- ✅ Users can go directly to `/login`
- ✅ No invite link needed after first activation
- ✅ Standard email/password login

**The activation flow is ONE-TIME:**
- First time: Invite link → Activate → Set Password → Login
- Every time after: Just login with email/password

## Authentication Methods

### Current: Firebase Auth (Email/Password)
- Primary method
- Uses `signInWithEmailAndPassword`
- Token verified server-side via Firebase Admin
- Contact looked up by `firebaseUid`

### Legacy: JWT (Deprecated)
- Old method using `/api/auth/login`
- Stores password hash in `Contact.notes.clientPortalAuth.passwordHash`
- Still exists but not recommended
- Firebase Auth is the standard

## Flow Diagram

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
/api/contacts/by-firebase-uid (find contact)
    ↓
/welcome → /dashboard

┌─────────────────────────────────────────────────────────────┐
│                    Regular Login (Front Door)                │
└─────────────────────────────────────────────────────────────┘

/login (or /splash → /login)
    ↓
Firebase Auth (signInWithEmailAndPassword)
    ↓
/api/contacts/by-firebase-uid (find contact)
    ↓
/welcome → /dashboard
```

## Common Questions

### Q: Can I login after setting password?
**A: YES!** Once password is set, you can always login via `/login` with email/password.

### Q: Why does splash route to welcome?
**A:** Because you're already logged in. Splash checks Firebase auth state - if logged in, skip login and go to welcome.

### Q: Do I need invite link every time?
**A: NO!** Invite link is only for first-time activation. After that, just use `/login`.

### Q: What if I forget my password?
**A:**
- Use Firebase's password reset (if implemented)
- Or contact admin to reset via main app
- Or use `/reset-password` route (if implemented)

### Q: Can I logout and login again?
**A: YES!** Logout clears Firebase session, then you can login again via `/login`.

## Testing the Flow

### Test Activation Flow:
1. Get invite link with token
2. Go to `/activate?token=...`
3. Should redirect to `/set-password`
4. Set password
5. Should redirect to `/login?activated=true`
6. Login with email/password
7. Should go to `/welcome` → `/dashboard`

### Test Regular Login:
1. Go to `/login` (or `/splash`)
2. Enter email and password
3. Should authenticate via Firebase
4. Should go to `/welcome` → `/dashboard`

### Test Splash Behavior:
1. **If logged in:** Go to `/splash` → Should go to `/welcome`
2. **If logged out:** Go to `/splash` → Should go to `/login`

## Summary

**The login page is the front door after activation:**
- ✅ One-time activation via invite link
- ✅ Regular login via `/login` with email/password
- ✅ Splash routes based on auth state (correct behavior)
- ✅ No invite link needed after first activation
- ✅ Standard authentication flow

**Key Point:** Once `firebaseUid` exists in the database and password is set, users can always login through the login page. The activation flow is just the one-time setup.

