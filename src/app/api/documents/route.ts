import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'User ID must be a valid non-empty string',
          code: 'INVALID_USER_ID' 
        },
        { status: 400 }
      );
    }

    const userExists = await db.select({ id: user.id })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const fileType = searchParams.get('fileType');
    const processingStatus = searchParams.get('processingStatus');
    const uploadSource = searchParams.get('uploadSource');

    const conditions = [eq(documents.userId, userId)];

    if (fileType) {
      const validFileTypes = ['csv', 'pdf', 'xlsx'];
      if (!validFileTypes.includes(fileType.toLowerCase())) {
        return NextResponse.json(
          { 
            error: 'Invalid file type. Must be one of: csv, pdf, xlsx',
            code: 'INVALID_FILE_TYPE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(documents.fileType, fileType.toLowerCase()));
    }

    if (processingStatus) {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(processingStatus.toLowerCase())) {
        return NextResponse.json(
          { 
            error: 'Invalid processing status. Must be one of: pending, processing, completed, failed',
            code: 'INVALID_PROCESSING_STATUS' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(documents.processingStatus, processingStatus.toLowerCase()));
    }

    if (uploadSource) {
      const validSources = ['manual', 'utility', 'accounting'];
      if (!validSources.includes(uploadSource.toLowerCase())) {
        return NextResponse.json(
          { 
            error: 'Invalid upload source. Must be one of: manual, utility, accounting',
            code: 'INVALID_UPLOAD_SOURCE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(documents.uploadSource, uploadSource.toLowerCase()));
    }

    const userDocuments = await db.select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(userDocuments, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}