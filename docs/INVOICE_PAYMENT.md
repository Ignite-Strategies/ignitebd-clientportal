# Invoice Payment System - Complete Guide

**📋 Architecture Reference:** See [`CLIENT_PORTAL_ARCHITECTURE.md`](./CLIENT_PORTAL_ARCHITECTURE.md) for route patterns, database queries, response formats, and ID hierarchy.

## Overview

The invoice payment system integrates Stripe checkout into the client portal dashboard, enabling clients to:
- View all invoices for their proposals
- Pay pending invoices via Stripe embedded checkout
- See payment status and history
- Track which contact paid each invoice

**Key Pattern:** All routes under `/api/client/*` follow:
1. Verify Firebase token → Get Contact by firebaseUid
2. Use `contactCompanyId` (not `crmId`) for company lookups

---

## Architecture

### Database Schema

**Invoice Model** (`prisma/schema.prisma`):
```prisma
model Invoice {
  id          String   @id @default(cuid())
  proposalId String
  proposal   Proposal @relation(fields: [proposalId], references: [id])
  
  // Invoice details
  invoiceNumber String  @unique // Human-readable (e.g., "INV-2025-001")
  amount        Float
  currency      String  @default("USD")
  description   String?
  
  // Payment schedule reference
  paymentScheduleId String?
  week              Int?
  trigger           String? // "Kickoff", "Week 4", "Completion"
  
  // Payment status
  status String @default("pending") // "pending" | "paid" | "failed" | "refunded"
  
  // Stripe integration (CRITICAL for reconciliation)
  stripeCheckoutSessionId String? @unique // Links to Stripe session
  stripePaymentIntentId   String? @unique // Links to Stripe payment
  stripeCustomerId        String? // Stripe customer ID
  
  // Who paid (from checkout session metadata)
  paidByContactId String? // Contact ID who made the payment
  
  // Dates
  dueDate   DateTime?
  paidAt    DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@index([proposalId])
  @@index([status])
  @@index([dueDate])
}
```

### API Endpoints

**📋 All routes follow architecture pattern:** Verify Firebase token → Get Contact by firebaseUid → Use contactCompanyId

1. **GET `/api/client/billing`**
   - Returns all invoices for the authenticated client's company
   - Filters by contact's company proposals (via `contactCompanyId`, not `crmId`)
   - Response includes `paidByContactId` (who paid)

2. **POST `/api/client/billing/[invoiceId]/checkout`**
   - Creates a Stripe checkout session for an invoice
   - Verifies invoice belongs to contact's company (via `contactCompanyId`)
   - Creates or retrieves Stripe customer
   - Stores `contactId` in session metadata (who paid)
   - Returns `clientSecret` for embedded checkout

3. **GET `/api/client/billing/[invoiceId]/verify/[sessionId]`** (Fallback)
   - Verifies payment status without webhook
   - Updates invoice status if payment completed
   - Returns `contactId` who paid

4. **POST `/api/webhook/stripe`**
   - Handles Stripe webhook events
   - Updates invoice status on payment completion
   - Extracts `contactId` from session metadata
   - Handles `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed` events

### Frontend Components

1. **Dashboard Invoice Section** (`app/dashboard/page.jsx`)
   - Displays list of invoices with status badges
   - Shows "Pay Now" button for pending invoices
   - Handles payment success redirects

2. **Invoice Payment Modal** (`app/components/InvoicePaymentModal.jsx`)
   - Uses Stripe Embedded Checkout
   - Creates checkout session on mount
   - Handles payment flow

---

## Payment Flow Models

### Model 1: With Webhook (Recommended) ✅

**Production-ready approach - same pattern as ignite-pay-backend**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENT INITIATES PAYMENT                                     │
└─────────────────────────────────────────────────────────────────┘
   │ Client clicks "Pay Now" on invoice
   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CREATE CHECKOUT SESSION                                      │
│    POST /api/client/billing/[invoiceId]/checkout                │
└─────────────────────────────────────────────────────────────────┘
   │ • Verify Firebase token → Get contactId
   │ • Load invoice with proposal/company
   │ • Verify contact has access (via contactCompanyId)
   │ • Create/find Stripe customer
   │ • Create Stripe checkout session with metadata:
   │   {
   │     invoiceId: invoice.id,
   │     invoiceNumber: invoice.invoiceNumber,
   │     proposalId: invoice.proposalId,
   │     contactId: contact.id,  ← WHO PAID
   │   }
   │ • Store stripeCheckoutSessionId on Invoice
   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CLIENT PAYS VIA STRIPE EMBEDDED CHECKOUT                    │
