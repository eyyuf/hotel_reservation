import apiClient from '../api/apiClient';

const inFlightReceptionistReservations = new Map();

export const receptionistApi = {
  getReservations: (params) => {
    const key = JSON.stringify(params || {});
    if (inFlightReceptionistReservations.has(key)) {
      return inFlightReceptionistReservations.get(key);
    }

    const promise = apiClient.get('/receptionist/reservations', { params })
      .finally(() => {
        inFlightReceptionistReservations.delete(key);
      });

    inFlightReceptionistReservations.set(key, promise);
    return promise;
  },
  createReservation: (data) => apiClient.post('/receptionist/reservations', data),
  getReservation: (id) => apiClient.get(`/receptionist/reservations/${id}`),
  updateReservation: (id, data) => apiClient.patch(`/receptionist/reservations/${id}`, data),
  cancelReservation: (id, data) => apiClient.post(`/receptionist/reservations/${id}/cancel`, data),
  getPayments: (reservationId) => apiClient.get(`/receptionist/reservations/${reservationId}/payments`),
  recordPayment: (reservationId, data) => apiClient.post(`/receptionist/reservations/${reservationId}/payments`, data),
  getInvoice: (reservationId) => apiClient.get(`/receptionist/reservations/${reservationId}/invoice`),
  checkIn: (reservationId) => apiClient.post(`/receptionist/reservations/${reservationId}/check-in`),
  checkOut: (reservationId) => apiClient.post(`/receptionist/reservations/${reservationId}/check-out`),
};
