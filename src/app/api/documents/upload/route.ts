import { processDocument } from '@/lib/ocr/processor';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { z } from "zod";
import { checkUpload, readJson, readUpload } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("documents.upload");

const MAX_FILE_SIZE = 10485760; // 10MB
const ALLOWED_TYPES = ['csv', 'pdf', 'xlsx'];
const STORAGE_THRESHOLD = 1048576; // 1MB

interface ParsedEmissionsData {
  columns: string[];
  mappings: {
    date?: string;
    energy?: string;
    electricity?: string;
    gas?: string;
    water?: string;
    emissions?: string;
    co2?: string;
    waste?: string;
    transport?: string;
  };
  rowCount: number;
}

function extractFileType(fileName: string, mimeType?: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension && ALLOWED_TYPES.includes(extension)) {
    return extension;
  }
  
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('csv')) return 'csv';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'xlsx';
  }
  
  return null;
}

/**
 * Reads the real header row and row count from a CSV file.
 * Columns are matched to known measures by name; nothing is guessed.
 */
function parseCSV(buffer: Buffer): ParsedEmissionsData {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { columns: [], mappings: {}, rowCount: 0 };
  const sep = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const columns = lines[0].split(sep).map((c) => c.trim().replace(/^"|"$/g, '')).filter(Boolean);
  const lower = columns.map((c) => c.toLowerCase());
  const find = (test: (c: string) => boolean) => {
    const i = lower.findIndex(test);
    return i >= 0 ? columns[i] : undefined;
  };
  const mappings: ParsedEmissionsData['mappings'] = {
    date: find((c) => c.includes('date') || c.includes('timestamp') || c.includes('period')),
    energy: find((c) => c.includes('energy') && !c.includes('electric')),
    electricity: find((c) => c.includes('electric') || c.includes('kwh')),
    gas: find((c) => c.includes('gas')),
    water: find((c) => c.includes('water')),
    emissions: find((c) => c.includes('emission') || c.includes('carbon')),
    co2: find((c) => c.includes('co2')),
    waste: find((c) => c.includes('waste')),
    transport: find((c) => c.includes('transport') || c.includes('vehicle') || c.includes('fuel')),
  };
  for (const k of Object.keys(mappings) as (keyof typeof mappings)[]) {
    if (!mappings[k]) delete mappings[k];
  }
  return { columns, mappings, rowCount: lines.length - 1 };
}

const UPLOAD_KINDS = ["csv", "pdf", "xlsx"] as const;

const JsonUpload = z.object({
  // base64 of at most 10 MB of bytes
  file: z.string().min(1).max(Math.ceil((MAX_FILE_SIZE * 4) / 3) + 8).regex(/^[A-Za-z0-9+/=\s]+$/, "file must be base64"),
  fileName: z.string().trim().min(1).max(255),
  fileType: z.string().max(100).optional(),
  userId: z.string().max(200).optional(),
  uploadSource: z.enum(["manual", "email", "integration", "api"]).optional().default("manual"),
});

const SOURCES = new Set(["manual", "email", "integration", "api"]);

/** The file's type comes from its bytes; the name and browser type are ignored. */
async function handleMultipartUpload(request: NextRequest) {
  const upload = await readUpload(request, "file", UPLOAD_KINDS, MAX_FILE_SIZE);
  if (!upload.ok) return upload.response;
  const claimed = upload.form.get("userId");
  const source = String(upload.form.get("uploadSource") ?? "manual");
  return {
    fileName: upload.file.name.slice(0, 255) || `upload.${upload.kind}`,
    fileSize: upload.bytes.byteLength,
    fileType: upload.kind as string,
    userId: typeof claimed === "string" ? claimed : undefined,
    uploadSource: SOURCES.has(source) ? source : "manual",
    fileBuffer: Buffer.from(upload.bytes),
  };
}

async function handleJSONUpload(request: NextRequest) {
  const parsed = await readJson(request, JsonUpload, Math.ceil((MAX_FILE_SIZE * 4) / 3) + 64 * 1024);
  if (!parsed.ok) return parsed.response;
  const fileBuffer = Buffer.from(parsed.data.file, "base64");
  const verdict = checkUpload(new Uint8Array(fileBuffer), UPLOAD_KINDS, MAX_FILE_SIZE);
  if (!verdict.ok) {
    return NextResponse.json({ error: verdict.error, code: verdict.code }, { status: verdict.status });
  }
  return {
    fileName: parsed.data.fileName,
    fileSize: fileBuffer.length,
    fileType: verdict.kind as string,
    userId: parsed.data.userId,
    uploadSource: parsed.data.uploadSource,
    fileBuffer,
  };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let uploadData;

    if (contentType.includes('multipart/form-data')) {
      uploadData = await handleMultipartUpload(request);
    } else if (contentType.includes('application/json')) {
      uploadData = await handleJSONUpload(request);
    } else {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data or application/json', code: 'INVALID_CONTENT_TYPE' },
        { status: 400 }
      );
    }

    if (uploadData instanceof NextResponse) {
      return uploadData;
    }

    const { fileName, fileSize, fileType, userId: __claimedUserId, uploadSource, fileBuffer } = uploadData;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;


    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of 10MB`, code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!fileType || !ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`, code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Verify user exists
    const userExists = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Process file based on type
    let ocrText: string | null = null;
    let parsedData: string | null = null;
    let processingStatus = 'completed';

    try {
      if (fileType === 'pdf') {
        const result = await processDocument(fileBuffer, 'application/pdf');
        if (result.success) {
          ocrText = result.text;
        } else {
          processingStatus = 'failed';
        }
      } else if (fileType === 'csv') {
        parsedData = JSON.stringify(parseCSV(fileBuffer));
      } else {
        // Spreadsheets are stored but not read yet; say so instead of inventing columns.
        processingStatus = 'pending';
      }
    } catch (error) {
      console.error('File processing error:', error);
      processingStatus = 'failed';
    }

    // Store file
    let fileUrl: string;
    if (fileSize < STORAGE_THRESHOLD) {
      fileUrl = `data:application/${fileType};base64,${fileBuffer.toString('base64')}`;
    } else {
      fileUrl = `/uploads/${userId}/${Date.now()}-${fileName}`;
    }

    // Create document record
    const now = new Date().toISOString();
    const newDocument = await db.insert(documents)
      .values({
        userId,
        fileName,
        fileType,
        fileSize,
        fileUrl,
        uploadSource,
        processingStatus,
        ocrText,
        parsedData,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        document: newDocument[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}