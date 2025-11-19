# Client Portal Hydration Architecture

## Overview

This document outlines the hydration strategy for the Client Portal, showing what data is fetched at each stage, which models are involved, and what displays on each page.

**Key Principle:** Fetch IDs first, hydrate data only when needed.

---

## Hydration Flow

```
Welcome → Dashboard → WorkPackage Detail
  (IDs)    (Minimal)    (Full Hydration)
```

---

## 1. Welcome Page (`/welcome`)

### API Endpoint
`GET /api/client`

### Purpose
Initial contact hydration - get all IDs needed for session setup.

### Lookups
```javascript
// 1. Find Contact by Firebase UID
Contact.findUnique({
  where: { firebaseUid },
  select: {
    id, firstName, lastName, email, role, ownerId, crmId, isActivated,
    contactCompanyId,
    contactCompany: { id, companyName }
  }
})

// 2. Find WorkPackage ID (by contactId OR companyId)
WorkPackage.findFirst({
  where: {
    OR: [
      { contactId: contact.id },
      { companyId: contact.contactCompanyId } // Handles DB mismatch
    ]
  },
  select: { id: true },
  orderBy: { createdAt: 'desc' }
})
```

### Models Hydrated
- ✅ **Contact** (minimal: id, name, email, contactCompanyId)
- ✅ **Company** (minimal: id, companyName)
- ✅ **WorkPackage** (ID only: `workPackageId`)

### Data Stored in localStorage
```javascript
{
  clientPortalContactId: string,
  clientPortalContactCompanyId: string,
  clientPortalContactEmail: string,
  clientPortalWorkPackageId: string, // ID only
  firebaseId: string
}
```

### What Displays
- Welcome message with client name
- "See your project" button
- Redirects to dashboard after 1.5s

---

## 2. Dashboard Page (`/dashboard`)

### API Endpoint
`GET /api/client/work/dashboard?workPackageId={id}`

### Purpose
Get minimal dashboard data - stats, needs review items, current phase preview.

### Lookups
```javascript
// 1. Find Contact by Firebase UID (verify auth)
Contact.findUnique({
  where: { firebaseUid },
  select: { id, firstName, lastName, email, contactCompanyId }
})

// 2. Find WorkPackage (by ID from localStorage OR lookup)
WorkPackage.findFirst({
  where: {
    OR: [
      { id: workPackageId }, // If provided
      { contactId: contact.id }, // Fallback
      { companyId: contact.contactCompanyId } // Fallback (handles DB mismatch)
    ]
  },
  select: { id, title, description, prioritySummary, contactId, companyId }
})

// 3. Get all WorkPackageItems (for stats calculation)
WorkPackageItem.findMany({
  where: { workPackageId },
  select: {
    id, status, deliverableLabel, deliverableDescription,
    workPackagePhaseId,
    workCollateral: { id, status, reviewRequestedAt } // Minimal collateral data
  }
})

// 4. Get all WorkPackagePhases (for phase data)
WorkPackagePhase.findMany({
  where: { workPackageId },
  select: { id, name, description, position },
  orderBy: { position: 'asc' }
})
```

### Models Hydrated
- ✅ **Contact** (minimal: id, name, email)
- ✅ **WorkPackage** (minimal: id, title, description, prioritySummary)
- ✅ **WorkPackageItem** (minimal: id, status, label, workCollateral status only)
- ✅ **WorkPackagePhase** (minimal: id, name, description, position)
- ❌ **No artifact content** (only status from WorkCollateral)

### Data Returned
```javascript
{
  success: true,
  workPackageId: string,
  workPackage: {
    id, title, description, prioritySummary
  },
  stats: {
    total: number,
    completed: number,
    inProgress: number,
    needsReview: number,
    notStarted: number
  },
  needsReviewItems: WorkPackageItem[], // Only items needing review
  currentPhase: {
    id, name, description, position,
    items: WorkPackageItem[] // Only current phase items
  },
  nextPhase: {
    id, name, description, position // No items
  },
  currentPhaseIndex: number,
  contact: { id, firstName, lastName, email }
}
```

