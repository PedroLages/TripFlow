/**
 * Receipt Image Helpers
 *
 * Utilities for handling receipt image upload, compression, and storage
 */

import { v4 as uuidv4 } from 'uuid';
import type { ReceiptImage } from '../types';

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed MIME types for receipt images
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * Thumbnail dimensions
 */
const THUMBNAIL_SIZE = 150;

/**
 * Validate a file for receipt upload
 *
 * @param file - File to validate
 * @returns Validation result
 */
export function validateReceiptImage(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (10MB)`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: JPEG, PNG, WebP`,
    };
  }

  return { valid: true };
}

/**
 * Convert file to base64
 *
 * @param file - File to convert
 * @returns Promise resolving to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compress and resize image
 *
 * @param base64 - Base64 encoded image
 * @param maxWidth - Maximum width (default: 1200)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise resolving to compressed base64 string
 */
export function compressImage(
  base64: string,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Resize if needed
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG for better compression
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = base64;
  });
}

/**
 * Generate thumbnail from image
 *
 * @param base64 - Base64 encoded image
 * @param size - Thumbnail size (default: 150)
 * @returns Promise resolving to thumbnail base64 string
 */
export function generateThumbnail(
  base64: string,
  size: number = THUMBNAIL_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate dimensions to maintain aspect ratio
      if (width > height) {
        if (width > size) {
          height = (height * size) / width;
          width = size;
        }
      } else {
        if (height > size) {
          width = (width * size) / height;
          height = size;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Use lower quality for thumbnails
      const thumbnail = canvas.toDataURL('image/jpeg', 0.6);
      resolve(thumbnail);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail'));
    };

    img.src = base64;
  });
}

/**
 * Process receipt image for storage
 *
 * @param file - Image file to process
 * @returns Promise resolving to ReceiptImage object
 */
export async function processReceiptImage(file: File): Promise<ReceiptImage> {
  // Validate file
  const validation = validateReceiptImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Convert to base64
  const base64 = await fileToBase64(file);

  // Compress image
  const compressed = await compressImage(base64);

  // Generate thumbnail
  const thumbnail = await generateThumbnail(base64);

  // Create receipt image object
  const receiptImage: ReceiptImage = {
    id: uuidv4(),
    data: compressed,
    mimeType: file.type,
    filename: file.name,
    uploadedAt: new Date().toISOString(),
    size: file.size,
    thumbnail,
  };

  return receiptImage;
}

/**
 * Calculate total size of receipt images
 *
 * @param images - Array of receipt images
 * @returns Total size in bytes
 */
export function calculateTotalImageSize(images: ReceiptImage[]): number {
  return images.reduce((total, img) => {
    // Approximate size of base64 string (includes data URI prefix)
    const base64Size = (img.data.length * 3) / 4;
    const thumbnailSize = img.thumbnail ? (img.thumbnail.length * 3) / 4 : 0;
    return total + base64Size + thumbnailSize;
  }, 0);
}

/**
 * Format file size for display
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Extract filename from receipt image
 *
 * @param image - Receipt image
 * @returns Sanitized filename
 */
export function getReceiptFilename(image: ReceiptImage): string {
  return image.filename || `receipt-${image.id}`;
}

/**
 * Check if image data is valid base64
 *
 * @param data - Base64 string to validate
 * @returns true if valid
 */
export function isValidBase64Image(data: string): boolean {
  try {
    // Check if it starts with data:image
    if (!data.startsWith('data:image')) {
      return false;
    }

    // Try to decode
    const base64Data = data.split(',')[1];
    if (!base64Data) {
      return false;
    }

    atob(base64Data);
    return true;
  } catch {
    return false;
  }
}
