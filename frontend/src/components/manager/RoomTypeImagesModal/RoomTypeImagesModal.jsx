import React from 'react';
import Modal from '../../ui/Modal/Modal';
import ImageGalleryManager from '../ImageGalleryManager/ImageGalleryManager';
import styles from './RoomTypeImagesModal.module.css';

/**
 * RoomTypeImagesModal
 *
 * Dedicated modal for managing room-type images from the room types table.
 */
const RoomTypeImagesModal = ({ isOpen, onClose, roomType, onImagesChange }) => {
  if (!roomType) return null;

  const roomTypeId = roomType.room_type_id || roomType.id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Room Type Photos — ${roomType.name}`}
    >
      <div className={styles.content}>
        <div className={styles.roomHeader}>
          <div className={styles.roomInfo}>
            <h4 className={styles.roomName}>{roomType.name}</h4>
            <p className={styles.roomMeta}>
              Capacity: {roomType.capacity || 1} {roomType.capacity === 1 ? 'Guest' : 'Guests'} • Base Price: ETB {roomType.base_price || 0}
            </p>
          </div>
        </div>

        <ImageGalleryManager
          type="room_type"
          roomTypeId={roomTypeId}
          title={`${roomType.name} Photos`}
          description={`Upload photos specific to the "${roomType.name}" room type to show guests what to expect.`}
          onImagesChange={onImagesChange}
        />
      </div>
    </Modal>
  );
};

export default RoomTypeImagesModal;
