import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Upload a base64 image to Supabase Storage
 * @param base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param fileName - Name for the file (without extension)
 * @param bucket - Storage bucket name (default: 'generated-media')
 * @returns Public URL of the uploaded image or null if upload fails
 */
export async function uploadBase64Image(
  base64Data: string,
  fileName: string,
  bucket: string = 'generated-media'
): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return null;
  }

  try {
    // Remove data URI prefix if present
    const base64Content = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64');

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${fileName}-${timestamp}.png`;
    const filePath = `images/${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload image to Supabase:', error);
    return null;
  }
}

/**
 * Upload a video to Supabase Storage
 * @param videoUrl - URL of the video to upload
 * @param fileName - Name for the file (without extension)
 * @param bucket - Storage bucket name (default: 'generated-media')
 * @returns Public URL of the uploaded video or the original URL if upload fails
 */
export async function uploadVideo(
  videoUrl: string,
  fileName: string,
  bucket: string = 'generated-media'
): Promise<string> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Returning original video URL');
    return videoUrl;
  }

  try {
    // Fetch video data
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${fileName}-${timestamp}.mp4`;
    const filePath = `videos/${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (error) {
      console.error('Supabase video upload error:', error);
      return videoUrl; // Return original URL as fallback
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload video to Supabase:', error);
    return videoUrl; // Return original URL as fallback
  }
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - Path to the file in storage
 * @param bucket - Storage bucket name (default: 'generated-media')
 */
export async function deleteFile(
  filePath: string,
  bucket: string = 'generated-media'
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete file from Supabase:', error);
    return false;
  }
}

export { supabase };
