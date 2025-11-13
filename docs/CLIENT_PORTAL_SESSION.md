# Client Portal Session Management

## Overview

The `useClientPortalSession` hook is the **foundation for all client portal state management**. It provides a centralized way to manage session data including proposal IDs, invoice IDs, and contact information across the entire client portal application.

## Architecture

```
Login → Contact Lookup → Welcome (Step 1: Contact Hydration) → Dashboard (Step 2: Company/Proposals Hydration)
```

The session hook stores data in `localStorage` and provides React state that stays in sync, ensuring data persists across page refreshes and navigation.

---

## Storage Keys

All data is stored in `localStorage` with the following keys:

### Contact & Auth
- `clientPortalContactId` - The contact's database ID
- `clientPortalContactEmail` - Contact's email address
- `clientPortalContactCompanyId` - ID of the company the contact belongs to
- `clientPortalCompanyName` - Name of the contact's company
- `clientPortalCompanyHQId` - Company HQ ID (crmId)
- `firebaseId` - Firebase UID (universal identifier)

### Proposals & Deliverables
- `clientPortalProposalId` - **Foundation for everything else** - The current proposal ID
- `clientPortalInvoiceId` - Current invoice ID (if applicable)

### Session Metadata
- `clientPortalLastActive` - ISO timestamp of last activity

---

## Hook Usage

### Basic Import

```javascript
import { useClientPortalSession } from '@/lib/hooks/useClientPortalSession';
```

### Hook API

```javascript
const {
  // Proposal ID (foundation for everything else)
  proposalId,
  setProposalId,
  
  // Invoice ID
  invoiceId,
  setInvoiceId,
  
  // Contact session
  contactSession,
  setContactSession,
  
  // Full session
  session,
  
  // Helpers
  refreshSession,
  clearProposalData,
  clearSession,
  hasValidSession,
} = useClientPortalSession();
```

---

## Data Structure

### `proposalId` (string | null)
The current proposal ID. This is the **foundation for everything else** - all proposal-related features depend on this.

**Example:**
```javascript
setProposalId('proposal-abc123');
// Now all proposal routes, deliverables, etc. use this ID
```

### `invoiceId` (string | null)
The current invoice ID (if applicable).

**Example:**
```javascript
setInvoiceId('invoice-xyz789');
```

### `contactSession` (object | null)
Contact session data loaded from Step 1 hydration.

**Structure:**
```javascript
{
  contactId: 'contact-123',
  contactEmail: 'john@example.com',
  firebaseId: 'firebase-uid-abc',
  contactCompanyId: 'company-456',
  companyName: 'Acme Corp',
  companyHQId: 'hq-789',
}
```

**Setting Contact Session:**
```javascript
setContactSession({
  contactId: contact.id,
  contactEmail: contact.email,
  firebaseId: firebaseUser.uid,
  contactCompanyId: contact.contactCompanyId,
  companyName: contact.contactCompany?.companyName,
  companyHQId: contact.crmId,
});
```

### `session` (object | null)
Full session object containing all data.

**Structure:**
```javascript
{
  // Contact session
  contactId: 'contact-123',
  contactEmail: 'john@example.com',
  firebaseId: 'firebase-uid-abc',
  contactCompanyId: 'company-456',
  companyName: 'Acme Corp',
  companyHQId: 'hq-789',
  
  // Proposals & Invoices
  proposalId: 'proposal-abc123',
  invoiceId: 'invoice-xyz789',
  
  // Metadata
  lastActive: '2024-01-15T10:30:00.000Z',
}
```

---

## Helper Methods

### `refreshSession()`
Refreshes all session data from `localStorage`. Useful after external updates.

```javascript
// After updating localStorage elsewhere
refreshSession();
```

### `clearProposalData()`
Clears only proposal/invoice data, keeping contact session intact.

```javascript
// User switches proposals
clearProposalData();
setProposalId(newProposalId);
```

### `clearSession()`
Clears **all** session data. Use on logout.

```javascript
// Logout
clearSession();
router.push('/login');
```

### `hasValidSession` (boolean)
Returns `true` if a valid contact session exists (has `contactId`).

```javascript
if (!hasValidSession) {
  router.replace('/welcome');
}
```

---

## Usage Examples

### Example 1: Login Flow

```javascript
// app/login/page.jsx
const { setContactSession } = useClientPortalSession();

// After Firebase auth and contact lookup
setContactSession({
  contactId: contact.id,
  contactEmail: contact.email,
  firebaseId: firebaseUser.uid,
  contactCompanyId: contact.contactCompanyId,
  companyName: contact.contactCompany?.companyName,
  companyHQId: contact.crmId,
});

router.push('/welcome');
```

