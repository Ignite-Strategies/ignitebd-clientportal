import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';

/**
 * GET /api/client/billing
 * Get invoices for the authenticated client's company
 * 
 * Architecture Pattern:
 * - Verify Firebase token → Get Contact by firebaseUid
 * - Use contactCompanyId (not crmId) to find invoices via proposals
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
    
    // Get contact's company (using contactCompanyId, not crmId)
    const contact = await prisma.contact.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        contactCompanyId: true, // Use contactCompanyId
      },
    });

    if (!contact || !contact.contactCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Contact or company not found' },
        { status: 404 }
      );
    }

    // Get invoices for company's proposals (following architecture doc pattern)
    const invoices = await prisma.invoice.findMany({
      where: {
        proposal: {
          companyId: contact.contactCompanyId, // Use contactCompanyId
        },
      },
      include: {
        proposal: {
          select: {
            id: true,
            clientCompany: true, // Proposal title/name
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({
      success: true,
      invoices: invoices.map((invoice) => ({
        id: invoice.id, // invoiceId
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        paidByContactId: invoice.paidByContactId, // Who paid
        proposal: {
          id: invoice.proposal.id,
          title: invoice.proposal.clientCompany, // Using clientCompany as title
        },
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

