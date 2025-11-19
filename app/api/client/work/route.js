import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/work?workPackageId={id}&minimal={true|false}
 * 
 * WorkPackage hydration - Get Company with workPackages, then load WorkPackage with full structure
 * 
 * Query Params:
 * - ?workPackageId={id} - Load specific work package
 * - ?minimal=true - Return minimal data (dashboard view) - only IDs and status flags for workCollateral
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

    // Get query params
    const { searchParams } = request.nextUrl;
    const workPackageId = searchParams.get('workPackageId');
    const minimal = searchParams.get('minimal') === 'true';

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
      // Load work package with phases, items, and workCollateral
      // Using select to exclude prioritySummary until migration runs
      workPackage = await prisma.workPackage.findUnique({
        where: { id: finalWorkPackageId },
        select: {
          id: true,
          title: true,
          description: true,
          // prioritySummary: true, // TODO: Uncomment after migration runs
          totalCost: true,
          effectiveStartDate: true,
          contactId: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          company: {
            select: { id: true, companyName: true }
          },
          phases: {
            include: {
              items: {
                include: {
                  workCollateral: minimal ? {
                    select: {
                      id: true,
                      status: true,
                      reviewRequestedAt: true,
                      // Minimal data for status mapping only (dashboard view)
                    }
                  } : true
                }
              }
            },
            orderBy: { position: "asc" }
          },
          items: {
            include: {
              workCollateral: minimal ? {
                select: {
                  id: true,
                  status: true,
                  reviewRequestedAt: true,
                  // Minimal data for status mapping only (dashboard view)
                }
              } : true
            },
            orderBy: { createdAt: "asc" }
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
      // Using select to exclude prioritySummary until migration runs
      workPackage = await prisma.workPackage.findFirst({
        where: { contactId: contact.id },
        select: {
          id: true,
          title: true,
          description: true,
          // prioritySummary: true, // TODO: Uncomment after migration runs
          totalCost: true,
          effectiveStartDate: true,
          contactId: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          company: {
            select: { id: true, companyName: true }
          },
          phases: {
            include: {
              items: {
                include: {
                  workCollateral: minimal ? {
                    select: {
                      id: true,
                      status: true,
                      reviewRequestedAt: true,
                      // Minimal data for status mapping only (dashboard view)
                    }
                  } : true
                }
              }
            },
            orderBy: { position: "asc" }
          },
          items: {
            include: {
              workCollateral: minimal ? {
                select: {
                  id: true,
                  status: true,
                  reviewRequestedAt: true,
                  // Minimal data for status mapping only (dashboard view)
                }
              } : true
            },
            orderBy: { createdAt: "asc" }
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

    // Return work package with phases, items, and workCollateral
    return NextResponse.json({
      success: true,
      workPackage: {
        id: workPackage.id,
        title: workPackage.title,
        description: workPackage.description,
        prioritySummary: null, // TODO: Uncomment after migration runs - workPackage.prioritySummary || null,
        phases: workPackage.phases || [],
        items: workPackage.items || [],
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

