import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { admin } from '@/lib/firebaseAdmin';

/**
 * POST /api/admin/upsert-firebase-uid
 * Upsert firebaseUid for a contact
 * 
 * Body: { firebaseUid, email? }
 * - If email provided: Find contact by email and set firebaseUid
 * - If only firebaseUid: Get email from Firebase, then find contact
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { firebaseUid, email } = body ?? {};

    if (!firebaseUid) {
      return NextResponse.json(
        { success: false, error: 'firebaseUid is required' },
        { status: 400 },
      );
    }

    let contactEmail = email;

    // If no email provided, get it from Firebase
    if (!contactEmail) {
      try {
        const app = admin;
        if (!app.apps.length) {
          throw new Error('Firebase Admin not initialized');
        }
        const firebaseUser = await app.auth().getUser(firebaseUid);
        contactEmail = firebaseUser.email;
        console.log(`📧 Got email from Firebase: ${contactEmail}`);
      } catch (firebaseError) {
        console.error('❌ Error getting email from Firebase:', firebaseError);
        return NextResponse.json(
          { success: false, error: 'Could not get email from Firebase. Please provide email in request body.' },
          { status: 400 },
        );
      }
    }

    if (!contactEmail) {
      return NextResponse.json(
        { success: false, error: 'Email is required (either from Firebase or request body)' },
        { status: 400 },
      );
    }

    // Find contact by email
    console.log(`🔍 Looking up contact by email: ${contactEmail}`);
    const contact = await prisma.contact.findFirst({
      where: {
        email: contactEmail.toLowerCase().trim(),
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: `Contact not found with email: ${contactEmail}` },
        { status: 404 },
      );
    }

    console.log(`✅ Found contact: ${contact.id} (${contact.firstName} ${contact.lastName})`);
    console.log(`📝 Current firebaseUid: ${contact.firebaseUid || 'null'}`);

    // Check if another contact already has this firebaseUid
    const existingContact = await prisma.contact.findUnique({
      where: { firebaseUid },
    });

    if (existingContact && existingContact.id !== contact.id) {
      return NextResponse.json(
        {
          success: false,
          error: `Firebase UID ${firebaseUid} is already assigned to contact ${existingContact.id} (${existingContact.email})`,
        },
        { status: 409 },
      );
    }

    // Upsert firebaseUid
    console.log(`🔄 Updating contact ${contact.id} with firebaseUid: ${firebaseUid}`);
    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        firebaseUid: firebaseUid,
        isActivated: true, // Mark as activated
      },
    });

    console.log(`✅ Successfully updated contact ${updated.id}`);
    return NextResponse.json({
      success: true,
      contact: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        firebaseUid: updated.firebaseUid,
        isActivated: updated.isActivated,
      },
      message: `Firebase UID ${firebaseUid} successfully linked to contact ${updated.id}`,
    });
  } catch (error) {
    console.error('❌ UpsertFirebaseUid error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upsert firebaseUid',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

