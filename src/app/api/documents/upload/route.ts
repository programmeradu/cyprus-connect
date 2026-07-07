import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

function simulatePDFOCR(): string {
  return "Energy consumption: 1500 kWh. Natural gas usage: 250 m³. Water consumption: 45,000 liters. Total CO2 emissions: 2.8 tons. Reporting period: November 2024. Carbon footprint analysis shows 15% reduction compared to previous quarter. Renewable energy sources accounted for 30% of total consumption. Waste management efficiency improved by 12%. Transportation emissions decreased by 8% through fleet optimization.";
}

function simulateCSVParsing(fileName: string): ParsedEmissionsData {
  const possibleColumns = [
    'date', 'timestamp', 'period',
    'energy', 'energy_kwh', 'power_consumption',
    'electricity', 'electric', 'electricity_kwh',
    'gas', 'natural_gas', 'gas_m3',
    'water', 'water_consumption', 'water_liters',
    'emissions', 'co2_emissions', 'carbon',
    'co2', 'co2e', 'carbon_dioxide',
    'waste', 'waste_kg', 'solid_waste',
    'transport', 'transportation', 'vehicle_emissions'
  ];

  const detectedColumns = possibleColumns.slice(0, Math.floor(Math.random() * 5) + 5);
  
  const mappings: ParsedEmissionsData['mappings'] = {};
  
  if (detectedColumns.some(col => col.includes('date') || col.includes('timestamp'))) {
    mappings.date = detectedColumns.find(col => col.includes('date') || col.includes('timestamp'));
  }
  if (detectedColumns.some(col => col.includes('energy') && !col.includes('electricity'))) {
    mappings.energy = detectedColumns.find(col => col.includes('energy') && !col.includes('electricity'));
  }
  if (detectedColumns.some(col => col.includes('electric'))) {
    mappings.electricity = detectedColumns.find(col => col.includes('electric'));
  }
  if (detectedColumns.some(col => col.includes('gas'))) {
    mappings.gas = detectedColumns.find(col => col.includes('gas'));
  }
  if (detectedColumns.some(col => col.includes('water'))) {
    mappings.water = detectedColumns.find(col => col.includes('water'));
  }
  if (detectedColumns.some(col => col.includes('emission') || col.includes('carbon'))) {
    mappings.emissions = detectedColumns.find(col => col.includes('emission') || col.includes('carbon'));
  }
  if (detectedColumns.some(col => col.includes('co2'))) {
    mappings.co2 = detectedColumns.find(col => col.includes('co2'));
  }
  if (detectedColumns.some(col => col.includes('waste'))) {
    mappings.waste = detectedColumns.find(col => col.includes('waste'));
  }
  if (detectedColumns.some(col => col.includes('transport'))) {
    mappings.transport = detectedColumns.find(col => col.includes('transport'));
  }

  return {
    columns: detectedColumns,
    mappings,
    rowCount: Math.floor(Math.random() * 100) + 20
  };
}

async function handleMultipartUpload(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const userId = formData.get('userId');
  const uploadSource = (formData.get('uploadSource') as string) || 'manual';

  if (!file) {
    return NextResponse.json(
      { error: 'File is required', code: 'MISSING_FILE' },
      { status: 400 }
    );
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required', code: 'MISSING_USER_ID' },
      { status: 400 }
    );
  }

  const fileBuffer = await file.arrayBuffer();
  const fileSize = fileBuffer.byteLength;
  const fileName = file.name;
  const mimeType = file.type;

  return {
    fileName,
    fileSize,
    fileType: extractFileType(fileName, mimeType),
    userId: userId as string,
    uploadSource,
    fileBuffer: Buffer.from(fileBuffer)
  };
}

async function handleJSONUpload(request: NextRequest) {
  const body = await request.json();
  const { file, fileName, fileType, userId, uploadSource = 'manual' } = body;

  if (!file || !fileName || !userId) {
    return NextResponse.json(
      { error: 'File, fileName, and userId are required', code: 'MISSING_REQUIRED_FIELDS' },
      { status: 400 }
    );
  }

  const fileBuffer = Buffer.from(file, 'base64');
  const fileSize = fileBuffer.length;
  const detectedFileType = extractFileType(fileName, fileType);

  return {
    fileName,
    fileSize,
    fileType: detectedFileType,
    userId: userId as string,
    uploadSource,
    fileBuffer
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

    const { fileName, fileSize, fileType, userId, uploadSource, fileBuffer } = uploadData;

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
        ocrText = simulatePDFOCR();
      } else if (fileType === 'csv' || fileType === 'xlsx') {
        const parsed = simulateCSVParsing(fileName);
        parsedData = JSON.stringify(parsed);
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