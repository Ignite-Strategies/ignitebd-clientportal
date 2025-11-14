import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/contacts/:contactId/deliverables
 * Get all deliverables for a contact (client portal access)
 */
export async function GET(request, { params }) {
  try {
    const { contactId } = params || {};
    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'contactId is required' },
        { status: 400 },
      );
    }

    // Get deliverables for this contact
    const deliverables = await prisma.consultantDeliverable.findMany({
      where: { contactId },
      include: {
        proposal: {
          select: {
            id: true,
            clientCompany: true,
            status: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({
      success: true,
      deliverables,
    });
  } catch (error) {
    console.error('❌ GetContactDeliverables error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get deliverables',
        details: error.message,
      },
      { status: 500 },
    );
  }
}

