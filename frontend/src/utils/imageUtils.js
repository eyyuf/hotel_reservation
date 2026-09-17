/**
 * Utilities for image handling, sorting, and validation.
 */

export const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Returns the primary image from an array of images.
 * Falls back to the first image if no image is explicitly marked primary.
 *
 * @param {Array} images
 * @returns {Object|null}
 */
export const getPrimaryImage = (images) => {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const primary = images.find(
    (img) => img && (img.is_primary === true || img.is_primary === 1 || img.is_primary === '1')
  );

  return primary || images[0] || null;
};

/**
 * Sorts images by sort_order (asc), then id (asc).
 *
 * @param {Array} images
 * @returns {Array}
 */
export const sortImages = (images) => {
  if (!Array.isArray(images)) return [];
  return [...images].sort((a, b) => {
    const orderA = a.sort_order ?? 0;
    const orderB = b.sort_order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (a.id ?? 0) - (b.id ?? 0);
  });
};

/**
 * Validates an image file before upload.
 *
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const isAllowedType = ALLOWED_IMAGE_TYPES.includes(fileType) || hasAllowedExt;

  if (!isAllowedType) {
    return {
      valid: false,
      error: `"${file.name}" has an unsupported format. Allowed formats: JPEG, PNG, WebP.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `"${file.name}" is ${sizeMb}MB. Maximum allowed file size is 1MB.`,
    };
  }

  return { valid: true };
};
