# Client Portal - Context-Aware Hydration Architecture

## Overview

The client portal dashboard should dynamically hydrate and display content based on the current "stage" or context the user is viewing. This creates a more focused, contextual experience.

## Core Concept

**The page refreshes/hydrates based on what the user is viewing:**
- **Proposal Context** → Hydrate proposal data → Show proposal view
- **Foundational Work Context** → Hydrate deliverables → Show foundational work view
- **Timeline Context** → Hydrate milestones → Show timeline view

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  [CompanyName]                    [Nav: Foundational] │
│  (Top Left)                      [Nav: Proposals]      │
│                                 [Nav: Timeline]         │
│                                 [Nav: Settings]         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Dynamic Content Area - Hydrates Based on Context]    │
│                                                         │
│  - If "Proposals" selected → Show proposal view       │
│  - If "Foundational Work" → Show deliverables view    │
│  - If "Timeline" → Show milestone timeline            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Context Types

### 1. Proposal Context
**When:** User clicks "Proposals" or navigates to proposal view
**Hydrates:**
- Proposal details (purpose, phases, compensation)
- Service instances
- Milestones
- Status

**API Endpoint:** `/api/proposals/[proposalId]/portal`

### 2. Foundational Work Context
**When:** User clicks "Foundational Work" or deliverables view
**Hydrates:**
- All deliverables for the contact
- Deliverable status (pending, in-progress, completed)
- Due dates
- Linked proposals

**API Endpoint:** `/api/contacts/[contactId]/deliverables` (needs to be created)

### 3. Timeline Context
**When:** User clicks "Timeline"
**Hydrates:**
- All milestones from all proposals
- Chronological timeline
- Phase progression

**API Endpoint:** `/api/contacts/[contactId]/timeline` (needs to be created)

## Current State vs. Proposed State

### Current (Static Dashboard)
```
Dashboard loads → Hydrates everything → Shows all data at once
```

### Proposed (Context-Aware)
```
Dashboard loads → Shows CompanyName + Nav
User clicks "Proposals" → Hydrates proposal data → Shows proposal view
User clicks "Foundational Work" → Hydrates deliverables → Shows deliverables view
```

## Implementation Approach

### Option 1: Single Page with Context Switching (Recommended)
**One dashboard page that switches content based on URL param or state:**

```javascript
/dashboard?context=proposals&proposalId=xyz
/dashboard?context=foundational
/dashboard?context=timeline
```

**Pros:**
- Single page to maintain
- Smooth transitions
- Shared header/nav
- Easy to add new contexts

**Cons:**
- More complex state management
- Need to handle loading states per context

### Option 2: Separate Routes
**Different routes for each context:**

```
/dashboard/proposals/[proposalId]
/dashboard/foundational
/dashboard/timeline
```

**Pros:**
- Clear separation
- Easy to bookmark
- Simpler per-page logic

**Cons:**
- More files to maintain
- Header/nav duplication

## Recommended: Option 1 (Context Switching)

### Architecture

```javascript
// Dashboard component structure
<DashboardLayout>
  <Header>
    <CompanyName /> {/* Top left */}
    <Navigation /> {/* Top right - context switcher */}
  </Header>
  
  <ContextContent>
    {context === 'proposals' && <ProposalView />}
    {context === 'foundational' && <FoundationalWorkView />}
    {context === 'timeline' && <TimelineView />}
  </ContextContent>
</DashboardLayout>
```

### Hydration Flow

```javascript
// Step 1: Base hydration (always)
useEffect(() => {
  // Hydrate contact + company (from welcome)
  // This is already done in welcome page
}, []);

// Step 2: Context-specific hydration
useEffect(() => {
  const context = searchParams.get('context') || 'proposals';
  
  switch(context) {
    case 'proposals':
      hydrateProposal(proposalId);
      break;
    case 'foundational':
      hydrateDeliverables(contactId);
      break;
    case 'timeline':
      hydrateTimeline(contactId);
      break;
  }
}, [context, proposalId, contactId]);
```

## Data Structure

### Base Session (Always Available)
```javascript
{
  contactId: string,
  contactEmail: string,
  firebaseId: string,
  contactCompanyId: string,
  companyName: string, // ← Display in top left
  companyHQId: string,
}
```

### Proposal Context Data
```javascript
{
  proposal: {
    id, purpose, phases, milestones, compensation, status
  },
  serviceInstances: [...],
  deliverables: [...],
}
```

### Foundational Work Context Data
```javascript
{
  deliverables: [
    { id, title, status, dueDate, proposalId, ... }
  ],
  stats: {
    total, pending, inProgress, completed
  }
}
```

### Timeline Context Data
```javascript
{
  timeline: [
    { week, milestone, phase, deliverable, proposalId, ... }
  ],
  groupedByPhase: {...}
}
```

## Navigation Logic

```javascript
const navigation = [
  {
    label: 'Foundational Work',
    context: 'foundational',
    onClick: () => router.push('/dashboard?context=foundational')
  },
  {
    label: 'Proposals',
    context: 'proposals',
    onClick: () => router.push('/dashboard?context=proposals&proposalId=' + currentProposalId)
  },
  {
    label: 'Timeline',
    context: 'timeline',
    onClick: () => router.push('/dashboard?context=timeline')
  },
];
```

## Is This Too Complex?

**No, this is actually simpler!**

### Benefits:
1. **Focused Views** - User sees only what they need
2. **Lazy Loading** - Only hydrate what's needed
3. **Better Performance** - Don't load everything at once
4. **Clearer UX** - Each view has a specific purpose
5. **Easier to Extend** - Add new contexts easily

### Complexity Management:
- Use URL params for context (bookmarkable, shareable)
- Shared header/nav component
- Context-specific components are isolated
- Hydration logic is centralized

## Implementation Steps

1. **Update Dashboard Header**
   - Add CompanyName (top left)
   - Make navigation clickable (context switcher)

2. **Create Context Components**
   - `ProposalView.jsx`
   - `FoundationalWorkView.jsx`
   - `TimelineView.jsx`

3. **Create Context-Specific API Routes**
   - `/api/contacts/[contactId]/deliverables`
   - `/api/contacts/[contactId]/timeline`
   - (Proposal route already exists)

4. **Update Dashboard Logic**
   - Read `context` from URL params
   - Hydrate based on context
   - Render appropriate view

5. **Add Loading States**
   - Context-specific loading indicators
   - Smooth transitions between contexts

## Questions to Consider

1. **Default Context:** What should show when user first lands on `/dashboard`?
   - First proposal?
   - Foundational work?
   - Let user choose?

2. **Proposal Selection:** If user has multiple proposals, how do they switch?
   - Dropdown in nav?
   - Proposal list view first?

3. **State Persistence:** Should context persist across page reloads?
   - Yes - use URL params (recommended)
   - No - always default to same view

4. **Empty States:** What if no proposals/deliverables exist?
   - Show empty state with CTA
   - Redirect to different context?

## Next Steps

1. ✅ Document the architecture (this doc)
2. ⏳ Update dashboard header with CompanyName
3. ⏳ Implement context switching logic
4. ⏳ Create context-specific views
5. ⏳ Create missing API routes
6. ⏳ Add loading/transition states