### Example 2: Welcome Page (Step 1 Hydration)

```javascript
// app/welcome/page.jsx
const { setContactSession } = useClientPortalSession();

// After fetching contact by Firebase UID
setContactSession({
  contactId: contactData.id,
  contactEmail: contactData.email,
  firebaseId: firebaseUser.uid,
  contactCompanyId: contactData.contactCompanyId,
  companyName: contactData.contactCompany?.companyName,
  companyHQId: contactData.crmId,
});
```

### Example 3: Dashboard (Step 2 Hydration)

```javascript
// app/dashboard/page.jsx
const { 
  proposalId, 
  setProposalId, 
  contactSession, 
  hasValidSession 
} = useClientPortalSession();

// Check session validity
if (!hasValidSession || !contactSession?.contactId) {
  router.replace('/welcome');
  return;
}

// Load proposals and set proposal ID
const proposals = await api.get(`/api/contacts/${contactSession.contactId}/proposals`);
if (proposals.data?.proposals?.length > 0) {
  const firstProposal = proposals.data.proposals[0];
  setProposalId(firstProposal.id); // Foundation for everything else
}
```

### Example 4: Proposal Detail Page

```javascript
// app/proposals/[proposalId]/page.jsx
const { proposalId, setProposalId } = useClientPortalSession();
const { proposalId: urlProposalId } = useParams();

// Sync URL param with session
useEffect(() => {
  if (urlProposalId && urlProposalId !== proposalId) {
    setProposalId(urlProposalId);
  }
}, [urlProposalId]);

// Use proposalId for all API calls
const proposal = await api.get(`/api/proposals/${proposalId}/portal`);
```

### Example 5: Invoice Management

```javascript
// app/invoices/page.jsx
const { invoiceId, setInvoiceId, proposalId } = useClientPortalSession();

// Load invoices for current proposal
const invoices = await api.get(`/api/proposals/${proposalId}/invoices`);

// Set active invoice
const handleSelectInvoice = (invoice) => {
  setInvoiceId(invoice.id);
  router.push(`/invoices/${invoice.id}`);
};
```

---

## Storage Helper (Direct Access)

For non-React contexts or direct `localStorage` access, use the storage helper:

```javascript
import { clientPortalStorage } from '@/lib/storage';

// Get proposal ID
const proposalId = clientPortalStorage.getProposalId();

// Set proposal ID
clientPortalStorage.setProposalId('proposal-123');

// Get full session
const session = clientPortalStorage.getSession();

// Clear all data
clientPortalStorage.clear();
```

---

## Data Flow

### Step 1: Login → Contact Lookup
1. User logs in with Firebase
2. Call `/api/contacts/by-firebase-uid` (client portal route)
3. Store contact session using `setContactSession()`
4. Redirect to `/welcome`

### Step 2: Welcome → Contact Hydration
1. Load contact session from hook
2. Display welcome message
3. Redirect to `/dashboard`

### Step 3: Dashboard → Company/Proposals Hydration
1. Use `contactSession.contactId` to load proposals
2. Set `proposalId` using `setProposalId()` (foundation for everything else)
3. Load full portal data using `proposalId`
4. Display dashboard

---

## Best Practices

1. **Always check `hasValidSession`** before accessing `contactSession`
2. **Set `proposalId` early** - it's the foundation for everything else
3. **Use `refreshSession()`** after external localStorage updates
4. **Clear session on logout** using `clearSession()`
5. **Use `clearProposalData()`** when switching proposals (keeps contact session)

---

## Storage Location

All data is stored in browser `localStorage`, which means:
- ✅ Persists across page refreshes
- ✅ Persists across browser sessions (until cleared)
- ⚠️ Cleared when user clears browser data
- ⚠️ Not shared across devices/browsers

---

## Related Files

- `lib/storage.js` - Storage helper class
- `lib/hooks/useClientPortalSession.js` - React hook
- `app/login/page.jsx` - Sets initial contact session
- `app/welcome/page.jsx` - Step 1 hydration
- `app/dashboard/page.jsx` - Step 2 hydration with proposal ID

---

## Migration Notes

If you're migrating from direct `localStorage` access:

**Before:**
```javascript
localStorage.setItem('clientPortalProposalId', proposalId);
const proposalId = localStorage.getItem('clientPortalProposalId');
```

**After:**
```javascript
const { proposalId, setProposalId } = useClientPortalSession();
setProposalId(proposalId);
// proposalId is now reactive and synced with localStorage
```

