import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/client/billing/[invoiceId]/checkout
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

    // Get contact by firebaseUid (following architecture pattern)
    const contact = await prisma.contact.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true, // contactId
        email: true,
        firstName: true,
        lastName: true,
        goesBy: true,
        contactCompanyId: true, // Use contactCompanyId
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Get invoice with proposal (verify it belongs to contact's company)
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        proposal: {
          select: {
            id: true,
            companyId: true, // Verify via companyId
            clientCompany: true,
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

    // Verify invoice belongs to contact's company (using contactCompanyId)
    if (invoice.proposal.companyId !== contact.contactCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - invoice does not belong to your company' },
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
          contactId: contact.id, // Who is paying
          companyId: contact.contactCompanyId || '', // Use contactCompanyId
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
        contactId: contact.id, // CRITICAL: Who paid (stored in session metadata)
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

