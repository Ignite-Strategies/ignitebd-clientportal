import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';

/**
 * POST /api/portal/review/cle/slides
 * Save updated slides (sections with titles and bullets)
 * 
 * Body:
 * {
 *   "presentationId": "<id>",
 *   "slides": { sections: [...] }
 * }
 */
export async function POST(request) {
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

    const body = await request.json();
    const { presentationId, slides } = body;

    if (!presentationId || !slides) {
      return NextResponse.json(
        { success: false, error: 'presentationId and slides are required' },
        { status: 400 },
      );
    }

    // Fetch existing presentation
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation) {
      return NextResponse.json(
        { success: false, error: 'Presentation not found' },
        { status: 404 },
      );
    }

    // Update presentation with new slides
    await prisma.presentation.update({
      where: { id: presentationId },
      data: {
        slides: slides,
      },
    });

    return NextResponse.json({
      success: true,
      status: 'ok',
    });
  } catch (error) {
    console.error('❌ SaveSlides error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message?.includes('Unauthorized') ? 'Unauthorized' : 'Failed to save slides',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 },
    );
  }
}

