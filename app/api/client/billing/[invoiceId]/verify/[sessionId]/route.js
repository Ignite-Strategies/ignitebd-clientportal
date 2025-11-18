import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * GET /api/client/billing/[invoiceId]/verify/[sessionId]
 * Verify a checkout session and update invoice status (fallback without webhook)
 * 
 * Architecture Pattern:
 * - Verify Firebase token → Get Contact by firebaseUid
 * - Use contactCompanyId to verify invoice access
 */
export async function GET(request, { params }) {
  try {
    const { invoiceId, sessionId } = params || {};
    
    if (!invoiceId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'invoiceId and sessionId are required' },
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
        id: true,
        contactCompanyId: true, // Use contactCompanyId
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Get invoice with proposal
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        proposal: {
          select: {
            id: true,
            companyId: true, // Verify via companyId
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

    // Verify session belongs to this invoice
    if (invoice.stripeCheckoutSessionId !== sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session does not match invoice' },
        { status: 400 }
      );
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Extract contactId from session metadata (who paid)
      const paidByContactId = session.metadata?.contactId || contact.id;

      // Update invoice
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          stripePaymentIntentId: session.payment_intent || null,
          paidByContactId: paidByContactId, // Store who paid
        },
      });

      return NextResponse.json({
        success: true,
        contactId: paidByContactId, // Return who paid
        amount: session.amount_total / 100, // Convert cents to dollars
        currency: session.currency,
        invoiceNumber: invoice.invoiceNumber,
      });
    } else {
      return NextResponse.json({
        success: false,
        status: session.payment_status,
        message: `Payment status: ${session.payment_status}`,
      });
    }
  } catch (error) {
    console.error('❌ Verify session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

