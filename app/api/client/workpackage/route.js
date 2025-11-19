import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/workpackage?workPackageId={id}
 * 
 * WorkPackage Detail hydration - full structure
 * 
 * Client MUST pass workPackageId from localStorage
 * Server validates: firebaseUid → contact → company → workPackage belongs to company
 * 
 * Returns:
 * - Full WorkPackage with phases, items, workCollateral
 * - NO artifact content (fetch on-demand if needed)
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
        totalCost: true,
        effectiveStartDate: true,
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

    // Step 4: Load full WorkPackage with phases, items, workCollateral
    // Handle case where workCollateral table might not exist yet
    let fullWorkPackage;
    try {
      fullWorkPackage = await prisma.workPackage.findUnique({
        where: { id: workPackageId },
        select: {
          id: true,
          title: true,
          description: true,
          prioritySummary: true,
          totalCost: true,
          effectiveStartDate: true,
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              companyName: true,
            },
          },
          phases: {
            include: {
              items: {
                include: {
                  workCollateral: true, // Full workCollateral data
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          items: {
            include: {
              workCollateral: true, // Full workCollateral data
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } catch (error) {
      // If workCollateral table doesn't exist, query without it
      if (error.code === 'P2021' && error.meta?.table === 'work_collateral') {
        console.warn('⚠️ work_collateral table does not exist, querying without workCollateral relation');
        fullWorkPackage = await prisma.workPackage.findUnique({
          where: { id: workPackageId },
          select: {
            id: true,
            title: true,
            description: true,
            prioritySummary: true,
            totalCost: true,
            effectiveStartDate: true,
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            company: {
              select: {
                id: true,
                companyName: true,
              },
            },
            phases: {
              include: {
                items: true, // Items without workCollateral
              },
              orderBy: { position: 'asc' },
            },
            items: {
              orderBy: { createdAt: 'asc' },
            },
          },
        });
        // Add empty workCollateral array to each item for compatibility
        if (fullWorkPackage) {
          fullWorkPackage.phases = fullWorkPackage.phases.map(phase => ({
            ...phase,
            items: phase.items.map(item => ({ ...item, workCollateral: [] })),
          }));
          fullWorkPackage.items = fullWorkPackage.items.map(item => ({ ...item, workCollateral: [] }));
        }
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    return NextResponse.json({
      success: true,
      workPackage: fullWorkPackage,
    });
  } catch (error) {
    console.error('❌ Get workpackage error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get work package',
        details: error.message,
      },
      { status: 500 },
    );
  }
}

