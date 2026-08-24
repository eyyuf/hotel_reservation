import apiClient from '../api/apiClient';

export const managerApi = {
  getHotel: () => apiClient.get('/manager/hotel'),
  updateHotel: (data) => apiClient.patch('/manager/hotel', data),
  getReceptionists: (params) => apiClient.get('/manager/receptionists', { params }),
  createReceptionist: (data) => apiClient.post('/manager/receptionists', data),
  getReceptionist: (id) => apiClient.get(`/manager/receptionists/${id}`),
  updateReceptionist: (id, data) => apiClient.patch(`/manager/receptionists/${id}`, data),
  updateReceptionistStatus: (id, data) => apiClient.patch(`/manager/receptionists/${id}/status`, data),
  getRoomTypes: (params) => apiClient.get('/manager/room-types', { params }),
  createRoomType: (data) => apiClient.post('/manager/room-types', data),
  getRoomType: (id) => apiClient.get(`/manager/room-types/${id}`),
  updateRoomType: (id, data) => apiClient.patch(`/manager/room-types/${id}`, data),
  updateRoomTypeStatus: (id, data) => apiClient.patch(`/manager/room-types/${id}/status`, data),
  getReservations: (params) => apiClient.get('/manager/reservations', { params }),
  getPayments: (params) => apiClient.get('/manager/payments', { params }),
  getInvoices: (params) => apiClient.get('/manager/invoices', { params }),
  getInvoice: (id) => apiClient.get(`/manager/invoices/${id}`),
  getReports: () => apiClient.get('/manager/reports'),
};
