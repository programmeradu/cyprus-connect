import { GoogleGenerativeAI } from '@google/generative-ai';
import { OCRResult } from './types';

// Native-binary OCR (sharp, tesseract) can't run on Cloudflare Workers, so images
// are read with the Gemini vision model and PDFs with pdf-parse (pure JS).

const IMAGE_MODEL = 'gemini-2.5-flash';
const OCR_PROMPT =
  'Transcribe all text in this document image exactly as printed (bills, receipts, invoices). ' +
  'Keep line breaks, numbers, units, dates and currency symbols. Output only the transcribed text.';

function fail(error: string): OCRResult {
  return { success: false, text: '', error, processingTime: 0 };
}

export async function extractTextFromPDF(buffer: Buffer): Promise<OCRResult> {
  const startTime = Date.now();
  let parser: import('pdf-parse').PDFParse | undefined;
  try {
    // Loaded lazily: pdf.js breaks if evaluated at module load in the server bundle.
    const { PDFParse } = await import('pdf-parse');
    parser = new PDFParse({ data: new Uint8Array(buffer) });
    const { text } = await parser.getText();
    if (!text?.trim()) return fail('No text found in PDF (it may be a scanned image — upload a photo instead).');
    return { success: true, text, confidence: 0.95, processingTime: Date.now() - startTime };
  } catch (error) {
    return fail(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await parser?.destroy().catch(() => undefined);
  }
}

export async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<OCRResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fail('Image reading is not configured.');
  const startTime = Date.now();
  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: IMAGE_MODEL });
    const result = await model.generateContent([
      { inlineData: { data: buffer.toString('base64'), mimeType } },
      OCR_PROMPT,
    ]);
    const text = result.response.text().trim();
    if (!text) return fail('No readable text found in the image.');
    return { success: true, text, confidence: 0.9, processingTime: Date.now() - startTime };
  } catch (error) {
    return fail(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function processDocument(buffer: Buffer, mimeType: string): Promise<OCRResult> {
  if (mimeType === 'application/pdf') return extractTextFromPDF(buffer);
  if (mimeType.startsWith('image/')) return extractTextFromImage(buffer, mimeType);
  return fail('Unsupported file type');
}

/** Kept for API compatibility; no worker to clean up any more. */
export async function cleanupTessWorker() {}