└─────────────────────────────────────────────────────────────────┘
   │ • Stripe processes payment
   │ • Payment succeeds
   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. STRIPE WEBHOOK FIRES                                        │
│    POST /api/webhook/stripe                                    │
│    Event: checkout.session.completed                           │
└─────────────────────────────────────────────────────────────────┘
   │ • Verify webhook signature
   │ • Extract session.id from event
   │ • Find Invoice by stripeCheckoutSessionId
   │ • Extract contactId from session.metadata
   │ • Update Invoice:
   │   - status: "paid"
   │   - paidAt: new Date()
   │   - paidByContactId: session.metadata.contactId
   │   - stripePaymentIntentId: session.payment_intent
   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. CLIENT REDIRECTED TO DASHBOARD                              │
│    /dashboard?session_id=xxx&invoice_id=yyy                     │
└─────────────────────────────────────────────────────────────────┘
   │ • Dashboard refreshes invoice list
   │ • Shows "Paid" status
   ▼
┌─────────────────────────────────────────────────────────────────┐
│ ✅ PAYMENT COMPLETE                                             │
│    Invoice.status = "paid"                                     │
│    Invoice.paidByContactId = contactId                         │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ **Reliable**: Webhook is the source of truth
- ✅ **Async**: Works even if client closes browser
- ✅ **Reconcilable**: Can match payments to invoices via sessionId
- ✅ **Tracks who paid**: contactId stored in session metadata and Invoice

---

### Model 2: Without Webhook (Fallback/Polling)

**Use this if webhook isn't configured yet or for testing**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1-3. Same as Model 1 (Create session, client pays)             │
└─────────────────────────────────────────────────────────────────┘
   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CLIENT REDIRECTED TO DASHBOARD                               │
│    /dashboard?session_id=xxx&invoice_id=yyy                     │
└─────────────────────────────────────────────────────────────────┘
   │ Dashboard useEffect:
   │ • Detects session_id in URL
   │ • Calls: GET /api/client/billing/[invoiceId]/verify/[sessionId]
   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. VERIFY SESSION ENDPOINT                                     │
│    GET /api/client/billing/[invoiceId]/verify/[sessionId]      │
└─────────────────────────────────────────────────────────────────┘
   │ • Retrieve session from Stripe API
   │ • Check session.payment_status === "paid"
   │ • If paid:
   │   - Update Invoice:
   │     - status: "paid"
   │     - paidAt: new Date()
   │     - paidByContactId: session.metadata.contactId
   │     - stripePaymentIntentId: session.payment_intent
   │   - Return success with contactId
   ▼
┌─────────────────────────────────────────────────────────────────┐
│ ✅ PAYMENT COMPLETE                                             │
│    (Same result as Model 1)                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ⚠️ **Less reliable**: Depends on client being redirected
- ⚠️ **Synchronous**: Requires client to complete redirect
- ✅ **Works without webhook**: Good for testing/development
- ✅ **Still tracks who paid**: contactId from session metadata

---

## Setup Instructions

### 1. Database Migration

Run Prisma migration to add the Invoice model:

```bash
cd ignitebd-clientportal
npx prisma migrate dev --name add_invoice_model
npx prisma generate
```

**Migration SQL** (if needed manually):
```sql
-- See: prisma/migrations/add_invoice_model.sql
```

### 2. Environment Variables

Add the following environment variables to your `.env` file and deployment platform:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe dashboard webhook endpoint
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production

