import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/state
 * Check user state to determine routing
 * Returns: proposals, deliverables, and routing decision
 */
export async function GET(request) {
  try {
    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(request);
    const firebaseUid = decodedToken.uid;

    // Get contact by Firebase UID
    const contact = await prisma.contact.findUnique({
      where: { firebaseUid },
      include: {
        contactCompany: true,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 },
      );
    }

    // Get proposals for this contact's company
    const proposals = contact.contactCompanyId
      ? await prisma.proposal.findMany({
          where: {
            companyId: contact.contactCompanyId,
          },
          include: {
            company: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    // Get deliverables for this contact
    const deliverables = await prisma.consultantDeliverable.findMany({
      where: { contactId: contact.id },
      orderBy: { dueDate: 'asc' },
    });

    // Determine state
    const hasApprovedProposals = proposals.some((p) => p.status === 'approved');
    const hasDeliverables = deliverables.length > 0;
    const hasDraftProposals = proposals.some((p) => p.status === 'draft');
    const hasActiveProposals = proposals.some((p) => p.status === 'active');

    // Work has begun if: approved proposals OR deliverables exist
    const workHasBegun = hasApprovedProposals || hasDeliverables;

    // Find first draft proposal (for routing)
    const firstDraftProposal = proposals.find((p) => p.status === 'draft');
    const firstApprovedProposal = proposals.find((p) => p.status === 'approved');

    return NextResponse.json({
      success: true,
      state: {
        contact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          contactCompanyId: contact.contactCompanyId,
          companyName: contact.contactCompany?.companyName || null,
        },
        proposals: proposals.map((p) => ({
          id: p.id,
          clientCompany: p.clientCompany,
          status: p.status,
          purpose: p.purpose,
        })),
        deliverables: deliverables.map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          category: d.category,
          dueDate: d.dueDate,
        })),
        hasApprovedProposals,
        hasDeliverables,
        hasDraftProposals,
        hasActiveProposals,
        workHasBegun,
        routing: {
          // Where should we route?
          route: workHasBegun
            ? '/dashboard'
            : firstDraftProposal
              ? `/proposals/${firstDraftProposal.id}`
              : '/onboarding',
          proposalId: firstApprovedProposal?.id || firstDraftProposal?.id || null,
        },
      },
    });
  } catch (error) {
    console.error('❌ GetClientState error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get client state',
        details: error.message,
      },
      { status: 500 },
    );
  }
}

