# Client Portal Dashboard Hydration & Status Mapping

## Overview

This document consolidates how the client portal dashboard hydrates data and displays it to users, with a focus on the **StatusMapperService** which is central to how statuses are determined and displayed.

---

## Dashboard Hydration Flow

### 1. API Endpoint: `/api/client/allitems`

**Location:** `app/api/client/allitems/route.js`

**Purpose:** Dashboard hydration - summary data only (minimal fields for performance)

**Flow:**
1. Verify Firebase token → Get `firebaseUid`
2. Get `workPackageId` from query params (from localStorage)
3. Get Contact by `firebaseUid`
4. Validate WorkPackage belongs to contact's company
5. Get all WorkPackageItems (minimal fields)
6. Get all WorkPackagePhases (with status)
7. Compute stats using StatusMapper
8. Determine current phase (first phase with `status !== 'completed'`)
9. Return dashboard data

**Response Structure:**
```javascript
{
  success: true,
  workPackageId: string,
  stats: {
    total: number,
    completed: number,
    inProgress: number,
    needsReview: number,
    notStarted: number
  },
  needsReviewItems: WorkPackageItem[], // Items needing review
  currentPhase: {
    id: string,
    name: string,
    description: string,
    position: number,
    status: string, // 'not_started' | 'in_progress' | 'completed'
    items: WorkPackageItem[] // Only current phase items
  },
  workPackage: {
    id: string,
    title: string,
    description: string,
    prioritySummary: string | null
  },
  contact: {
    id: string,
    firstName: string,
    lastName: string,
    email: string
  }
}
```

---

## StatusMapperService - Core Logic

**Location:** `lib/services/StatusMapperService.js`

**Purpose:** Single source of truth for mapping WorkPackageItem status to client-facing status

### Current Implementation (MVP1)

```javascript
const STATUS_MAP = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "Needs Review",
  CHANGES_NEEDED: "Changes Requested",
  CHANGES_IN_PROGRESS: "Changes Being Made",
  APPROVED: "Completed"
};

export function mapItemStatus(item, workCollateral = []) {
  // MVP1: Use item.status directly (owner manually updates via execution hub)
  // Future: Will incorporate WorkCollateral status logic
  return item.status?.toUpperCase() || "NOT_STARTED";
}
```

### Status Mapping Rules

**Current (MVP1):**
- Uses `item.status` directly from database
- Owner manually updates status via execution hub
- No automatic derivation from WorkCollateral

**Future (Planned):**
- Will incorporate WorkCollateral status
- Priority order:
  1. If any collateral has `CHANGES_IN_PROGRESS` → `CHANGES_IN_PROGRESS`
  2. If any collateral has `CHANGES_NEEDED` → `CHANGES_NEEDED`
  3. If any collateral has `IN_REVIEW` → `IN_REVIEW`
  4. If any collateral has `IN_PROGRESS` → `IN_PROGRESS`
  5. If all collateral are `APPROVED` → `APPROVED`
  6. Otherwise → `NOT_STARTED`

### Status Values (Canonical)

**Database Statuses:**
- `NOT_STARTED`
- `IN_PROGRESS`
- `IN_REVIEW`
- `CHANGES_NEEDED`
- `CHANGES_IN_PROGRESS`
- `APPROVED`

**Client-Facing Labels:**
- `NOT_STARTED` → "Not Started"
- `IN_PROGRESS` → "In Progress"
- `IN_REVIEW` → "Needs Review"
- `CHANGES_NEEDED` → "Changes Requested"
- `CHANGES_IN_PROGRESS` → "Changes Being Made"
- `APPROVED` → "Completed"

---

## Dashboard Stats Calculation

**Location:** `app/api/client/allitems/route.js` (lines 149-165)

**Logic:**
```javascript
const stats = {
  total: allItems.length,
  completed: 0,
  inProgress: 0,
  needsReview: 0,
  notStarted: 0,
};

allItems.forEach((item) => {
  const status = mapItemStatus(item, item.workCollateral || []);
  if (status === "APPROVED") stats.completed++;
  else if (status === "IN_PROGRESS") stats.inProgress++;
  else if (status === "IN_REVIEW") stats.needsReview++;
  else if (status === "CHANGES_NEEDED") stats.needsReview++; // Changes needed also needs review
  else stats.notStarted++;
});
```

**Key Points:**
- Uses `mapItemStatus()` for each item
- `CHANGES_NEEDED` counts as `needsReview` (client needs to review)
- Stats are computed server-side for performance

---

## Current Phase Determination

