import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/layout/PageHeader/PageHeader';
import { managerApi } from '../../../services/manager/managerApi';
import Table from '../../../components/ui/Table/Table';
import Button from '../../../components/ui/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import Modal from '../../../components/ui/Modal/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import Input from '../../../components/ui/Input/Input';
import { useToast } from '../../../context/ToastContext';
import styles from './RoomTypesPage.module.css';

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', base_price: '', capacity: '', total_rooms: '' });
  const { showToast } = useToast();

  const loadData = () => {
    managerApi.getRoomTypes().then(res => {
      const raw = res.data?.data;
      const list = Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []);
      setRoomTypes(list);
    }).catch(console.error);
  };
  useEffect(() => { loadData(); }, []);

  const handleToggle = () => {
    const newStatus = selectedRoomType.status === 'active' ? 'inactive' : 'active';
    managerApi.updateRoomTypeStatus(selectedRoomType.room_type_id, { status: newStatus })
      .then(() => {
        showToast('Status updated successfully', 'success');
        loadData();
      })
      .catch(() => showToast('Error updating status', 'error'))
      .finally(() => setConfirmOpen(false));
  };

  const handleCreate = () => {
    const payload = {
      name: formData.name,
      description: formData.description || null,
      base_price: parseFloat(formData.base_price) || 0,
      capacity: parseInt(formData.capacity) || 1,
      total_rooms: parseInt(formData.total_rooms) || 0,
    };
    managerApi.createRoomType(payload)
      .then(() => {
        showToast('Room type created', 'success');
        setModalOpen(false);
        setFormData({ name: '', description: '', base_price: '', capacity: '', total_rooms: '' });
        loadData();
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Error creating room type';
        showToast(msg, 'error');
      });
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'base_price', label: 'Base Price' },
    { key: 'total_rooms', label: 'Total Rooms' },
    { key: 'status', label: 'Status', render: (rt) => <Badge variant={rt.status === 'active' ? 'success' : 'error'}>{rt.status}</Badge> },
    { key: 'actions', label: 'Actions', render: (rt) => (
      <Button variant="secondary" size="sm" onClick={() => { setSelectedRoomType(rt); setConfirmOpen(true); }}>
        {rt.status === 'active' ? 'Deactivate' : 'Activate'}
      </Button>
    )},
  ];

  return (
    <div className={styles.container}>
      <PageHeader 
        title="Room Types" 
        description="Manage your hotel's room types."
        action={{ label: 'Add room type', onClick: () => setModalOpen(true) }}
      />
      <Table columns={columns} data={roomTypes} emptyMessage="No room types yet. Click 'Add room type' to get started." />
      
      <Modal title="Add Room Type" isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className={styles.form}>
          <Input label="Name" placeholder="e.g. Deluxe Suite" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <Input label="Description" placeholder="Optional description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <Input label="Base Price" type="number" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} />
          <Input label="Capacity" type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
          <Input label="Total Rooms" type="number" value={formData.total_rooms} onChange={e => setFormData({...formData, total_rooms: e.target.value})} />
          <Button onClick={handleCreate}>Create room type</Button>
        </div>
      </Modal>

      <ConfirmDialog 
        title="Confirm Action" 
        message={`Are you sure you want to ${selectedRoomType?.status === 'active' ? 'deactivate' : 'activate'} "${selectedRoomType?.name}"?`}
        isOpen={confirmOpen}
        onConfirm={handleToggle} 
        onClose={() => setConfirmOpen(false)} 
      />
    </div>
  );
}
