# Welcome Router Architecture

## Core Concept

**Welcome page is the smart router** - it decides where to send the user based on their current state, rather than having tons of useEffects scattered across pages.

**Dashboard is only for when work actually begins** - approved proposals, active deliverables, etc.

## Flow

```
Login → Welcome (Router) → Decision:
  ├─ No proposals → Proposal view / empty state
  ├─ Draft proposals → Proposal review
  ├─ Approved proposals + deliverables → Dashboard (work has begun)
  └─ No active work → Onboarding / waiting state
```

## Welcome Router Logic

```javascript
// Welcome page checks state and routes accordingly
const routeUser = async () => {
  // 1. Hydrate contact (always first)
  const contact = await hydrateContact();
  
  // 2. Check what exists
  const proposals = await getProposals(contactId);
  const deliverables = await getDeliverables(contactId);
  
  // 3. Route based on state
  if (deliverables.length > 0 || hasApprovedProposals(proposals)) {
    // Work has begun → Dashboard
    router.push('/dashboard');
  } else if (proposals.length > 0) {
    // Has proposals but not approved → Proposal view
    router.push(`/proposals/${proposals[0].id}`);
  } else {
    // No proposals → Onboarding / empty state
    router.push('/onboarding');
  }
};
```

## State-Based Routing

### State 1: No Proposals
**Route:** `/onboarding` or `/proposals/empty`
**Shows:** 
- Welcome message
- "Get started" CTA
- Maybe link to contact Ignite

### State 2: Draft Proposals (Not Approved)
**Route:** `/proposals/[proposalId]`
**Shows:**
- Proposal details
- Review/approval flow
- "Work hasn't begun yet" message

### State 3: Approved Proposals + Deliverables (Work Has Begun)
**Route:** `/dashboard`
**Shows:**
- CompanyName (top left)
- Context-aware views (Proposals, Foundational Work, Timeline)
- Active work tracking

### State 4: Approved but No Deliverables Yet
**Route:** `/proposals/[proposalId]` with "Generating deliverables..." message
**Shows:**
- Proposal approved
- Waiting for deliverables to be created

## Benefits

1. **Single Decision Point** - Welcome makes the routing decision
2. **No Scattered useEffects** - Hydration logic centralized
3. **Clear State Management** - One place to check "has work begun?"
4. **Better UX** - User goes directly to what's relevant
5. **Simpler Pages** - Each page just displays, doesn't route

## Implementation

### Welcome Page Structure

```javascript
function WelcomeContent() {
  const [routing, setRouting] = useState(true);
  
  useEffect(() => {
    const routeUser = async () => {
      // 1. Hydrate contact
      const contact = await hydrateContact();
      setContactSession(contact);
      
      // 2. Check state
      const state = await checkUserState(contact.id);
      
      // 3. Route
      routeBasedOnState(state);
    };
    
    routeUser();
  }, []);
  
  // Show loading while routing
  if (routing) {
    return <LoadingState />;
  }
}
```

### State Check Function

```javascript
async function checkUserState(contactId) {
  // Get proposals
  const proposals = await api.get(`/api/contacts/${contactId}/proposals`);
  
  // Get deliverables
  const deliverables = await api.get(`/api/contacts/${contactId}/deliverables`);
  
  // Determine state
  const hasApprovedProposals = proposals.some(p => p.status === 'approved');
  const hasDeliverables = deliverables.length > 0;
  const hasDraftProposals = proposals.some(p => p.status === 'draft');
  
  return {
    hasApprovedProposals,
    hasDeliverables,
    hasDraftProposals,
    proposals,
    deliverables,
    // Work has begun if: approved proposals OR deliverables exist
    workHasBegun: hasApprovedProposals || hasDeliverables,
  };
}
```

### Routing Function

```javascript
function routeBasedOnState(state) {
  if (state.workHasBegun) {
    // Work has begun → Dashboard
    router.push('/dashboard');
  } else if (state.hasDraftProposals) {
    // Has proposals to review
    const firstProposal = state.proposals.find(p => p.status === 'draft');
    router.push(`/proposals/${firstProposal.id}`);
  } else {
    // No proposals → Onboarding
    router.push('/onboarding');
  }
}
```

## Page Responsibilities

### Welcome Page
- ✅ Hydrate contact
- ✅ Check user state
- ✅ Route to appropriate page
- ❌ Don't display content (just route)

### Dashboard Page
- ✅ Only shows when work has begun
- ✅ Displays CompanyName (top left)
- ✅ Context-aware content switching
- ❌ Don't route (welcome handles that)

### Proposal Page
- ✅ Shows proposal details
- ✅ Handles approval flow
- ❌ Don't route (welcome handles that)

### Onboarding Page
- ✅ Shows empty state
- ✅ "Get started" messaging
- ❌ Don't route (welcome handles that)

## Questions

1. **What defines "work has begun"?**
   - Approved proposal?
   - Deliverables exist?
   - Both?

2. **What if proposal is approved but no deliverables yet?**
   - Show proposal with "Generating..." message?
   - Wait state?
   - Auto-redirect when deliverables created?

3. **Should welcome show anything or just route?**
   - Just route (fastest)
   - Show brief loading message
   - Show "Welcome, [Name]!" then route

4. **What about returning users?**
   - Always go through welcome?
   - Check localStorage and skip if already routed?
   - Direct to dashboard if work has begun?

## Recommended: Fast Routing

Welcome should route immediately without showing content:

```javascript
// Welcome just routes - no UI needed
if (workHasBegun) {
  router.replace('/dashboard'); // replace, not push
} else if (hasProposals) {
  router.replace(`/proposals/${proposalId}`);
} else {
  router.replace('/onboarding');
}
```

This keeps it fast and simple - welcome is just a router, not a page.

