import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UploadCloud,
  Star,
  Trash2,
  Edit2,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { managerApi } from '../../../services/manager/managerApi';
import { useToast } from '../../../context/ToastContext';
import { validateImageFile, sortImages } from '../../../utils/imageUtils';
import ImageWithFallback from '../../common/ImageWithFallback/ImageWithFallback';
import Button from '../../ui/Button/Button';
import Modal from '../../ui/Modal/Modal';
import ConfirmDialog from '../../ui/ConfirmDialog/ConfirmDialog';
import Input from '../../ui/Input/Input';
import EmptyState from '../../ui/EmptyState/EmptyState';
import Skeleton from '../../ui/Skeleton/Skeleton';
import styles from './ImageGalleryManager.module.css';

/**
 * ImageGalleryManager
 *
 * Reusable gallery management component for both Hotel and Room Type images.
 */
const ImageGalleryManager = ({
  type = 'hotel',
  roomTypeId,
  title = 'Image Gallery',
  description,
  onImagesChange,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Modals state
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [imageToEdit, setImageToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ alt_text: '', sort_order: 0 });
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch images
  const fetchImages = useCallback(async () => {
    if (type === 'room_type' && !roomTypeId) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const response =
        type === 'hotel'
          ? await managerApi.getHotelImages()
          : await managerApi.getRoomTypeImages(roomTypeId);

      const list = response.data?.data || [];
      const sorted = sortImages(list);
      setImages(sorted);
      if (onImagesChange) onImagesChange(sorted);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load images.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [type, roomTypeId, onImagesChange, showToast]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Handle files upload
  const uploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setErrorMessage(null);

    // Validate all files first
    for (const file of files) {
      const check = validateImageFile(file);
      if (!check.valid) {
        setErrorMessage(check.error);
        showToast(check.error, 'error');
        return;
      }
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatusText(`Uploading ${i + 1} of ${files.length}: ${file.name}...`);

      const formData = new FormData();
      formData.append('image', file);

      // If no images exist yet, make the first uploaded image primary by default
      if (images.length === 0 && i === 0) {
        formData.append('is_primary', '1');
      }

      try {
        if (type === 'hotel') {
          await managerApi.uploadHotelImage(formData);
        } else {
          await managerApi.uploadRoomTypeImage(roomTypeId, formData);
        }
        successCount++;
      } catch (err) {
        failCount++;
        const msg = err.response?.data?.message || `Failed to upload "${file.name}".`;
        showToast(msg, 'error');
      }
    }

    setUploading(false);
    setUploadStatusText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (successCount > 0) {
      showToast(
        successCount === 1
          ? 'Image uploaded successfully.'
          : `${successCount} images uploaded successfully.`,
        'success'
      );
      await fetchImages();
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  // Set as Primary
  const handleSetPrimary = async (image) => {
    if (image.is_primary) return;
    setIsUpdating(true);
    try {
      if (type === 'hotel') {
        await managerApi.updateHotelImage(image.id, { is_primary: true });
      } else {
        await managerApi.updateRoomTypeImage(image.id, { is_primary: true });
      }
      showToast('Primary image updated.', 'success');
      await fetchImages();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to set primary image.';
      showToast(msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = (image) => {
    setImageToEdit(image);
    setEditFormData({
      alt_text: image.alt_text || '',
      sort_order: image.sort_order ?? 0,
    });
  };

  // Save edit form
  const handleSaveEdit = async () => {
    if (!imageToEdit) return;
    setIsUpdating(true);
    try {
      const payload = {
        alt_text: editFormData.alt_text || null,
        sort_order: parseInt(editFormData.sort_order, 10) || 0,
      };

      if (type === 'hotel') {
        await managerApi.updateHotelImage(imageToEdit.id, payload);
      } else {
        await managerApi.updateRoomTypeImage(imageToEdit.id, payload);
      }

      showToast('Image details updated.', 'success');
      setImageToEdit(null);
      await fetchImages();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update image details.';
      showToast(msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete image
  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);
    try {
      if (type === 'hotel') {
        await managerApi.deleteHotelImage(imageToDelete.id);
      } else {
        await managerApi.deleteRoomTypeImage(imageToDelete.id);
      }
      showToast('Image deleted successfully.', 'success');
      setImageToDelete(null);
      await fetchImages();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete image.';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Upload Dropzone */}
      <div
        className={`${styles.uploadSection} ${dragActive ? styles.dragActive : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className={styles.fileInput}
          onChange={(e) => uploadFiles(e.target.files)}
          disabled={uploading}
        />

        <div className={styles.uploadInner}>
          <div className={styles.uploadIcon}>
            {uploading ? (
              <Loader2 size={36} className="animate-spin" />
            ) : (
              <UploadCloud size={36} />
            )}
          </div>
          <div>
            <h4 className={styles.uploadTitle}>
              {uploading ? 'Uploading images to Cloudflare R2...' : 'Click or drag images to upload'}
            </h4>
            <p className={styles.uploadHint}>
              JPG, PNG or WebP · Max 1 MB each
            </p>
          </div>

          {uploading && (
            <div className={styles.uploadProgress}>
              <span>{uploadStatusText}</span>
            </div>
          )}

          {!uploading && (
            <div className={styles.uploadActions}>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose files
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className={styles.errorMessage}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Gallery Header */}
      <div className={styles.galleryHeader}>
        <h3 className={styles.galleryTitle}>
          <span>{title}</span>
          <span className={styles.galleryCount}>
            ({images.length} {images.length === 1 ? 'photo' : 'photos'})
          </span>
        </h3>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.card}>
              <Skeleton height="180px" />
              <div style={{ padding: '0.875rem' }}>
                <Skeleton height="16px" width="60%" />
                <Skeleton height="32px" width="100%" style={{ marginTop: '0.75rem' }} />
              </div>
            </div>
          ))}
        </div>
      ) : images.length > 0 ? (
        /* Image Grid */
        <div className={styles.grid}>
          {images.map((img) => {
            const isPrimary = !!img.is_primary;
            return (
              <div
                key={img.id}
                className={`${styles.card} ${isPrimary ? styles.isPrimary : ''}`}
              >
                <div className={styles.imageWrapper}>
                  <ImageWithFallback
                    src={img.image_url}
                    alt={img.alt_text || 'Gallery photo'}
                    iconSize={32}
                  />

                  {isPrimary && (
                    <div className={styles.primaryBadge}>
                      <Star size={12} fill="currentColor" />
                      <span>Primary</span>
                    </div>
                  )}

                  <div className={styles.sortOrderBadge}>
                    <span>Order: {img.sort_order ?? 0}</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {img.alt_text ? (
                    <p className={styles.altText} title={img.alt_text}>
                      {img.alt_text}
                    </p>
                  ) : (
                    <p className={styles.altTextPlaceholder}>No description</p>
                  )}

                  <div className={styles.cardActions}>
                    {!isPrimary ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className={styles.actionButton}
                        onClick={() => handleSetPrimary(img)}
                        disabled={isUpdating}
                        title="Set as primary display photo"
                      >
                        <Star size={14} />
                        <span>Set Primary</span>
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className={styles.actionButton}
                        disabled
                      >
                        <CheckCircle2 size={14} color="#f59e0b" />
                        <span>Current Primary</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(img)}
                      disabled={isUpdating}
                      title="Edit description and order"
                      aria-label="Edit description and order"
                    >
                      <Edit2 size={14} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className={styles.deleteButton}
                      onClick={() => setImageToDelete(img)}
                      disabled={isUpdating}
                      title="Delete photo"
                      aria-label="Delete photo"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <EmptyState
          icon={ImageIcon}
          title="No images uploaded yet"
          description={
            description ||
            'Upload high-quality images to showcase this property on public listings.'
          }
          actionLabel="Upload first image"
          onAction={() => fileInputRef.current?.click()}
        />
      )}

      {/* Edit Image Modal */}
      <Modal
        title="Edit Image Details"
        isOpen={!!imageToEdit}
        onClose={() => setImageToEdit(null)}
        footer={
          <div className={styles.editActions}>
            <Button variant="secondary" onClick={() => setImageToEdit(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} isLoading={isUpdating}>
              Save changes
            </Button>
          </div>
        }
      >
        <div className={styles.editForm}>
          <div style={{ height: '160px', borderRadius: '8px', overflow: 'hidden' }}>
            <ImageWithFallback
              src={imageToEdit?.image_url}
              alt={imageToEdit?.alt_text || 'Photo preview'}
            />
          </div>

          <Input
            label="Alt Text / Description"
            placeholder="e.g. Spacious king room with city skyline view"
            value={editFormData.alt_text}
            onChange={(e) =>
              setEditFormData((prev) => ({ ...prev, alt_text: e.target.value }))
            }
          />

          <Input
            label="Sort Order"
            type="number"
            min="0"
            placeholder="0"
            value={editFormData.sort_order}
            onChange={(e) =>
              setEditFormData((prev) => ({ ...prev, sort_order: e.target.value }))
            }
          />
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!imageToDelete}
        title="Delete Image"
        message="Are you sure you want to delete this image? It will be permanently removed from Cloudflare R2 object storage."
        confirmText="Delete photo"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setImageToDelete(null)}
      />
    </div>
  );
};

export default ImageGalleryManager;
