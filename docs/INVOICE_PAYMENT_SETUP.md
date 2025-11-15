# Invoice Payment Integration - Setup Guide

This document describes the invoice payment system integrated into the client portal, allowing clients to pay invoices via Stripe.

## Overview

The invoice payment system integrates Stripe checkout into the client portal dashboard, enabling clients to:
- View all invoices for their proposals
- Pay pending invoices via Stripe embedded checkout
- See payment status and history

## Architecture

### Database Schema

**Invoice Model** (`prisma/schema.prisma`):
- Links to `Proposal` via `proposalId`
- Tracks invoice details (number, amount, currency, description)
- References payment schedule from proposal
- Stores Stripe integration data (checkout session ID, payment intent ID, customer ID)
- Tracks payment status (pending, paid, failed, refunded)

### API Endpoints

1. **GET `/api/invoices`**
   - Returns all invoices for the authenticated client
   - Filters by contact's company proposals
   - Requires Firebase authentication

2. **POST `/api/invoices/:invoiceId/checkout`**
   - Creates a Stripe checkout session for an invoice
   - Creates or retrieves Stripe customer
   - Returns `clientSecret` for embedded checkout
   - Requires Firebase authentication

3. **POST `/api/webhook/stripe`**
   - Handles Stripe webhook events
   - Updates invoice status on payment completion
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

## Setup Instructions

### 1. Database Migration

Run Prisma migration to add the Invoice model:

```bash
cd ignitebd-clientportal
npx prisma migrate dev --name add_invoice_model
npx prisma generate
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

## Usage Flow

1. **Client logs into portal** → Dashboard loads
2. **Dashboard fetches invoices** → Shows all invoices for client's proposals
3. **Client clicks "Pay Now"** → Opens payment modal
4. **Modal creates checkout session** → Calls `/api/invoices/:invoiceId/checkout`
5. **Stripe embedded checkout loads** → Client enters payment details
6. **Payment completes** → Stripe redirects to `/dashboard?session_id=...&invoice_id=...`
7. **Webhook fires** → Updates invoice status to "paid"
8. **Dashboard refreshes** → Shows updated invoice status

## Testing

### Test Card Numbers

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

### Test Webhook Events

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Then trigger test events:
```bash
stripe trigger checkout.session.completed
```

## Troubleshooting

### Payment Modal Doesn't Load

- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check that checkout session is created successfully (check network tab)

### Webhook Not Firing

- Verify webhook endpoint URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches the webhook signing secret
- Check server logs for webhook errors
- Use Stripe CLI to test webhooks locally

### Invoice Status Not Updating

- Check webhook is receiving events (Stripe dashboard → Webhooks → View logs)
- Verify invoice exists with matching `stripeCheckoutSessionId`
- Check database connection and Prisma client

### CORS Errors

- Ensure Stripe checkout return URL matches your domain
- Check `NEXT_PUBLIC_CLIENT_PORTAL_URL` is set correctly

## Future Enhancements

- [ ] Admin API to create invoices from proposal payment schedules
- [ ] Invoice PDF generation
- [ ] Email notifications for invoice creation and payment
- [ ] Payment history page
- [ ] Recurring payment support
- [ ] Partial payment support
- [ ] Refund handling

## Related Files

- `prisma/schema.prisma` - Invoice model definition
- `app/api/invoices/route.js` - List invoices endpoint
- `app/api/invoices/[invoiceId]/checkout/route.js` - Create checkout session
- `app/api/webhook/stripe/route.js` - Stripe webhook handler
- `app/dashboard/page.jsx` - Dashboard with invoice section
- `app/components/InvoicePaymentModal.jsx` - Payment modal component

