import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'documents';

/**
 * Initialize the documents bucket if it doesn't exist
 * This should be called once during setup
 */
export async function initializeStorageBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp'
        ]
      });

      if (error) {
        console.error('Failed to create bucket:', error);
        return { success: false, error };
      }

      console.log('✓ Documents bucket created successfully');
      return { success: true, data };
    }

    return { success: true, exists: true };
  } catch (error) {
    console.error('Storage initialization error:', error);
    return { success: false, error };
  }
}

/**
 * Upload a file to Supabase Storage
 * @param file - File buffer to upload
 * @param fileName - Name of the file
 * @param userId - User ID for organizing files
 * @returns Public URL of the uploaded file
 */
export async function uploadFileToStorage(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<{ success: boolean; url?: string; error?: any }> {
  try {
    // Create a unique file path: userId/timestamp-filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: getContentType(fileName),
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param fileUrl - Full URL of the file to delete
 */
export async function deleteFileFromStorage(
  fileUrl: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // Extract the file path from the URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
    const filePath = pathParts[1];

    if (!filePath) {
      return { success: false, error: 'Invalid file URL' };
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete exception:', error);
    return { success: false, error };
  }
}

/**
 * Get a signed URL for private file access
 * @param filePath - Path to the file in storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return { success: false, error };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * List all files for a specific user
 * @param userId - User ID
 */
export async function listUserFiles(
  userId: string
): Promise<{ success: boolean; files?: any[]; error?: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, files: data };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Get content type from file name
 */
function getContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
