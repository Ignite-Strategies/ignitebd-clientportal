# Invoice Payment - Quick Start

## ✅ Implementation Complete

The invoice payment system has been fully integrated into the client portal. Here's what was added:

### Files Created/Modified

**Database:**
- ✅ `prisma/schema.prisma` - Added Invoice model
- ✅ `prisma/migrations/add_invoice_model.sql` - Migration SQL (run when DATABASE_URL is set)

**API Endpoints:**
- ✅ `app/api/client/billing/route.js` - List invoices (follows architecture pattern)
- ✅ `app/api/client/billing/[invoiceId]/checkout/route.js` - Create Stripe checkout (follows architecture pattern)
- ✅ `app/api/client/billing/[invoiceId]/verify/[sessionId]/route.js` - Verify payment (fallback)
- ✅ `app/api/webhook/stripe/route.js` - Stripe webhook handler

**Frontend:**
- ✅ `app/dashboard/page.jsx` - Added invoice section
- ✅ `app/components/InvoicePaymentModal.jsx` - Payment modal component

**Dependencies:**
- ✅ `package.json` - Added Stripe packages

**Documentation:**
- ✅ `docs/INVOICE_PAYMENT.md` - Complete guide (setup, flows, implementation)

## 🚀 Next Steps

### 1. Run Database Migration

Once `DATABASE_URL` is configured:

```bash
cd ignitebd-clientportal
npx prisma migrate dev --name add_invoice_model
# OR manually run: prisma/migrations/add_invoice_model.sql
```

### 2. Set Environment Variables

Add to `.env` and your deployment platform:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLIENT_PORTAL_URL=https://your-domain.com
```

### 3. Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhook/stripe`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. Create Invoices

Invoices need to be created in the database. You can:

- Use Prisma Studio: `npx prisma studio`
- Create via API (admin endpoint to be built)
- Create programmatically when proposals are approved

Example:
```javascript
await prisma.invoice.create({
  data: {
    proposalId: 'proposal-id',
    invoiceNumber: 'INV-2025-001',
    amount: 500.00,
    currency: 'USD',
    description: 'Payment for Phase 1',
    status: 'pending',
    dueDate: new Date('2025-02-01'),
    week: 1,
    trigger: 'Kickoff',
  },
});
```

## 🎯 How It Works

1. Client logs into portal → Dashboard shows invoices
2. Client clicks "Pay Now" → Opens Stripe checkout modal
3. Client enters payment → Stripe processes payment
4. Payment completes → Webhook updates invoice status
5. Dashboard refreshes → Shows "Paid" status

## 📝 Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

Test webhook locally:
```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

## 🔍 Troubleshooting

- **Payment modal doesn't load**: Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Webhook not firing**: Verify webhook URL and secret in Stripe dashboard
- **Invoice status not updating**: Check webhook logs in Stripe dashboard

See `docs/INVOICE_PAYMENT.md` for detailed troubleshooting and complete documentation.

