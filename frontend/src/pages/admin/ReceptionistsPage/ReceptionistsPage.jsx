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
import styles from './ReceptionistsPage.module.css';

export default function ReceptionistsPage() {
  const [receptionists, setReceptionists] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '' });
  const { showToast } = useToast();

  const loadData = () => {
    managerApi.getReceptionists().then(res => {
      const raw = res.data?.data;
      setReceptionists(Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []));
    }).catch(console.error);
  };
  useEffect(() => { loadData(); }, []);

  const handleToggle = () => {
    const newStatus = selectedRec.account_status === 'active' ? 'inactive' : 'active';
    managerApi.updateReceptionistStatus(selectedRec.user_id, { account_status: newStatus })
      .then(() => {
        showToast('Status updated', 'success');
        loadData();
      })
      .finally(() => setConfirmOpen(false));
  };

  const handleCreate = () => {
    managerApi.createReceptionist(formData)
      .then(() => {
        showToast('Receptionist created', 'success');
        setModalOpen(false);
        setFormData({ first_name: '', last_name: '', email: '', phone: '', password: '' });
        loadData();
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Error creating receptionist';
        showToast(msg, 'error');
      });
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'account_status', label: 'Status', render: (r) => <Badge variant={r.account_status === 'active' ? 'success' : 'error'}>{r.account_status}</Badge> },
    { key: 'actions', label: 'Actions', render: (r) => (
      <Button variant="secondary" size="sm" onClick={() => { setSelectedRec(r); setConfirmOpen(true); }}>
        {r.account_status === 'active' ? 'Suspend' : 'Activate'}
      </Button>
    )},
  ];

  return (
    <div className={styles.container}>
      <PageHeader 
        title="Receptionists" 
        description="Manage front-desk staff."
        action={{ label: 'Add receptionist', onClick: () => setModalOpen(true) }}
      />
      <Table columns={columns} data={receptionists} emptyMessage="No receptionists yet." />
      
      <Modal title="Add Receptionist" isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className={styles.form}>
          <Input label="First Name" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
          <Input label="Last Name" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <Input label="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <Button onClick={handleCreate}>Create receptionist</Button>
        </div>
      </Modal>

      <ConfirmDialog 
        title="Toggle Receptionist Status" 
        message={`Are you sure you want to ${selectedRec?.account_status === 'active' ? 'suspend' : 'activate'} ${selectedRec?.first_name} ${selectedRec?.last_name}?`}
        isOpen={confirmOpen}
        onConfirm={handleToggle} 
        onClose={() => setConfirmOpen(false)} 
      />
    </div>
  );
}
