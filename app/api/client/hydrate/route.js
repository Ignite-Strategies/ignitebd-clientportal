import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/hydrate
 * Client Portal Contact Hydration
 * 
 * This is the main hydration endpoint for the client portal.
 * It finds the contact by Firebase UID and returns all necessary data
 * for the client portal session.
 * 
 * Architecture:
 * - User is authenticated via Firebase (token in header)
 * - Find contact by firebaseUid
 * - Return contact + company + proposals data
 * - This is Step 1 hydration (Contact Lookup/Retrieval)
 */
export async function GET(request) {
  try {
    console.log('🔍 GET /api/client/hydrate - Starting contact hydration...');
    
    // Verify Firebase token (user must be authenticated)
    console.log('🔍 Verifying Firebase token...');
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(request);
      console.log('✅ Firebase token verified:', { uid: decodedToken.uid, email: decodedToken.email });
    } catch (tokenError) {
      console.error('❌ Firebase token verification failed:', tokenError.message);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or expired token', details: tokenError.message },
        { status: 401 },
      );
    }

    const firebaseUid = decodedToken.uid;
    console.log('🔍 Looking up contact by firebaseUid:', firebaseUid);

    // FIND contact by Firebase UID with all related data
    let contact;
    try {
      contact = await prisma.contact.findUnique({
        where: { firebaseUid },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          ownerId: true,
          crmId: true,
          isActivated: true,
          contactCompanyId: true,
          contactCompany: {
            select: {
              id: true,
              companyName: true,
            },
          },
          // Include proposals for this contact's company
          // (via contactCompanyId relationship)
        },
      });
      console.log('🔍 Contact lookup result:', contact ? `Found contact ${contact.id}` : 'Contact not found');
    } catch (prismaError) {
      console.error('❌ Prisma error:', prismaError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          details: process.env.NODE_ENV === 'development' ? prismaError.message : undefined,
        },
        { status: 500 },
      );
    }

    if (!contact) {
      console.log('⚠️ Contact not found for firebaseUid:', firebaseUid);
      return NextResponse.json(
        { success: false, error: 'Contact not found. Please ensure your account is activated.' },
        { status: 404 },
      );
    }

    // Get proposals for this contact's company (if they have a company)
    let proposals = [];
    if (contact.contactCompanyId) {
      try {
        const proposalsData = await prisma.proposal.findMany({
          where: {
            companyId: contact.contactCompanyId,
            status: {
              in: ['draft', 'active', 'approved'],
            },
          },
          select: {
            id: true,
            clientName: true,
            clientCompany: true,
            status: true,
            totalPrice: true,
            dateIssued: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Limit to most recent 10
        });
        proposals = proposalsData;
        console.log(`✅ Found ${proposals.length} proposals for company ${contact.contactCompanyId}`);
      } catch (proposalsError) {
        console.warn('⚠️ Could not fetch proposals:', proposalsError.message);
        // Don't fail hydration if proposals can't be fetched
      }
    }

    // Build hydration response
    const hydrationData = {
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        role: contact.role || 'contact',
        ownerId: contact.ownerId,
        crmId: contact.crmId,
        isActivated: contact.isActivated,
        contactCompanyId: contact.contactCompanyId,
        companyName: contact.contactCompany?.companyName || null,
      },
      company: contact.contactCompany
        ? {
            id: contact.contactCompany.id,
            companyName: contact.contactCompany.companyName,
          }
        : null,
      proposals: proposals,
      firebaseUid: firebaseUid,
    };

    console.log('✅ Contact hydration complete:', {
      contactId: contact.id,
      companyId: contact.contactCompanyId,
      proposalsCount: proposals.length,
    });

    return NextResponse.json({
      success: true,
      data: hydrationData,
    });
  } catch (error) {
    console.error('❌ ClientHydrate error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    
    // Handle unauthorized (invalid token)
    if (error.message?.includes('Unauthorized') || error.message?.includes('token')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or expired token' },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to hydrate contact',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