# Client Portal URL (for Stripe return URL)
NEXT_PUBLIC_CLIENT_PORTAL_URL=https://your-client-portal-domain.com
```

**⚠️ Important:** The publishable key must be prefixed with `NEXT_PUBLIC_` for Next.js to expose it to the client.

### 3. Stripe Configuration

#### Create Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-client-portal-domain.com/api/webhook/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

#### Test Mode vs Live Mode

- Use test keys (`sk_test_...`, `pk_test_...`) for development
- Use live keys (`sk_live_...`, `pk_live_...`) for production
- Keys must match the same mode (both test or both live)

### 4. Install Dependencies

The following packages have been added to `package.json`:

```json
{
  "@stripe/react-stripe-js": "^5.0.0",
  "@stripe/stripe-js": "^8.0.0",
  "stripe": "^14.7.0"
}
```

Install them:

```bash
npm install
```

### 5. Create Invoices

Invoices need to be created in the database. You can create them:

1. **Manually via Prisma Studio:**
   ```bash
   npx prisma studio
   ```

2. **Via API endpoint** (to be created):
   - Create an admin endpoint to generate invoices from proposal payment schedules
   - Or create invoices programmatically when proposals are approved

3. **Example invoice creation:**
   ```javascript
   await prisma.invoice.create({
     data: {
       proposalId: 'proposal-id',
       invoiceNumber: 'INV-2025-001',
       amount: 500.00,
       currency: 'USD',
       description: 'Payment for Phase 1 - Foundation',
       status: 'pending',
       dueDate: new Date('2025-02-01'),
       week: 1,
       trigger: 'Kickoff',
       paymentScheduleId: 'payment-1',
     },
   });
   ```

---

## Usage Flow

1. **Client logs into portal** → Dashboard loads
2. **Dashboard fetches invoices** → Calls `GET /api/client/billing`
3. **Client clicks "Pay Now"** → Opens payment modal
4. **Modal creates checkout session** → Calls `POST /api/client/billing/[invoiceId]/checkout`
5. **Stripe embedded checkout loads** → Client enters payment details
6. **Payment completes** → Stripe redirects to `/dashboard?session_id=...&invoice_id=...`
7. **Webhook fires** → Updates invoice status to "paid" and stores `paidByContactId`
8. **Dashboard refreshes** → Shows updated invoice status

---

## Implementation Details

### Checkout Session Creation

```javascript
// app/api/client/billing/[invoiceId]/checkout/route.js
// Architecture Pattern: Verify Firebase token → Get Contact by firebaseUid → Use contactCompanyId

// 1. Verify Firebase token
const decodedToken = await verifyFirebaseToken(request);

// 2. Get contact by firebaseUid
const contact = await prisma.contact.findUnique({
  where: { firebaseUid: decodedToken.uid },
  select: {
    id: true,
    contactCompanyId: true, // Use contactCompanyId
  },
});

// 3. Verify invoice belongs to contact's company
const invoice = await prisma.invoice.findUnique({
  where: { id: invoiceId },
  include: {
    proposal: {
      select: {
        companyId: true, // Verify via companyId
      },
    },
  },
});

if (invoice.proposal.companyId !== contact.contactCompanyId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}

// 4. Create Stripe checkout session
const session = await stripe.checkout.sessions.create({
  ui_mode: 'embedded',
  payment_method_types: ['card'],
  customer: stripeCustomerId,
  line_items: [{
    price_data: {
      currency: invoice.currency.toLowerCase(),
      product_data: {
        name: `Invoice ${invoice.invoiceNumber}`,
        description: invoice.description,
      },
      unit_amount: Math.round(invoice.amount * 100),
    },
    quantity: 1,
  }],
  mode: 'payment',
  return_url: `${frontendUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoiceId}`,
  metadata: {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    proposalId: invoice.proposalId,
    contactId: contact.id, // CRITICAL: Who paid
  },
});

// 5. Store session ID immediately
await prisma.invoice.update({
  where: { id: invoiceId },
  data: { stripeCheckoutSessionId: session.id },
});
```

### Webhook Handler

```javascript
// app/api/webhook/stripe/route.js

if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  
  // Find invoice by session ID
  const invoice = await prisma.invoice.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });
  
  if (invoice) {
    // Extract contactId from session metadata (who paid)
    const contactId = session.metadata?.contactId || null;
    
    // Update invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paidByContactId: contactId, // Store who paid
        stripePaymentIntentId: session.payment_intent || null,
      },
    });
  }
}
```

### Verify Endpoint (Fallback)

```javascript
// app/api/client/billing/[invoiceId]/verify/[sessionId]/route.js
// Architecture Pattern: Verify Firebase token → Get Contact by firebaseUid → Use contactCompanyId

// 1. Verify Firebase token and get contact
const contact = await prisma.contact.findUnique({
  where: { firebaseUid: decodedToken.uid },
  select: { contactCompanyId: true },
});

// 2. Verify invoice belongs to contact's company
if (invoice.proposal.companyId !== contact.contactCompanyId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}

// 3. Retrieve session from Stripe
const session = await stripe.checkout.sessions.retrieve(sessionId);

