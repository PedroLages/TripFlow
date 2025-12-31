/**
 * Receipt Viewer Modal
 *
 * Full-size image viewer for receipt images
 */

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import type { ReceiptImage } from '../../types';
import { formatFileSize, getReceiptFilename } from '../../utils/receiptImageHelpers';
import { format } from 'date-fns';

interface ReceiptViewerModalProps {
  images: ReceiptImage[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (imageId: string) => void;
}

export default function ReceiptViewerModal({
  images,
  initialIndex = 0,
  onClose,
  onDelete,
}: ReceiptViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.data;
    link.download = getReceiptFilename(currentImage);
    link.click();
  };

  const handleDelete = () => {
    if (!onDelete) return;

    if (confirm('Delete this receipt image? This cannot be undone.')) {
      onDelete(currentImage.id);

      // Move to previous image or close if none left
      if (images.length === 1) {
        onClose();
      } else if (currentIndex === images.length - 1) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.5));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/50 to-transparent z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-white">
            <h3 className="text-lg font-bold">{getReceiptFilename(currentImage)}</h3>
            <p className="text-sm text-white/70 mt-1">
              {format(new Date(currentImage.uploadedAt), 'MMM d, yyyy h:mm a')} • {formatFileSize(currentImage.size)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Zoom out"
              disabled={zoom <= 0.5}
            >
              <ZoomOut size={20} className="text-white" />
            </button>

            <span className="text-sm text-white font-medium min-w-[60px] text-center">
              {(zoom * 100).toFixed(0)}%
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Zoom in"
              disabled={zoom >= 3}
            >
              <ZoomIn size={20} className="text-white" />
            </button>

            {/* Download */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Download image"
            >
              <Download size={20} className="text-white" />
            </button>

            {/* Delete */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-3 bg-red-500/80 hover:bg-red-500 rounded-xl transition-colors"
                aria-label="Delete image"
              >
                <Trash2 size={20} className="text-white" />
              </button>
            )}

            {/* Close */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Close viewer"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Image */}
      <div
        className="max-w-7xl max-h-[80vh] overflow-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.data}
          alt={currentImage.filename}
          className="w-full h-auto transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
          }}
        />
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            disabled={currentIndex === 0}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous image"
          >
            <ChevronLeft size={32} className="text-white" />
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            disabled={currentIndex === images.length - 1}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next image"
          >
            <ChevronRight size={32} className="text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-6 right-6 text-xs text-white/50">
        Use ← → to navigate • ESC to close
      </div>
    </div>
  );
}
