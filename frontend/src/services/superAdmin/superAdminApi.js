import apiClient from '../api/apiClient';

export const superAdminApi = {
  getHotels: (params) => apiClient.get('/super-admin/hotels', { params }),
  createHotel: (data) => apiClient.post('/super-admin/hotels', data),
  getHotel: (id) => apiClient.get(`/super-admin/hotels/${id}`),
  updateHotel: (id, data) => apiClient.patch(`/super-admin/hotels/${id}`, data),
  updateHotelStatus: (id, data) => apiClient.patch(`/super-admin/hotels/${id}/status`, data),
  getManagers: (hotelId, params) => apiClient.get(`/super-admin/hotels/${hotelId}/managers`, { params }),
  createManager: (hotelId, data) => apiClient.post(`/super-admin/hotels/${hotelId}/managers`, data),
  getManager: (id) => apiClient.get(`/super-admin/managers/${id}`),
  updateManager: (id, data) => apiClient.patch(`/super-admin/managers/${id}`, data),
  updateManagerStatus: (id, data) => apiClient.patch(`/super-admin/managers/${id}/status`, data),
  getReports: () => apiClient.get('/super-admin/reports'),
};
