import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/work?workPackageId={id}
 * 
 * WorkPackage hydration - Get Company with workPackages, then load WorkPackage with full structure
 * 
 * Optional Query Param: ?workPackageId={id} - Load specific work package
 * 
 * Returns:
 * - { success: true, workPackage: {...}, company: {...} } if work package exists
 * - { success: true, workPackage: null, company: {...} } if no work package
 */
export async function GET(request) {
  try {
    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(request);
    const firebaseUid = decodedToken.uid;

    // Get workPackageId from query params (optional - if provided, use it)
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

    // Get full company object with workPackages (using contactCompanyId)
    let company = null;
    if (contact.contactCompanyId) {
      company = await prisma.company.findUnique({
        where: { id: contact.contactCompanyId },
        include: {
          workPackages: {
            select: {
              id: true,
              title: true,
              description: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1, // Get most recent work package
          },
        },
      });
    }

    // Get workPackageId from company's workPackages (most recent) or from query param
    const companyWorkPackageId = company?.workPackages?.[0]?.id || null;
    const finalWorkPackageId = workPackageId || companyWorkPackageId;

    let workPackage;

    if (finalWorkPackageId) {
      // Use exact query as specified (artifacts removed until table exists)
      workPackage = await prisma.workPackage.findUnique({
        where: { id: finalWorkPackageId },
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          company: {
            select: { id: true, companyName: true }
          },
          phases: {
            include: {
              items: true
            },
            orderBy: { position: "asc" }
          }
        },
      });

      // Verify work package belongs to this contact's company
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
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          company: {
            select: { id: true, companyName: true }
          },
          phases: {
            include: {
              items: true
            },
            orderBy: { position: "asc" }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // If no work package, return null with company info
    if (!workPackage) {
      return NextResponse.json({
        success: true,
        workPackage: null,
        company: company ? {
          id: company.id,
          companyName: company.companyName,
          workPackageId: company.workPackages?.[0]?.id || null,
        } : null,
        contact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
        },
      });
    }

    // Return work package with phases and artifacts (no transformation needed - use direct structure)
    return NextResponse.json({
      success: true,
      workPackage: {
        id: workPackage.id,
        title: workPackage.title,
        description: workPackage.description,
        phases: workPackage.phases || [],
        contact: workPackage.contact,
        company: workPackage.company || company,
      },
      workPackageId: workPackage.id,
      company: workPackage.company || company,
      contact: workPackage.contact,
    });
  } catch (error) {
    console.error('❌ Get work package error:', error);
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

