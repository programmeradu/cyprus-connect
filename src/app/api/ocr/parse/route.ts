import { NextRequest, NextResponse } from 'next/server';
import { processDocument, cleanupTessWorker } from '@/lib/ocr/processor';
import { extractUtilityBillData } from '@/lib/ocr/extract-bill-data';
import { UtilityBillData, OCRResult } from '@/lib/ocr/types';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { uploadFileToStorage } from '@/lib/supabase/storage';
import { bindSessionUser } from '@/lib/api-auth';
import { readUpload } from '@/lib/validate';
import { logger } from '@/lib/log';

export const maxDuration = 60;

const log = logger('ocr.parse');

interface ParseResponse {
  success: boolean;
  ocrResult: OCRResult | null;
  billData: UtilityBillData | null;
  documentId?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ParseResponse>> {
  const auth = await bindSessionUser(request, null);
  if (!auth.ok) return auth.response as NextResponse<ParseResponse>;
  try {
    const uploadResult2 = await readUpload(request, 'file', ['pdf', 'png', 'jpeg', 'webp']);
    if (!uploadResult2.ok) return uploadResult2.response as unknown as NextResponse<ParseResponse>;
    const { file, bytes } = uploadResult2;
    const buffer = Buffer.from(bytes);

    const ocrResult = await processDocument(buffer, file.type);

    if (!ocrResult.success) {
      const ref = log.error('OCR processing failed', undefined, { ocrError: ocrResult.error });
      return NextResponse.json(
        {
          success: false,
          ocrResult,
          billData: null,
          error: 'Failed to process the document.',
          ref,
        } as ParseResponse & { ref: string },
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
          log.info('File uploaded to Supabase Storage');
        } else {
          log.warn('Failed to upload to Supabase, using local storage', { uploadError: uploadResult.error });
        }
      } catch (uploadError) {
        log.warn('Upload to Supabase failed', { uploadError: String(uploadError) });
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
    const ref = log.error('OCR API error', error);
    return NextResponse.json(
      {
        success: false,
        ocrResult: null,
        billData: null,
        error: 'Something went wrong. Please try again.',
        ref,
      } as ParseResponse & { ref: string },
      { status: 500 }
    );
  } finally {
    await cleanupTessWorker();
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'OK', service: 'OCR Parser API' });
}