**Location:** `app/api/client/allitems/route.js` (lines 173-195)

**Logic:**
```javascript
// Get phases with status from database
const phasesWithStatus = await prisma.workPackagePhase.findMany({
  where: { workPackageId: workPackage.id },
  select: {
    id: true,
    name: true,
    description: true,
    position: true,
    status: true, // 'not_started' | 'in_progress' | 'completed'
  },
  orderBy: { position: 'asc' },
});

// Current phase = first phase that is not 'completed'
const currentPhase = phasesWithStatus.find(
  (phase) => phase.status !== 'completed'
) || null;
```

**Key Points:**
- Uses `phase.status` directly from database (not derived from items)
- First phase with `status !== 'completed'` is the current phase
- If all phases are completed, `currentPhase = null`
- Consistent with owner app hydration logic

---

## Needs Review Items

**Location:** `app/api/client/allitems/route.js` (lines 167-171)

**Logic:**
```javascript
const needsReviewItems = allItems.filter((item) => {
  const status = mapItemStatus(item, item.workCollateral || []);
  return status === "IN_REVIEW" || status === "CHANGES_NEEDED";
});
```

**Key Points:**
- Uses `mapItemStatus()` to determine if item needs review
- Includes both `IN_REVIEW` and `CHANGES_NEEDED` statuses
- Only items needing review are returned (for performance)

---

## Dashboard UI Components

### Dashboard Page

**Location:** `app/dashboard/page.jsx`

**Hydration Flow:**
1. Read `workPackageId` from localStorage
2. Call `/api/client/allitems?workPackageId={id}`
3. Store response in state:
   ```javascript
   setWorkPackage({
     ...wp,
     stats,
     needsReviewItems,
     items,
     phases: currentPhase ? [currentPhase] : [],
     _dashboardData: allItemsResponse.data,
   });
   ```

**UI Sections:**
1. **Stats Cards** - Uses `stats` from API
2. **Needs Review Section** - Uses `needsReviewItems` from API
3. **Current Phase Section** - Uses `currentPhase` from API
4. **Priority Summary** - Uses `workPackage.prioritySummary` from API

### StatusBadge Component

**Location:** `app/components/StatusBadge.jsx`

**Usage:**
```javascript
<StatusBadge status={mapItemStatus(item, item.workCollateral || [])} />
```

**Status Labels:**
- `NOT_STARTED` → "Not Started" (gray)
- `IN_PROGRESS` → "In Progress" (blue)
- `IN_REVIEW` → "Needs Review" (yellow)
- `CHANGES_NEEDED` → "Changes Requested" (red)
- `CHANGES_IN_PROGRESS` → "Changes Being Made" (purple)
- `APPROVED` → "Completed" (green)

---

## Data Flow Summary

```
Owner App (Execution Hub)
  ↓
Updates item.status via PATCH /api/workpackages/items/[itemId]
  ↓
Database: WorkPackageItem.status updated
  ↓
Client Portal Dashboard
  ↓
GET /api/client/allitems?workPackageId={id}
  ↓
StatusMapperService.mapItemStatus(item, workCollateral)
  ↓
Stats calculated, needsReviewItems filtered, currentPhase determined
  ↓
Dashboard UI displays status badges, stats, and current phase
```

---

## Key Files

### Backend (API Routes)
- `app/api/client/allitems/route.js` - Dashboard hydration endpoint
- `lib/services/StatusMapperService.js` - Status mapping logic

### Frontend (UI Components)
- `app/dashboard/page.jsx` - Dashboard page component
- `app/components/StatusBadge.jsx` - Status badge display
- `app/components/DeliverableItemCard.jsx` - Item card component

### Configuration
- `app/components/statusConfig.js` - Status labels and colors

---

## Current Phase Logic (Updated)

**Implementation:** Uses `phase.status` directly from database

**Rule:** Current phase = first phase with `status !== 'completed'`

**Auto-Start:** When a phase is marked `completed`, the next phase automatically starts (`status = 'in_progress'`, `actualStartDate = now`)

**No Archive:** Completed phases remain visible (no archival during active project)

---

## Related Documentation

- `HYDRATION_ARCHITECTURE.md` - Full hydration flow across all pages
- `CLIENT_PORTAL_ARCHITECTURE.md` - Overall client portal architecture
- `WORK_ARTIFACT_ARCHITECTURE.md` - Work artifact system (future)

---

**Last Updated:** January 2025  
**Focus:** Dashboard hydration and status mapping  
**Status:** MVP1 - Using item.status directly, future will incorporate WorkCollateral status