### What Displays
- Work package title and description
- Stats cards (Total, Completed, In Progress, Needs Review)
- Big CTA button (e.g., "Review 3 Items")
- Priority summary
- "Needs Your Review" section (only items needing review)
- Current phase preview (only current phase items)
- Next phase preview (metadata only)

---

## 3. WorkPackage Detail Page (`/client/work/[workPackageId]`)

### API Endpoint
`GET /api/client/work?workPackageId={id}&minimal={false}`

### Purpose
Full hydration - all phases, all items, all artifacts with content.

### Lookups
```javascript
// 1. Find Contact by Firebase UID (verify auth)
Contact.findUnique({
  where: { firebaseUid },
  select: { id, firstName, lastName, email, contactCompanyId }
})

// 2. Find WorkPackage with full relations
WorkPackage.findUnique({
  where: { id: workPackageId },
  include: {
    contact: { id, firstName, lastName, email },
    company: { id, companyName },
    phases: {
      include: {
        items: {
          include: {
            workCollateral: true // Full collateral data
          }
        }
      },
      orderBy: { position: 'asc' }
    },
    items: {
      include: {
        workCollateral: true
      }
    }
  }
})

// 3. Hydrate artifacts from WorkCollateral (batch fetch)
// For each WorkCollateral, fetch the actual artifact:
// - Blog.findMany({ where: { id: { in: blogIds } } })
// - Persona.findMany({ where: { id: { in: personaIds } } })
// - CleDeck.findMany({ where: { id: { in: deckIds } } })
// - Template.findMany({ where: { id: { in: templateIds } } })
// - LandingPage.findMany({ where: { id: { in: pageIds } } })
```

### Models Hydrated
- ✅ **Contact** (full: id, name, email, company)
- ✅ **Company** (full: id, companyName)
- ✅ **WorkPackage** (full: all fields)
- ✅ **WorkPackagePhase** (full: all fields + items)
- ✅ **WorkPackageItem** (full: all fields + collateral)
- ✅ **WorkCollateral** (full: all fields)
- ✅ **Blog** (full content - if published or owner view)
- ✅ **Persona** (full content - if published or owner view)
- ✅ **CleDeck** (full content - if published or owner view)
- ✅ **Template** (full content - if published or owner view)
- ✅ **LandingPage** (full content - if published or owner view)

### Data Returned
```javascript
{
  success: true,
  workPackage: {
    id, title, description, prioritySummary, totalCost, effectiveStartDate,
    contact: { id, firstName, lastName, email },
    company: { id, companyName },
    phases: [
      {
        id, name, description, position,
        items: [
          {
            id, deliverableType, deliverableLabel, deliverableDescription,
            quantity, unitOfMeasure, estimatedHoursEach, status,
            workCollateral: [
              {
                id, collateralType, collateralRefId, status,
                artifact: Blog | Persona | CleDeck | Template | LandingPage // Full content
              }
            ]
          }
        ]
      }
    ],
    items: [...] // Top-level items (if any)
  }
}
```

### What Displays
- Full work package header
- All phases with all items
- Full artifact content (when clicking items)
- Progress tracking
- Timeline (if owner view)

---

## Database Models & Relationships

### Core Models

#### Contact
```prisma
model Contact {
  id               String
  firebaseUid      String? @unique
  firstName        String?
  lastName         String?
  email            String?
  contactCompanyId String? // Links to Company
  crmId            String  // Links to CompanyHQ (tenant)
  workPackages     WorkPackage[]
}
```

#### Company
```prisma
model Company {
  id          String
  companyName String
  workPackages WorkPackage[]
}
```

#### WorkPackage
```prisma
model WorkPackage {
  id          String
  contactId   String  // Required - links to Contact
  companyId   String? // Optional - links to Company (DB mismatch: should be contactCompanyId)
  title       String
  description String?
  prioritySummary String?
  phases      WorkPackagePhase[]
  items       WorkPackageItem[]
}
```

#### WorkPackagePhase
```prisma
model WorkPackagePhase {
  id            String
  workPackageId String
  name          String
  position      Int
  description   String?
  items         WorkPackageItem[]
}
```

