import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/contacts/by-firebase-uid
 * Step 1: Contact Lookup/Retrieval
 * 
 * Client portal architecture:
 * - User is ALREADY authenticated via Firebase (can't get here without it)
 * - Just FIND the contact by firebaseUid (no create logic)
 * - Returns contact info for hydration
 */
export async function GET(request) {
  try {
    console.log('🔍 GET /api/contacts/by-firebase-uid - Starting...');
    
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

    // FIND contact by Firebase UID (no create - they're already authenticated)
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

    console.log('✅ Contact found successfully:', contact.id);
    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error('❌ GetContactByFirebaseUid error:', error);
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
        error: 'Failed to get contact',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

