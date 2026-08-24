import apiClient from '../api/apiClient';

export const reservationApi = {
  getReservations: (params) => apiClient.get('/guest/reservations', { params }),
  createReservation: (data) => apiClient.post('/guest/reservations', data),
  getReservation: (id) => apiClient.get(`/guest/reservations/${id}`),
  cancelReservation: (id) => apiClient.post(`/guest/reservations/${id}/cancel`),
  getInvoice: (reservationId) => apiClient.get(`/guest/reservations/${reservationId}/invoice`),
  getPayments: (reservationId) => apiClient.get(`/guest/reservations/${reservationId}/payments`),
  createPayment: (reservationId, data) => apiClient.post(`/guest/reservations/${reservationId}/payments`, data),
};
