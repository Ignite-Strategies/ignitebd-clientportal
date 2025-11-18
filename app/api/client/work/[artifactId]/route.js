import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/work/artifacts/[artifactId]
 * Get a single artifact for client view
 * Validates that the artifact belongs to the authenticated contact's WorkPackage
 */
export async function GET(request, { params }) {
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

    // Get artifactId from params
    const { artifactId } = await params;

    if (!artifactId) {
      return NextResponse.json(
        { success: false, error: 'Artifact ID is required' },
        { status: 400 },
      );
    }

    // Find artifact with related WorkPackageItem and WorkPackage
    const artifact = await prisma.workArtifact.findUnique({
      where: { id: artifactId },
      include: {
        workPackageItem: {
          include: {
            workPackage: {
              include: {
                contact: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Artifact not found' },
        { status: 404 },
      );
    }

    // Verify artifact belongs to this contact's WorkPackage
    if (artifact.workPackageItem.workPackage.contactId !== contact.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Artifact does not belong to your work package' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      artifact: {
        id: artifact.id,
        type: artifact.type,
        title: artifact.title,
        contentJson: artifact.contentJson,
        status: artifact.status,
        reviewRequestedAt: artifact.reviewRequestedAt,
        reviewCompletedAt: artifact.reviewCompletedAt,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
      },
      workPackageItem: {
        id: artifact.workPackageItem.id,
        deliverableLabel: artifact.workPackageItem.deliverableLabel,
        deliverableDescription: artifact.workPackageItem.deliverableDescription,
        status: artifact.workPackageItem.status,
      },
    });
  } catch (error) {
    console.error('❌ Get artifact error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get artifact',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

