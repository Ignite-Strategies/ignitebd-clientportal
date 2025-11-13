# Universal Contact Personhood

## Overview

**Universal Personhood** is the architectural principle that a single Firebase UID represents a user across all applications in the Ignite ecosystem. One person = One Firebase UID = One Contact record = Access everywhere.

## Core Concept

```
One Person
    ↓
One Firebase UID (Universal Identifier)
    ↓
One Contact Record (in Database)
    ↓
Access to All Applications
```

**Key Principle:** A person is a person, regardless of which app they're using. Their identity is universal.

## The Bridge: `firebaseUid` Field

The `firebaseUid` field in the `Contact` table is the **bridge** between Firebase Authentication and your Contact record.

```prisma
model Contact {
  id          String   @id @default(cuid())
  firebaseUid String? @unique // THE BRIDGE - Universal identifier
  email       String?
  firstName   String?
  lastName    String?
  // ... other fields
}
```

**How it works:**
1. Main app creates contact → Creates Firebase user → Stores `firebaseUid` in `Contact.firebaseUid`
2. Client portal authenticates → Gets Firebase UID → Looks up contact by `firebaseUid`
3. **That's it!** Same person, same identity, different apps

## Architecture

### The Universal Identity Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Main App (app.ignitegrowth.biz)           │
│                                                             │
│  1. Create Contact                                          │
│  2. Create Firebase User                                    │
│  3. Store firebaseUid in Contact.firebaseUid                │
│                                                             │
│  Contact {                                                  │
│    id: "contact-123"                                        │
│    firebaseUid: "firebase-abc-xyz"  ← THE BRIDGE           │
│    email: "john@example.com"                               │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Shared Database
                              │ (PostgreSQL)
                              │
┌─────────────────────────────┴─────────────────────────────┐
│              Client Portal (clientportal.ignitegrowth.biz) │
│                                                           │
│  1. User logs in with Firebase                           │
│  2. Get Firebase UID from token                          │
│  3. Look up Contact by firebaseUid                        │
│                                                           │
│  Firebase Auth → firebaseUid: "firebase-abc-xyz"          │
│       ↓                                                   │
│  Database Query: Contact.findUnique({                     │
│    where: { firebaseUid: "firebase-abc-xyz" }            │
│  })                                                       │
│       ↓                                                   │
│  Found: Contact { id: "contact-123", ... }               │
│                                                           │
│  ✅ Same person, same identity, different app            │
└───────────────────────────────────────────────────────────┘
```

## Why This Matters

### 1. **Single Source of Truth**
- Contact data lives in ONE place (database)
- Firebase UID is the universal identifier
- No duplicate user records
- No sync issues between apps

### 2. **Seamless Cross-App Experience**
- User logs into main app → sees their data
- Same user logs into client portal → sees their proposals
- **Same person, same identity, different context**

### 3. **Simplified Authentication**
- One Firebase user = One Contact
- No need to create separate accounts
- No password management per app
- Firebase handles all auth complexity

### 4. **Future-Proof**
- Add new apps? Just use `firebaseUid` to find the contact
- No need to create new user records
- No need to sync data
- Just query by `firebaseUid`

## The Contact Record

### Required Fields for Universal Personhood

```prisma
model Contact {
  // Identity
  id          String   @id @default(cuid())
  firebaseUid String?  @unique // THE BRIDGE - Universal identifier
  
  // Personal Info
  email       String?  @unique
  firstName   String?
  lastName    String?
  
  // Context (varies by app)
  crmId       String  // Which CompanyHQ they belong to (tenant)
  role        String  @default("contact") // "contact" | "owner"
  
  // Activation
  isActivated Boolean @default(false)
  
  // Relations
  contactCompany Company? // Company they work for
  // ... other relations
}
```

### The Critical Field: `firebaseUid`

**Without `firebaseUid`:**
- ❌ Can't find contact from Firebase Auth
- ❌ Can't link Firebase user to database record
- ❌ No universal personhood

**With `firebaseUid`:**
- ✅ Firebase Auth → Database lookup works
- ✅ Universal identity across apps
- ✅ Single source of truth

## Implementation

### Step 1: Main App Creates Contact

```javascript
// Main app: Create contact and Firebase user
const contact = await prisma.contact.create({
  data: {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    crmId: companyHQId,
    // ... other fields
  },
});

// Create Firebase user
const firebaseUser = await admin.auth().createUser({
  email: 'john@example.com',
  password: 'temporary-password',
});

// THE CRITICAL STEP: Store firebaseUid
await prisma.contact.update({
  where: { id: contact.id },
  data: {
    firebaseUid: firebaseUser.uid, // THE BRIDGE
  },
});
```

### Step 2: Client Portal Looks Up Contact

```javascript
// Client portal: User logs in with Firebase
const result = await signInWithEmailAndPassword(auth, email, password);
const firebaseUid = result.user.uid;

// Look up contact by firebaseUid (THE BRIDGE)
const contact = await prisma.contact.findUnique({
  where: { firebaseUid }, // Universal lookup
});

// ✅ Found the same person!
```

## The Magic: Once `firebaseUid` Exists

**Once `firebaseUid` is set in the database, the client portal is 100% standalone!**

### What This Means:

1. **No Ongoing Communication Needed**
   - Main app sets `firebaseUid` once (during contact creation)
   - Client portal uses it forever
   - No API calls between apps needed

2. **Independent Operation**
   - Client portal queries database directly
   - Uses `firebaseUid` to find contact
   - No dependency on main app after initial setup

3. **Scalability**
   - Add more apps? Just use `firebaseUid`
   - No need to sync data
   - No need for inter-app communication

## Use Cases

### Use Case 1: Main App → Client Portal

```
Main App:
  1. Create contact "John Doe"
  2. Create Firebase user
  3. Store firebaseUid: "abc-123" in Contact

Client Portal:
  1. John logs in with Firebase
  2. Gets firebaseUid: "abc-123"
  3. Looks up Contact by firebaseUid
  4. ✅ Found John Doe - same person!
```

### Use Case 2: Cross-App Data Access

```
Main App:
  - John sees his contacts, proposals, etc.
  - All linked to Contact.id = "contact-123"

Client Portal:
  - John sees his proposals, deliverables
  - Same Contact.id = "contact-123"
  - Same person, different context
```

### Use Case 3: Future Apps

```
New App (e.g., Mobile App):
  1. User logs in with Firebase
  2. Gets firebaseUid: "abc-123"
  3. Looks up Contact by firebaseUid
  4. ✅ Same person, new app!
```

## Data Flow

### Initial Setup (One-Time)

```
Main App:
  Create Contact
    ↓
  Create Firebase User
    ↓
  Store firebaseUid in Contact
    ↓
  ✅ Bridge established
```

### Ongoing Operation (Every Login)

```
Any App:
  User logs in with Firebase
    ↓
  Get firebaseUid from token
    ↓
  Query: Contact.findUnique({ where: { firebaseUid } })
    ↓
  ✅ Found contact - universal personhood!
```

## The `firebaseUid` Field

### Schema Definition

```prisma
model Contact {
  firebaseUid String? @unique // Universal identifier
  
  @@index([firebaseUid]) // Fast lookups
}
```

### Properties

- **Unique** - One Firebase UID = One Contact
- **Nullable** - Contacts can exist without Firebase (before activation)
- **Indexed** - Fast lookups by `firebaseUid`
- **Universal** - Works across all apps

### When It's Set

1. **During Contact Creation** (Main App)
   - Contact created → Firebase user created → `firebaseUid` stored

2. **During Activation** (Client Portal)
   - User activates via invite link → Firebase user created → `firebaseUid` stored

3. **Never Changes**
   - Once set, `firebaseUid` is permanent
   - It's the universal identifier forever

## Querying by `firebaseUid`

### Client Portal Pattern

```javascript
// Step 1: Verify Firebase token
const decodedToken = await verifyFirebaseToken(request);
const firebaseUid = decodedToken.uid;

// Step 2: Find contact by firebaseUid (THE BRIDGE)
const contact = await prisma.contact.findUnique({
  where: { firebaseUid },
});

// Step 3: Use contact data
if (!contact) {
  return error('Contact not found');
}

// ✅ Same person, universal identity!
```

### Main App Pattern

```javascript
// When creating contact, always set firebaseUid
const firebaseUser = await admin.auth().createUser({...});
await prisma.contact.update({
  where: { id: contactId },
  data: { firebaseUid: firebaseUser.uid },
});
```

## Benefits

### 1. **Simplicity**
- One identifier (`firebaseUid`) for everything
- No complex user management
- No sync between apps

### 2. **Security**
- Firebase handles authentication
- Token verification is standard
- No custom auth logic needed

### 3. **Scalability**
- Add new apps easily
- Just use `firebaseUid` lookup
- No architectural changes needed

### 4. **Maintainability**
- Single source of truth (database)
- No duplicate user records
- Clear data model

## Common Patterns

### Pattern 1: Find Contact by Firebase UID

```javascript
// Universal pattern across all apps
const contact = await prisma.contact.findUnique({
  where: { firebaseUid },
});
```

### Pattern 2: Check if Contact Exists

```javascript
// Before creating Firebase user, check if contact exists
const existingContact = await prisma.contact.findUnique({
  where: { firebaseUid },
});

if (existingContact) {
  // Contact already has Firebase account
  return existingContact;
}
```

### Pattern 3: Link Firebase User to Contact

```javascript
// After creating Firebase user, link to contact
await prisma.contact.update({
  where: { id: contactId },
  data: { firebaseUid: firebaseUser.uid },
});
```

## Troubleshooting

### "Contact not found" Error

**Cause:** `firebaseUid` not set in database.

**Fix:**
1. Check if contact has `firebaseUid` in database
2. If not, set it during contact creation/activation
3. Ensure Firebase user was created

### "firebaseUid is null" Error

**Cause:** Contact exists but `firebaseUid` is null.

**Fix:**
1. Create Firebase user for contact
2. Update contact with `firebaseUid`
3. Retry lookup

### "Multiple contacts with same firebaseUid"

**Cause:** Database constraint violation (should be unique).

**Fix:**
1. Check database for duplicates
2. Ensure `@unique` constraint is enforced
3. Clean up duplicate records

## Best Practices

### 1. **Always Set `firebaseUid` When Creating Firebase User**

```javascript
// ✅ GOOD
const firebaseUser = await admin.auth().createUser({...});
await prisma.contact.update({
  where: { id: contactId },
  data: { firebaseUid: firebaseUser.uid },
});

// ❌ BAD - Forgot to set firebaseUid
const firebaseUser = await admin.auth().createUser({...});
// Missing: Update contact with firebaseUid
```

### 2. **Use `firebaseUid` for All Lookups**

```javascript
// ✅ GOOD - Universal lookup
const contact = await prisma.contact.findUnique({
  where: { firebaseUid },
});

// ❌ BAD - Email lookup (not universal)
const contact = await prisma.contact.findFirst({
  where: { email },
});
```

### 3. **Never Change `firebaseUid`**

```javascript
// ✅ GOOD - Set once, never change
await prisma.contact.update({
  where: { id: contactId },
  data: { firebaseUid: firebaseUser.uid },
});

// ❌ BAD - Changing firebaseUid breaks universal personhood
await prisma.contact.update({
  where: { id: contactId },
  data: { firebaseUid: newUid }, // Don't do this!
});
```

## Summary

**Universal Personhood = One Firebase UID = One Contact = Access Everywhere**

**The Bridge:** `firebaseUid` field in `Contact` table

**The Flow:**
1. Main app creates contact → Sets `firebaseUid`
2. Client portal authenticates → Looks up by `firebaseUid`
3. ✅ Same person, universal identity

**Key Point:** Once `firebaseUid` exists in the database, the client portal (and any future apps) can operate completely independently. No ongoing communication between apps needed - just query by `firebaseUid`!

