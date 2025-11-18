# Client Portal Architecture

## Premise

**Get the user (the client) to see their proposed work/workpackage once contract is approved.**

The client portal is a separate Next.js application that shares the same PostgreSQL database as IgniteBD. When a contract is approved in IgniteBD, the client can view their work packages, deliverables, and artifacts in the client portal.

---

## Shared Database

Both IgniteBD and the Client Portal use the same Prisma schema and PostgreSQL database. This means:
- No API calls between apps needed
- Direct database access via Prisma
- Data consistency guaranteed
- Single source of truth

---

## Database Models & IDs (What We Actually Hit)

### Core Models

**Contact** (`contactId`)
- `id` - Contact ID (primary key)
- `firebaseUid` - Firebase Auth UID (unique, indexed) - **Bridge to authentication**
- `email` - Login email (unique)
- `firstName`, `lastName` - Display name
- `contactCompanyId` - **Link to Company** (the client's company)
- Relations:
  - `workPackages` - WorkPackage[] (work packages for this contact)
  - `contactCompany` - Company (the company they work for)

**Company** (`contactCompanyId`)
- `id` - Company ID (primary key)
- `companyName` - Company name
- `companyHQId` - Link to CompanyHQ (tenant boundary - for IgniteBD only)
- Relations:
  - `contacts` - Contact[] (contacts at this company)
  - `workPackages` - WorkPackage[] (work packages for this company)
  - `proposals` - Proposal[] (proposals for this company)

**WorkPackage** (`workPackageId`)
- `id` - WorkPackage ID (primary key)
- `contactId` - Link to Contact (the client)
- `companyId` - Link to Company (optional - scoped to company)
- `title` - Work package title
- `description` - Work package description
- `totalCost` - Total cost from proposal
- `effectiveStartDate` - Timeline start date
- Relations:
  - `contact` - Contact (the client)
  - `company` - Company (the client's company)
  - `phases` - WorkPackagePhase[] (phases within the package)
  - `items` - WorkPackageItem[] (deliverables within the package)

**WorkPackagePhase** (`workPackagePhaseId`)
- `id` - Phase ID (primary key)
- `workPackageId` - Link to WorkPackage
- `name` - Phase name
- `position` - Phase order/position
- `description` - Phase description
- `phaseTotalDuration` - Normalized business days
- `totalEstimatedHours` - Computed aggregate from items
- Relations:
  - `workPackage` - WorkPackage
  - `items` - WorkPackageItem[] (items in this phase)

**WorkPackageItem** (`workPackageItemId`)
- `id` - Item ID (primary key)
- `workPackageId` - Link to WorkPackage
- `workPackagePhaseId` - Link to WorkPackagePhase
- `deliverableType` - Type (e.g., "persona", "blog", "template")
- `deliverableLabel` - Display name (e.g., "3 Personas")
- `deliverableDescription` - Description
- `quantity` - How many (e.g., 3)
- `unitOfMeasure` - Unit (e.g., "day", "week", "persona")
- `estimatedHoursEach` - Hours per unit
- `status` - "not_started" | "in_progress" | "completed"
- Relations:
  - `workPackage` - WorkPackage
  - `workPackagePhase` - WorkPackagePhase
  - `artifacts` - WorkArtifact[] (actual work content)

**WorkArtifact** (`workArtifactId`)
- `id` - Artifact ID (primary key)
- `workPackageItemId` - Link to WorkPackageItem
- `type` - "BLOG" | "PERSONA" | "CLE_DECK" | "TEMPLATE" | "LANDING_PAGE" | etc.
- `title` - Artifact title
- `contentJson` - Artifact content (JSON)
- `status` - "DRAFT" | "IN_REVIEW" | "APPROVED" | "COMPLETED"
- `reviewRequestedAt` - When review was requested
- `reviewCompletedAt` - When review was completed
- Relations:
  - `workPackageItem` - WorkPackageItem

**Invoice** (`invoiceId`)
- Invoice model exists in Prisma schema
- Fields:
  - `id` - Invoice ID (primary key)
  - `proposalId` - Link to Proposal
  - `invoiceNumber` - Human-readable invoice number (unique)
  - `amount` - Invoice amount (Float)
  - `currency` - Currency code (e.g., "USD", default: "USD")
  - `description` - Invoice description
  - `status` - "pending" | "paid" | "failed" | "refunded" (default: "pending")
  - `dueDate` - When payment is due
  - `paidAt` - When payment was completed
  - `stripeCheckoutSessionId` - Stripe checkout session ID (unique, for reconciliation)
  - `stripePaymentIntentId` - Stripe payment intent ID (unique)
  - `stripeCustomerId` - Stripe customer ID
  - `paidByContactId` - Contact ID who made the payment (from session metadata)
- Relations:
  - `proposal` - Proposal (via `proposalId`)

---

## API Routes (Surgical)

### 1. Contact Hydration

**Endpoint:** `GET /api/client`

**Purpose:** Get contact and `contactCompanyId` for session setup

**Query:**
```javascript
const contact = await prisma.contact.findUnique({
  where: { firebaseUid },
  select: {
    id: true,                    // contactId
    firstName: true,
    lastName: true,
    email: true,
    contactCompanyId: true,      // contactCompanyId
  },
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    contact: {
      id: "contact-123",           // contactId
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      contactCompanyId: "company-456"  // contactCompanyId
    }
  }
}
```

**Stores in localStorage:**
- `clientPortalContactId` - Contact ID
- `clientPortalContactCompanyId` - Company ID
- `clientPortalContactEmail` - Contact email
- `firebaseId` - Firebase UID

---

### 2. Work Package Hydration

**Endpoint:** `GET /api/client/work`

**Purpose:** Get Company with workPackages, then load WorkPackage with full structure

**Optional Query Param:** `?workPackageId={id}` - Load specific work package

**Queries:**

```javascript
// 1. Get Contact by firebaseUid
const contact = await prisma.contact.findUnique({
  where: { firebaseUid },
  select: {
    id: true,                    // contactId
    contactCompanyId: true,      // contactCompanyId
  },
});

// 2. Get Company with workPackages
const company = await prisma.company.findUnique({
  where: { id: contact.contactCompanyId },
  include: {
    workPackages: {
      select: {
        id: true,                // workPackageId
        title: true,
        description: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1, // Most recent
    },
  },
});

// 3. Extract workPackageId
const workPackageId = company?.workPackages?.[0]?.id || null;

// 4. Load WorkPackage with full structure
const workPackage = await prisma.workPackage.findUnique({
  where: { id: workPackageId },
  include: {
    contact: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    company: {
      select: {
        id: true,
        companyName: true,
      },
    },
    phases: {
      include: {
        items: {
          include: {
            artifacts: true,     // WorkArtifact[]
          },
        },
      },
      orderBy: { position: 'asc' },
    },
    items: {
      include: {
        artifacts: true,         // WorkArtifact[]
      },
      orderBy: { createdAt: 'asc' },
    },
  },
});
```

**Response:**
```javascript
{
  success: true,
  workPackage: {
    id: "wp-123",                // workPackageId
    title: "Q1 Content Package",
    description: "...",
    company: {
      id: "company-456",         // contactCompanyId
      companyName: "Acme Corp"
    },
    contact: {
      id: "contact-123",          // contactId
      firstName: "John",
      email: "john@example.com"
    },
    phases: [
      {
        id: "phase-789",          // workPackagePhaseId
        name: "Phase 1",
        items: [
          {
            id: "item-abc",       // workPackageItemId
            deliverableLabel: "3 Personas",
            artifacts: [
              {
                id: "artifact-xyz",  // workArtifactId
                type: "PERSONA",
                title: "Buyer Persona",
                status: "APPROVED"
              }
            ]
          }
        ]
      }
    ],
    items: [
      {
        id: "item-abc",           // workPackageItemId
        deliverableLabel: "3 Personas",
        artifacts: [
          {
            id: "artifact-xyz",   // workArtifactId
            type: "PERSONA",
            title: "Buyer Persona",
            status: "APPROVED"
          }
        ]
      }
    ]
  },
  workPackageId: "wp-123",
  company: {...},
  contact: {...}
}
```

**Stores in localStorage:**
- `clientPortalWorkPackageId` - WorkPackage ID

---

### 3. Work Artifact View

**Endpoint:** `GET /api/client/work/[artifactId]`

**Purpose:** Get single work artifact for viewing

**Query:**
```javascript
const artifact = await prisma.workArtifact.findUnique({
  where: { id: artifactId },
  include: {
    workPackageItem: {
      include: {
        workPackage: {
          include: {
            contact: {
              select: {
                id: true,        // Verify artifact belongs to contact
              },
            },
          },
        },
      },
    },
  },
});
```

**Response:**
```javascript
{
  success: true,
  artifact: {
    id: "artifact-xyz",           // workArtifactId
    type: "PERSONA",
    title: "Buyer Persona",
    contentJson: {...},
    status: "APPROVED",
    workPackageItem: {
      id: "item-abc",              // workPackageItemId
      deliverableLabel: "3 Personas",
      workPackage: {
        id: "wp-123",              // workPackageId
        contact: {
          id: "contact-123"        // contactId
        }
      }
    }
  }
}
```

---

### 4. Billing (Invoices)

**Endpoint:** `GET /api/client/billing`

**Purpose:** Get invoices for authenticated contact's company

**Query:**
```javascript
// Get contact's company
const contact = await prisma.contact.findUnique({
  where: { firebaseUid },
  select: {
    contactCompanyId: true,
  },
});

// Get invoices for company's proposals
const invoices = await prisma.invoice.findMany({
  where: {
    proposal: {
      companyId: contact.contactCompanyId,
    },
  },
  include: {
    proposal: {
      select: {
        id: true,
        title: true,
      },
    },
  },
  orderBy: { dueDate: 'asc' },
});
```

**Response:**
```javascript
{
  success: true,
  invoices: [
    {
      id: "invoice-123",          // invoiceId
      invoiceNumber: "INV-001",
      amount: 5000.00,
      currency: "USD",
      status: "pending",
      dueDate: "2025-02-01",
      proposal: {
        id: "proposal-456",
        title: "Q1 Engagement"
      }
    }
  ]
}
```

**Checkout Endpoint:** `POST /api/client/billing/[invoiceId]/checkout`
- Creates Stripe checkout session
- Architecture Pattern: Verify Firebase token → Get Contact by firebaseUid → Use contactCompanyId
- Verifies invoice belongs to contact's company (via `contactCompanyId`)
- Stores `contactId` in Stripe session metadata (who paid)
- Returns `clientSecret` for embedded checkout

**Verify Endpoint:** `GET /api/client/billing/[invoiceId]/verify/[sessionId]` (Fallback)
- Verifies payment status without webhook
- Architecture Pattern: Verify Firebase token → Get Contact by firebaseUid → Use contactCompanyId
- Updates invoice status if payment completed
- Returns `contactId` who paid

---

## ID Hierarchy

```
Contact (contactId)
  └── contactCompanyId → Company
      └── workPackages[] → WorkPackage (workPackageId)
          ├── phases[] → WorkPackagePhase (workPackagePhaseId)
          │   └── items[] → WorkPackageItem (workPackageItemId)
          │       └── artifacts[] → WorkArtifact (workArtifactId)
          └── items[] → WorkPackageItem (workPackageItemId)
              └── artifacts[] → WorkArtifact (workArtifactId)

Company (contactCompanyId)
  └── proposals[] → Proposal
      └── invoices[] → Invoice (invoiceId)
```

## Route Summary

| Route | Method | Purpose | Returns |
|-------|--------|---------|---------|
| `/api/client` | GET | Contact hydration | `contactId`, `contactCompanyId` |
| `/api/client/work` | GET | WorkPackage hydration | Full WorkPackage with phases, items, artifacts |
| `/api/client/work/[artifactId]` | GET | Single artifact view | WorkArtifact with content |
| `/api/client/billing` | GET | Invoice list | Array of invoices |
| `/api/client/billing/[invoiceId]/checkout` | POST | Create Stripe checkout | `clientSecret` for embedded checkout |
| `/api/client/billing/[invoiceId]/verify/[sessionId]` | GET | Verify payment (fallback) | Payment status + `contactId` who paid |

---

## Key Relationships

1. **Contact → Company**: `Contact.contactCompanyId` → `Company.id`
2. **Company → WorkPackage**: `Company.id` → `WorkPackage.companyId`
3. **WorkPackage → Phase**: `WorkPackage.id` → `WorkPackagePhase.workPackageId`
4. **WorkPackage → Item**: `WorkPackage.id` → `WorkPackageItem.workPackageId`
5. **Phase → Item**: `WorkPackagePhase.id` → `WorkPackageItem.workPackagePhaseId`
6. **Item → Artifact**: `WorkPackageItem.id` → `WorkArtifact.workPackageItemId`
7. **Proposal → Invoice**: `Proposal.id` → `Invoice.proposalId`

---

## Authentication Flow

1. **IgniteBD creates Contact** with `firebaseUid` stored in `Contact.firebaseUid`
2. **Client Portal authenticates** via Firebase Auth (client-side)
3. **Client Portal API verifies** Firebase token (server-side)
4. **Client Portal looks up Contact** by `firebaseUid`
5. **Client Portal uses `contactCompanyId`** to get Company and WorkPackages

---

## What We DON'T Use

- **`crmId`** - Tenant boundary (for IgniteBD only, not client portal)
- **`companyHQId`** - Tenant boundary (for IgniteBD only, not client portal)
- **`Collateral` model** - Deprecated, replaced by `WorkArtifact`

---

**Last Updated**: January 2025  
**Focus**: Deep architecture - actual database models and IDs we hit  
**Database**: Shared PostgreSQL (same as IgniteBD)  
**Authentication**: Firebase UID → Contact lookup

