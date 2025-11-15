import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';

/**
 * GET /api/invoices
 * Get invoices for the authenticated client's proposal
 */
export async function GET(request) {
  try {
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
    
    // Get contact by Firebase UID
    const contact = await prisma.contact.findUnique({
      where: { firebaseUid: decodedToken.uid },
      include: {
        contactCompany: {
          include: {
            proposals: {
              include: {
                invoices: {
                  orderBy: { dueDate: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Get all invoices from all proposals for this contact's company
    const invoices = [];
    if (contact.contactCompany?.proposals) {
      for (const proposal of contact.contactCompany.proposals) {
        invoices.push(...proposal.invoices);
      }
    }

    return NextResponse.json({
      success: true,
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        week: invoice.week,
        trigger: invoice.trigger,
        proposalId: invoice.proposalId,
        createdAt: invoice.createdAt,
      })),
    });
  } catch (error) {
    console.error('❌ Get invoices error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get invoices',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

