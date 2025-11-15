import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/invoices/:invoiceId/checkout
 * Create a Stripe checkout session for an invoice
 */
export async function POST(request, { params }) {
  try {
    const { invoiceId } = params || {};
    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'invoiceId is required' },
        { status: 400 }
      );
    }

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(request);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get invoice with proposal and contact info
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        proposal: {
          include: {
            company: {
              include: {
                contacts: {
                  where: { firebaseUid: decodedToken.uid },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify the contact has access to this invoice
    if (!invoice.proposal.company?.contacts?.[0]) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - contact not associated with this invoice' },
        { status: 403 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    const contact = invoice.proposal.company.contacts[0];
    const frontendUrl = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || 
                       (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    // Create or retrieve Stripe customer
    let stripeCustomerId = invoice.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: contact.email || undefined,
        name: contact.firstName && contact.lastName 
          ? `${contact.firstName} ${contact.lastName}` 
          : contact.goesBy || undefined,
        metadata: {
          contactId: contact.id,
          companyId: invoice.proposal.companyId || '',
        },
      });
      stripeCustomerId = customer.id;

      // Update invoice with customer ID
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { stripeCustomerId },
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase() || 'usd',
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: invoice.description || `Payment for ${invoice.proposal.clientCompany}`,
            },
            unit_amount: Math.round(invoice.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: `${frontendUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoiceId}`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        proposalId: invoice.proposalId,
        contactId: contact.id,
      },
      allow_promotion_codes: true,
    });

    // Update invoice with checkout session ID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { stripeCheckoutSessionId: session.id },
    });

    return NextResponse.json({
      success: true,
      clientSecret: session.client_secret,
      sessionId: session.id,
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Create checkout session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

