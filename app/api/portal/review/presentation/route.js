import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';

/**
 * GET /api/portal/review/presentation
 * Get the presentation for review (linked to Joel's WorkItem)
 * Finds presentation via WorkCollateral linked to workItemId: cmi2l87w1000jlb048diknzxh
 */
export async function GET(request) {
  try {
    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(request);
    const firebaseUid = decodedToken.uid;

    // Get contact by Firebase UID
    const contact = await prisma.contact.findUnique({
      where: { firebaseUid },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 },
      );
    }

    // Hardcode the presentation ID directly (we know it from the duplication script)
    // Presentation ID: cmicl19x00001nwwkryddib2k
    const presentationId = 'cmicl19x00001nwwkryddib2k';
    
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation) {
      return NextResponse.json(
        { success: false, error: 'Presentation not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      presentation,
    });
  } catch (error) {
    console.error('❌ GetPresentationForReview error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      prisma: typeof prisma,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message?.includes('Unauthorized') ? 'Unauthorized' : 'Failed to get presentation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 },
    );
  }
}

