/**
 * Receipt Image Uploader Component
 *
 * Interface for uploading and managing receipt images for expenses
 */

import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import type { ReceiptImage } from '../types';
import { processReceiptImage, formatFileSize } from '../utils/receiptImageHelpers';

interface ReceiptImageUploaderProps {
  images: ReceiptImage[];
  onImagesChange: (images: ReceiptImage[]) => void;
  maxImages?: number;
}

export function ReceiptImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
}: ReceiptImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      const newImages: ReceiptImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check max images limit
        if (images.length + newImages.length >= maxImages) {
          setError(`Maximum ${maxImages} images allowed`);
          break;
        }

        try {
          const receiptImage = await processReceiptImage(file);
          newImages.push(receiptImage);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to process image');
          break;
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    } finally {
      setIsUploading(false);

      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imageId: string) => {
    onImagesChange(images.filter(img => img.id !== imageId));
    setError('');
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Camera Capture */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={!canAddMore || isUploading}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Take Photo
          </span>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={!canAddMore || isUploading}
          />
        </button>

        {/* File Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAddMore || isUploading}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Upload Image
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={!canAddMore || isUploading}
          />
        </button>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            Processing image...
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Image Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 group"
            >
              <img
                src={image.thumbnail || image.data}
                alt={image.filename}
                className="w-full h-full object-cover"
              />

              {/* Overlay with filename and size */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <ImageIcon className="w-6 h-6 text-white mb-2" />
                <p className="text-xs text-white text-center truncate w-full px-2">
                  {image.filename}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  {formatFileSize(image.size)}
                </p>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id)}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {images.length} of {maxImages} images • JPEG, PNG, WebP • Max 10MB per image
      </p>
    </div>
  );
}
