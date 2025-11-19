import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { mapItemStatus } from '@/lib/services/StatusMapperService';

/**
 * GET /api/client/work/dashboard
 * 
 * Dashboard-specific endpoint - returns only summary data needed for dashboard
 * Does NOT load all items/phases - only what's needed for the dashboard view
 * 
 * Returns:
 * - stats: computed counts (total, completed, inProgress, needsReview, notStarted)
 * - needsReviewItems: only items that need review (with minimal workCollateral data)
 * - currentPhase: current phase with only its items (minimal data)
 * - nextPhase: next phase metadata only (no items)
 * - prioritySummary: consultant-written summary
 */
export async function GET(request) {
  try {
    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(request);
    const firebaseUid = decodedToken.uid;

    // Get query params
    const { searchParams } = request.nextUrl;
    const workPackageId = searchParams.get('workPackageId');

    // Get contact by Firebase UID
    const contact = await prisma.contact.findUnique({
      where: { firebaseUid },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactCompanyId: true,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 },
      );
    }

    // Find work package
    let workPackage = null;
    
    if (workPackageId) {
      workPackage = await prisma.workPackage.findUnique({
        where: { id: workPackageId },
        select: {
          id: true,
          title: true,
          description: true,
          // prioritySummary: true, // TODO: Uncomment after migration runs
          contactId: true,
        },
      });

      // Verify work package belongs to this contact
      if (workPackage && workPackage.contactId !== contact.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Work package does not belong to this contact' },
          { status: 403 },
        );
      }
    } else {
      // Fallback: Find work package by contactId (get the first/most recent one)
      workPackage = await prisma.workPackage.findFirst({
        where: { contactId: contact.id },
        select: {
          id: true,
          title: true,
          description: true,
          // prioritySummary: true, // TODO: Uncomment after migration runs
          contactId: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!workPackage) {
      return NextResponse.json({
        success: true,
        workPackage: null,
        stats: { total: 0, completed: 0, inProgress: 0, needsReview: 0, notStarted: 0 },
        needsReviewItems: [],
        currentPhase: null,
        nextPhase: null,
        contact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
        },
      });
    }

    // Get all items for stats calculation (only IDs and status fields)
    const allItems = await prisma.workPackageItem.findMany({
      where: { workPackageId: workPackage.id },
      select: {
        id: true,
        status: true,
        deliverableLabel: true,
        deliverableDescription: true,
        workPackagePhaseId: true,
        workCollateral: {
          select: {
            id: true,
            status: true,
            reviewRequestedAt: true,
          },
        },
      },
    });

    // Get all phases for phase data (only metadata, no items yet)
    const allPhases = await prisma.workPackagePhase.findMany({
      where: { workPackageId: workPackage.id },
      select: {
        id: true,
        name: true,
        description: true,
        position: true,
      },
      orderBy: { position: 'asc' },
    });

    // Attach items to phases for service functions
    const phasesWithItems = allPhases.map(phase => ({
      ...phase,
      items: allItems.filter(item => item.workPackagePhaseId === phase.id),
    }));

    // Compute stats using service
    const stats = {
      total: allItems.length,
      completed: 0,
      inProgress: 0,
      needsReview: 0,
      notStarted: 0,
    };

    allItems.forEach((item) => {
      const status = mapItemStatus(item, item.workCollateral || []);
      if (status === "COMPLETED") stats.completed++;
      else if (status === "IN_PROGRESS") stats.inProgress++;
      else if (status === "NEEDS_REVIEW") stats.needsReview++;
      else stats.notStarted++;
    });

    // Get needs review items (only those that need review)
    const needsReviewItemsData = allItems.filter((item) => {
      const status = mapItemStatus(item, item.workCollateral || []);
      return status === "NEEDS_REVIEW";
    });

    // Determine current phase (first incomplete phase)
    const isPhaseComplete = (phase) => {
      const phaseItems = allItems.filter(item => item.workPackagePhaseId === phase.id);
      if (phaseItems.length === 0) return false;
      return phaseItems.every((item) => {
        const status = mapItemStatus(item, item.workCollateral || []);
        return status === "COMPLETED";
      });
    };

    let currentPhaseIndex = -1;
    for (let i = 0; i < phasesWithItems.length; i++) {
      if (!isPhaseComplete(phasesWithItems[i])) {
        currentPhaseIndex = i;
        break;
      }
    }

    if (currentPhaseIndex === -1 && phasesWithItems.length > 0) {
      currentPhaseIndex = phasesWithItems.length - 1; // All complete, show last
    }

    const currentPhase = currentPhaseIndex >= 0 ? phasesWithItems[currentPhaseIndex] : null;
    const nextPhaseIndex = currentPhaseIndex + 1;
    const nextPhase = nextPhaseIndex < phasesWithItems.length ? phasesWithItems[nextPhaseIndex] : null;

    // Get items for current phase only (if it exists)
    let currentPhaseItems = [];
    if (currentPhase) {
      currentPhaseItems = allItems.filter(item => item.workPackagePhaseId === currentPhase.id);
    }

    // Build response
    const currentPhaseResponse = currentPhase
      ? {
          ...currentPhase,
          items: currentPhaseItems,
        }
      : null;

    const nextPhaseResponse = nextPhase
      ? {
          id: nextPhase.id,
          name: nextPhase.name,
          description: nextPhase.description,
          position: nextPhase.position,
          // No items for next phase - just preview
        }
      : null;

    return NextResponse.json({
      success: true,
      workPackageId: workPackage.id,
      workPackage: {
        id: workPackage.id,
        title: workPackage.title,
        description: workPackage.description,
        prioritySummary: null, // TODO: Uncomment after migration runs - workPackage.prioritySummary || null,
      },
      stats,
      needsReviewItems: needsReviewItemsData,
      currentPhase: currentPhaseResponse,
      nextPhase: nextPhaseResponse,
      currentPhaseIndex,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
      },
    });
  } catch (error) {
    console.error('❌ Get dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get dashboard data',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