#### WorkPackageItem
```prisma
model WorkPackageItem {
  id                 String
  workPackageId      String
  workPackagePhaseId String
  deliverableType     String
  deliverableLabel    String
  deliverableDescription String?
  quantity           Int
  estimatedHoursEach  Int
  status             String
  workCollateral      WorkCollateral[]
}
```

#### WorkCollateral
```prisma
model WorkCollateral {
  id                String
  workPackageItemId String
  collateralType    String // "blog" | "persona" | "deck" | "template" | "page"
  collateralRefId   String // FK to Blog.id, Persona.id, etc.
  status            String
  reviewRequestedAt DateTime?
}
```

#### Artifact Models
```prisma
model Blog {
  id        String
  title     String
  content   Json
  published Boolean
  // ... other fields
}

model Persona {
  id        String
  name      String
  content   Json
  published Boolean
  // ... other fields
}

model CleDeck {
  id        String
  title     String
  content   Json
  published Boolean
  // ... other fields
}

model Template {
  id        String
  title     String
  content   Json
  published Boolean
  // ... other fields
}

model LandingPage {
  id        String
  title     String
  content   Json
  published Boolean
  // ... other fields
}
```

---

## Relationship Lookup Strategy

### WorkPackage Lookup (Handles DB Mismatch)

**Problem:** WorkPackage has `companyId` but should match `Contact.contactCompanyId`

**Solution:** Check both relationships
```javascript
where: {
  OR: [
    { contactId: contact.id },                    // Direct relationship
    { companyId: contact.contactCompanyId }       // Company relationship (handles mismatch)
  ]
}
```

This ensures work packages are found whether they're linked via:
- Direct contact relationship (`contactId`)
- Company relationship (`companyId` = `contact.contactCompanyId`)

---

## Performance Considerations

### Welcome Page
- ✅ **Fast:** Only ID lookups, no joins
- ✅ **Minimal data:** Contact + Company metadata only
- ✅ **Single query:** WorkPackage ID lookup is simple

### Dashboard Page
- ✅ **Optimized:** Only fetches items/phases needed for stats
- ✅ **No artifact content:** Only status from WorkCollateral
- ✅ **Filtered items:** Only needsReviewItems + currentPhase items

### WorkPackage Detail Page
- ⚠️ **Heavy:** Full hydration with all artifacts
- ⚠️ **N+1 Problem:** Currently fetches artifacts individually (needs batch fetch fix)
- ✅ **On-demand:** Only loads when user navigates to detail page

---

## Future Optimizations

1. **Batch Artifact Fetching**
   - Collect all `collateralRefId` by type
   - Batch fetch: `Blog.findMany({ where: { id: { in: blogIds } } })`
   - Reduces 20+ queries to 5-6 queries

2. **Caching**
   - Cache dashboard stats (5 min TTL)
   - Invalidate on WorkPackageItem/WorkCollateral updates

3. **Computed Fields**
   - Store `WorkPackagePhase.totalEstimatedHours` in DB
   - Store `WorkPackageItem.progressCompleted` in DB
   - Update via Prisma hooks

4. **Minimal Artifact Data**
   - Dashboard: Return artifact IDs only, not full content
   - Detail: Fetch full content on-demand when clicking

---

## Error Handling

### Welcome Page
- If contact not found → Redirect to `/login`
- If workPackageId not found → Continue (will show "We apologize" message on dashboard)

### Dashboard Page
- If workPackage not found → Show "We apologize for the issue. Someone will be in touch shortly."
- If unauthorized → Return 403

### WorkPackage Detail Page
- If workPackage not found → 404
- If unauthorized → 403
- If artifact fetch fails → Log warning, continue without artifact

---

## Summary

| Page | Data Fetched | Models | Purpose |
|------|-------------|--------|---------|
| **Welcome** | IDs only | Contact, Company, WorkPackage (ID) | Session setup |
| **Dashboard** | Minimal stats | WorkPackage (minimal), Items (status only), Phases (metadata) | Overview |
| **WorkPackage Detail** | Full hydration | All models + Artifact content | Full view |

**Key Principle:** Fetch IDs first, hydrate only when needed.

