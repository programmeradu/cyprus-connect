import * as pdfjsParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { OCRResult } from './types';

// Initialize Tesseract worker (reuse across requests)
let tessWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function getTessWorker() {
  if (!tessWorker) {
    tessWorker = await createWorker('eng');
  }
  return tessWorker;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<OCRResult> {
  try {
    const startTime = Date.now();
    const data = await (pdfjsParse as unknown as (input: Buffer) => Promise<{ text?: string }>)(buffer);
    const text = data.text || '';
    
    return {
      success: true,
      text,
      confidence: 0.95,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processingTime: 0,
    };
  }
}

export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<OCRResult> {
  try {
    const startTime = Date.now();
    
    // Optimize image before OCR
    const optimizedBuffer = await sharp(buffer)
      .grayscale()
      .normalize()
      .toBuffer();

    const worker = await getTessWorker();
    const {
      data: { text, confidence },
    } = await worker.recognize(optimizedBuffer);

    return {
      success: true,
      text,
      confidence: confidence / 100,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processingTime: 0,
    };
  }
}

export async function processDocument(
  buffer: Buffer,
  mimeType: string
): Promise<OCRResult> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  } else if (mimeType.startsWith('image/')) {
    return extractTextFromImage(buffer, mimeType);
  }

  return {
    success: false,
    text: '',
    error: 'Unsupported file type',
    processingTime: 0,
  };
}

export async function cleanupTessWorker() {
  if (tessWorker) {
    await tessWorker.terminate();
    tessWorker = null;
  }
}
