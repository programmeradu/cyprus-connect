import { FileValidationResult } from './types';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 1024; // 1KB

export function validateFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided', fileSize: 0, mimeType: '' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      fileSize: file.size,
      mimeType: file.type,
    };
  }

  if (file.size < MIN_FILE_SIZE) {
    return {
      valid: false,
      error: 'File is too small',
      fileSize: file.size,
      mimeType: file.type,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: PDF, JPEG, PNG`,
      fileSize: file.size,
      mimeType: file.type,
    };
  }

  return { valid: true, fileSize: file.size, mimeType: file.type };
}

export function validateBufferSize(buffer: Buffer): boolean {
  return buffer.length > 0 && buffer.length <= MAX_FILE_SIZE;
}
