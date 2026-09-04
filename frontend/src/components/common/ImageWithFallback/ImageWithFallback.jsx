import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import styles from './ImageWithFallback.module.css';

/**
 * ImageWithFallback
 * 
 * Safely renders an image with lazy loading and falls back to a custom
 * icon / placeholder if the image fails to load or no source is provided.
 */
const ImageWithFallback = ({
  src,
  alt = '',
  fallbackIcon: FallbackIcon = ImageIcon,
  fallbackText,
  className = '',
  imgClassName = '',
  aspectRatio,
  style = {},
  loading = 'lazy',
  objectFit = 'cover',
  iconSize = 36,
  onLoad,
  onError,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset states if src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const handleLoad = (e) => {
    setLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setError(true);
    if (onError) onError(e);
  };

  const wrapperStyle = {
    ...style,
    ...(aspectRatio ? { aspectRatio } : {}),
  };

  const showFallback = !src || error;

  return (
    <div className={`${styles.wrapper} ${className}`} style={wrapperStyle}>
      {showFallback ? (
        <div className={styles.placeholder}>
          <FallbackIcon size={iconSize} className={styles.placeholderIcon} />
          {fallbackText && <span className={styles.placeholderText}>{fallbackText}</span>}
        </div>
      ) : (
        <>
          {!loaded && (
            <div className={styles.placeholder}>
              <FallbackIcon size={iconSize} className={styles.placeholderIcon} />
            </div>
          )}
          <img
            src={src}
            alt={alt}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
            className={`${styles.image} ${loaded ? styles.loaded : ''} ${imgClassName}`}
            style={{ objectFit }}
          />
        </>
      )}
    </div>
  );
};

export default ImageWithFallback;
