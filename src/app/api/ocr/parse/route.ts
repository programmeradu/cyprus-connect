import { NextRequest, NextResponse } from 'next/server';
import { validateFile, validateBufferSize } from '@/lib/ocr/validation';
import { processDocument, cleanupTessWorker } from '@/lib/ocr/processor';
import { extractUtilityBillData } from '@/lib/ocr/extract-bill-data';
import { UtilityBillData, OCRResult } from '@/lib/ocr/types';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { uploadFileToStorage } from '@/lib/supabase/storage';
import { bindSessionUser } from '@/lib/api-auth';

export const maxDuration = 60;

interface ParseResponse {
  success: boolean;
  ocrResult: OCRResult | null;
  billData: UtilityBillData | null;
  documentId?: number;
  error?: string;
}

async function readFileFromRequest(request: NextRequest): Promise<{
  file: File;
  buffer: Buffer;
}> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    throw new Error('No file provided');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return { file, buffer };
}

export async function POST(request: NextRequest): Promise<NextResponse<ParseResponse>> {
  const auth = await bindSessionUser(request, null);
  if (!auth.ok) return auth.response as NextResponse<ParseResponse>;
  try {
    const { file, buffer } = await readFileFromRequest(request);
    const validation = validateFile(file);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          ocrResult: null,
          billData: null,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    if (!validateBufferSize(buffer)) {
      return NextResponse.json(
        {
          success: false,
          ocrResult: null,
          billData: null,
          error: 'Buffer validation failed',
        },
        { status: 400 }
      );
    }

    const ocrResult = await processDocument(buffer, file.type);

    if (!ocrResult.success) {
      return NextResponse.json(
        {
          success: false,
          ocrResult,
          billData: null,
          error: ocrResult.error,
        },
        { status: 500 }
      );
    }

    const billData = extractUtilityBillData(ocrResult.text);

    // Documents always belong to the signed-in account (never a client-supplied ID).
    const userId = auth.userId;
    let documentId: number | undefined;
    let fileUrl = 'local'; // Default fallback

    if (userId) {
      // Upload file to Supabase Storage
      try {
        const uploadResult = await uploadFileToStorage(buffer, file.name, userId);
        
        if (uploadResult.success && uploadResult.url) {
          fileUrl = uploadResult.url;
          console.log('✓ File uploaded to Supabase Storage:', fileUrl);
        } else {
          console.warn('Failed to upload to Supabase, using local storage:', uploadResult.error);
        }
      } catch (uploadError) {
        console.error('Upload to Supabase failed:', uploadError);
        // Continue with local fallback
      }

      // Save document to database
      const [doc] = await db.insert(documents).values({
        userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: fileUrl,
        uploadSource: 'manual',
        processingStatus: 'completed',
        ocrText: ocrResult.text,
        parsedData: JSON.stringify(billData),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();

      documentId = doc.id;
    }

    return NextResponse.json(
      {
        success: true,
        ocrResult,
        billData,
        documentId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[OCR API Error]', error);
    
    return NextResponse.json(
      {
        success: false,
        ocrResult: null,
        billData: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  } finally {
    await cleanupTessWorker();
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'OK', service: 'OCR Parser API' });
}