if (session.payment_status === 'paid') {
  const contactId = session.metadata?.contactId || contact.id;
  
  // Update invoice
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'paid',
      paidAt: new Date(),
      paidByContactId: contactId,
      stripePaymentIntentId: session.payment_intent || null,
    },
  });
  
  return NextResponse.json({
    success: true,
    contactId, // Return who paid
    amount: session.amount_total / 100,
  });
}
```

---

## Testing

### Test Card Numbers

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

### Test Webhook Events

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Then trigger test events:
```bash
stripe trigger checkout.session.completed
```

### Verify Setup

Run the verification script:
```bash
node scripts/verify-stripe-setup.js
```

---

## Troubleshooting

### Payment Modal Doesn't Load

- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set (must have `NEXT_PUBLIC_` prefix)
- Check that checkout session is created successfully (check network tab)
- Verify Firebase token is being sent (check Authorization header)

### Webhook Not Firing

- Verify webhook endpoint URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches the webhook signing secret
- Check server logs for webhook errors
- Use Stripe CLI to test webhooks locally
- Check Stripe dashboard → Webhooks → View logs for delivery status

### Invoice Status Not Updating

- Check webhook is receiving events (Stripe dashboard → Webhooks → View logs)
- Verify invoice exists with matching `stripeCheckoutSessionId`
- Check database connection and Prisma client
- Verify `contactId` is in session metadata (check Stripe dashboard)

### CORS Errors

- Ensure Stripe checkout return URL matches your domain
- Check `NEXT_PUBLIC_CLIENT_PORTAL_URL` is set correctly
- Verify return URL in checkout session matches frontend domain

### Authorization Errors

- Verify Firebase token is valid and not expired
- Check contact exists with `firebaseUid` matching token
- Verify invoice belongs to contact's company (via `contactCompanyId`)
- Check logs for specific authorization failure reason

---

## Key Differences: ignite-pay-backend vs Client Portal

| Aspect | ignite-pay-backend | Client Portal |
|--------|-------------------|---------------|
| **Database** | MongoDB | PostgreSQL |
| **Customer Model** | EventCustomer (email-based) | Contact (firebaseUid-based) |
| **Order Model** | Purchase | Invoice |
| **Who Paid** | customerId in Purchase | contactId in Invoice metadata + `paidByContactId` |
| **Lookup** | Find by email → customerId | Find by firebaseUid → contactId |
| **Session Metadata** | customerId stored | contactId stored |
| **Company Lookup** | N/A | Uses `contactCompanyId` (not `crmId`) |

---

## Flow Summary

**Input:** Invoice number (or invoiceId)  
**Output:** contactId who paid

**Process:**
1. Client initiates payment → contactId known from Firebase auth
2. Create checkout session → store contactId in session.metadata
3. Payment completes → webhook fires OR client verifies
4. Extract contactId from session.metadata
5. Store contactId on Invoice.paidByContactId
6. Return contactId to caller

**Result:** We know exactly which Contact paid which Invoice!

---

## Future Enhancements

- [ ] Admin API to create invoices from proposal payment schedules
- [ ] Invoice PDF generation
- [ ] Email notifications for invoice creation and payment
- [ ] Payment history page
- [ ] Recurring payment support
- [ ] Partial payment support
- [ ] Refund handling
- [ ] Invoice templates
- [ ] Automated invoice generation from proposals

---

## Related Files

**Database:**
- `prisma/schema.prisma` - Invoice model definition
- `prisma/migrations/add_invoice_model.sql` - Migration SQL

**API Endpoints:**
- `app/api/client/billing/route.js` - List invoices (follows architecture pattern)
- `app/api/client/billing/[invoiceId]/checkout/route.js` - Create checkout session (follows architecture pattern)
- `app/api/client/billing/[invoiceId]/verify/[sessionId]/route.js` - Verify payment (fallback)
- `app/api/webhook/stripe/route.js` - Stripe webhook handler

**Frontend:**
- `app/dashboard/page.jsx` - Dashboard with invoice section
- `app/components/InvoicePaymentModal.jsx` - Payment modal component
- `app/settings/billing/page.jsx` - Billing page

**Documentation:**
- [`CLIENT_PORTAL_ARCHITECTURE.md`](./CLIENT_PORTAL_ARCHITECTURE.md) - Architecture patterns and route specs

**Scripts:**
- `scripts/verify-stripe-setup.js` - Verify environment variables

---

**Last Updated**: January 2025  
**Maintained by**: Ignite Strategies Team  
**Architecture Pattern**: All routes under `/api/client/*` follow: Verify Firebase token → Get Contact by firebaseUid → Use contactCompanyId

