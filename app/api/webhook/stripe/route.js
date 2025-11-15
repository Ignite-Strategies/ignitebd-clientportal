import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhook events for invoice payments
 */
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('❌ Missing Stripe signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Find invoice by checkout session ID
      const invoice = await prisma.invoice.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      });

      if (invoice) {
        // Update invoice status to paid
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'paid',
            paidAt: new Date(),
            stripePaymentIntentId: session.payment_intent || null,
          },
        });

        console.log(`✅ Invoice ${invoice.invoiceNumber} marked as paid`);
      } else {
        console.warn(`⚠️ Invoice not found for session ${session.id}`);
      }
    } else if (event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      
      const invoice = await prisma.invoice.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      });

      if (invoice) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'paid',
            paidAt: new Date(),
            stripePaymentIntentId: session.payment_intent || null,
          },
        });

        console.log(`✅ Invoice ${invoice.invoiceNumber} payment succeeded`);
      }
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object;
      
      const invoice = await prisma.invoice.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      });

      if (invoice) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'failed',
          },
        });

        console.log(`❌ Invoice ${invoice.invoiceNumber} payment failed`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

