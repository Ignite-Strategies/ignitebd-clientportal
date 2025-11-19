import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { mapItemStatus } from '@/lib/services/StatusMapperService';

/**
 * GET /api/client/allitems?workPackageId={id}
 * 
 * Dashboard hydration - summary data only
 * 
 * Client MUST pass workPackageId from localStorage
 * Server validates: firebaseUid → contact → company → workPackage belongs to company
 * 
 * Returns:
 * - stats: computed counts
 * - needsReviewItems: items needing review
 * - currentPhase: current phase with items
 * - nextPhase: next phase metadata
 */
export async function GET(request) {
  try {
    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(request);
    const firebaseUid = decodedToken.uid;

    // Get workPackageId from query params (MUST be provided from localStorage)
    const { searchParams } = request.nextUrl;
    const workPackageId = searchParams.get('workPackageId');

    if (!workPackageId) {
      return NextResponse.json(
        { success: false, error: 'workPackageId is required' },
        { status: 400 },
      );
    }

    // Step 1: Get contact by Firebase UID
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

    if (!contact.contactCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Contact has no company' },
        { status: 400 },
      );
    }

    // Step 2: Get workPackage and validate it belongs to contact's company
    const workPackage = await prisma.workPackage.findUnique({
      where: { id: workPackageId },
      select: {
        id: true,
        title: true,
        description: true,
        prioritySummary: true,
        companyId: true,
        contactId: true,
      },
    });

    if (!workPackage) {
      return NextResponse.json(
        { success: false, error: 'Work package not found' },
        { status: 404 },
      );
    }

    // Step 3: Validate workPackage belongs to contact's company
    // MUST match companyId (no fallback to contactId)
    if (workPackage.companyId !== contact.contactCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Work package does not belong to your company' },
        { status: 403 },
      );
    }

    // Step 4: Get all items for stats (minimal fields only)
    // Handle case where workCollateral table might not exist yet
    let allItems = [];
    try {
      allItems = await prisma.workPackageItem.findMany({
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
              type: true,
              title: true,
            },
          },
        },
      });
    } catch (error) {
      // If workCollateral table doesn't exist, query without it
      if (error.code === 'P2021' && error.meta?.table === 'work_collateral') {
        console.warn('⚠️ work_collateral table does not exist, querying without workCollateral relation');
        allItems = await prisma.workPackageItem.findMany({
          where: { workPackageId: workPackage.id },
          select: {
            id: true,
            status: true,
            deliverableLabel: true,
            deliverableDescription: true,
            workPackagePhaseId: true,
          },
        });
        // Add empty workCollateral array to each item for compatibility
        allItems = allItems.map(item => ({ ...item, workCollateral: [] }));
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    // Step 5: Get all phases (metadata only)
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

    // Step 6: Compute stats
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

    // Step 7: Get needs review items
    const needsReviewItems = allItems.filter((item) => {
      const status = mapItemStatus(item, item.workCollateral || []);
      return status === "NEEDS_REVIEW";
    });

    // Step 8: Determine current phase (first incomplete phase)
    const isPhaseComplete = (phase) => {
      const phaseItems = allItems.filter(item => item.workPackagePhaseId === phase.id);
      if (phaseItems.length === 0) return false;
      return phaseItems.every((item) => {
        const status = mapItemStatus(item, item.workCollateral || []);
        return status === "COMPLETED";
      });
    };

    let currentPhaseIndex = -1;
    for (let i = 0; i < allPhases.length; i++) {
      if (!isPhaseComplete(allPhases[i])) {
        currentPhaseIndex = i;
        break;
      }
    }

    if (currentPhaseIndex === -1 && allPhases.length > 0) {
      currentPhaseIndex = allPhases.length - 1; // All complete, show last
    }

    const currentPhase = currentPhaseIndex >= 0 ? allPhases[currentPhaseIndex] : null;
    const nextPhaseIndex = currentPhaseIndex + 1;
    const nextPhase = nextPhaseIndex < allPhases.length ? allPhases[nextPhaseIndex] : null;

    // Step 9: Get items for current phase only
    let currentPhaseItems = [];
    if (currentPhase) {
      currentPhaseItems = allItems.filter(item => item.workPackagePhaseId === currentPhase.id);
    }

    return NextResponse.json({
      success: true,
      workPackage: {
        id: workPackage.id,
        title: workPackage.title,
        description: workPackage.description,
        prioritySummary: workPackage.prioritySummary || null,
      },
      stats,
      needsReviewItems,
      currentPhase: currentPhase
        ? {
            ...currentPhase,
            items: currentPhaseItems,
          }
        : null,
      nextPhase: nextPhase
        ? {
            id: nextPhase.id,
            name: nextPhase.name,
            description: nextPhase.description,
            position: nextPhase.position,
          }
        : null,
      currentPhaseIndex,
    });
  } catch (error) {
    console.error('❌ Get allitems error:', error);
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

