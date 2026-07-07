import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const document = await db
      .select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)))
      .limit(1);

    if (document.length === 0) {
      return NextResponse.json(
        { error: 'Document not found', code: 'DOCUMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(document[0], { status: 200 });
  } catch (error) {
    console.error('GET document error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingDocument = await db
      .select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)))
      .limit(1);

    if (existingDocument.length === 0) {
      return NextResponse.json(
        { error: 'Document not found', code: 'DOCUMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(documents)
      .where(eq(documents.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'Document deleted successfully',
        document: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE document error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}