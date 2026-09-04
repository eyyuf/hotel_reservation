import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Building } from 'lucide-react';
import ImageWithFallback from '../ImageWithFallback/ImageWithFallback';
import Modal from '../../ui/Modal/Modal';
import { getPrimaryImage, sortImages } from '../../../utils/imageUtils';
import styles from './ImageGalleryViewer.module.css';

/**
 * ImageGalleryViewer
 *
 * Public hero gallery with image navigation, thumbnail row, and lightbox viewer.
 */
const ImageGalleryViewer = ({
  images = [],
  hotelName = '',
  fallbackIcon = Building,
  className = '',
}) => {
  const sorted = sortImages(images);
  const primary = getPrimaryImage(sorted);

  // Initialize active index with primary image index
  const initialIndex = primary
    ? sorted.findIndex((img) => img.id === primary.id)
    : 0;

  const [activeIndex, setActiveIndex] = useState(Math.max(0, initialIndex));
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (primary) {
      const idx = sorted.findIndex((img) => img.id === primary.id);
      setActiveIndex(Math.max(0, idx));
    } else {
      setActiveIndex(0);
    }
  }, [images]);

  if (!sorted || sorted.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.heroWrapper}>
          <ImageWithFallback
            src={null}
            fallbackIcon={fallbackIcon}
            iconSize={64}
            fallbackText="No photos available yet"
          />
        </div>
      </div>
    );
  }

  const currentImage = sorted[activeIndex] || sorted[0];

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : sorted.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < sorted.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Hero Image */}
      <div
        className={styles.heroWrapper}
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Click to enlarge photo"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setLightboxOpen(true);
          }
        }}
      >
        <ImageWithFallback
          src={currentImage.image_url}
          alt={currentImage.alt_text || `${hotelName} photo ${activeIndex + 1}`}
          fallbackIcon={fallbackIcon}
          iconSize={64}
          className={styles.heroImage}
        />

        {sorted.length > 1 && (
          <>
            <button
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={handlePrev}
              aria-label="Previous photo"
              type="button"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={handleNext}
              aria-label="Next photo"
              type="button"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <button
          className={styles.expandButton}
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          aria-label="View enlarged photo"
          type="button"
        >
          <Maximize2 size={16} />
        </button>

        {currentImage.alt_text && (
          <div className={styles.caption}>
            <span>{currentImage.alt_text}</span>
          </div>
        )}

        <div className={styles.imageCounter}>
          {activeIndex + 1} / {sorted.length}
        </div>
      </div>

      {/* Thumbnail Strip (if multiple photos) */}
      {sorted.length > 1 && (
        <div className={styles.thumbnailRow}>
          {sorted.map((img, idx) => (
            <div
              key={img.id || idx}
              className={`${styles.thumbnail} ${
                idx === activeIndex ? styles.active : ''
              }`}
              onClick={() => setActiveIndex(idx)}
              role="button"
              tabIndex={0}
              aria-label={`Thumbnail ${idx + 1}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveIndex(idx);
                }
              }}
            >
              <ImageWithFallback
                src={img.image_url}
                alt={img.alt_text || `Thumbnail ${idx + 1}`}
                fallbackIcon={fallbackIcon}
                iconSize={20}
              />
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <Modal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={`${hotelName} (${activeIndex + 1} of ${sorted.length})`}
      >
        <div className={styles.lightboxOverlay}>
          <img
            src={currentImage.image_url}
            alt={currentImage.alt_text || hotelName}
            className={styles.lightboxImage}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ImageGalleryViewer;
