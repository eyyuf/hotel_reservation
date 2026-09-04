import apiClient from '../api/apiClient';

const inFlightGetReservations = new Map();
const inFlightGetReservation = new Map();
const inFlightInvoices = new Map();
const inFlightPayments = new Map();

export const reservationApi = {
  getReservations: (params) => {
    const key = JSON.stringify(params || {});
    if (inFlightGetReservations.has(key)) {
      return inFlightGetReservations.get(key);
    }

    const promise = apiClient.get('/guest/reservations', { params })
      .finally(() => {
        inFlightGetReservations.delete(key);
      });

    inFlightGetReservations.set(key, promise);
    return promise;
  },

  createReservation: (data) => apiClient.post('/guest/reservations', data),

  getReservation: (id) => {
    const key = String(id);
    if (inFlightGetReservation.has(key)) {
      return inFlightGetReservation.get(key);
    }

    const promise = apiClient.get(`/guest/reservations/${id}`)
      .finally(() => {
        inFlightGetReservation.delete(key);
      });

    inFlightGetReservation.set(key, promise);
    return promise;
  },

  cancelReservation: (id) => apiClient.post(`/guest/reservations/${id}/cancel`),

  getInvoice: (reservationId) => {
    const key = String(reservationId);
    if (inFlightInvoices.has(key)) {
      return inFlightInvoices.get(key);
    }

    const promise = apiClient.get(`/guest/reservations/${reservationId}/invoice`)
      .finally(() => {
        inFlightInvoices.delete(key);
      });

    inFlightInvoices.set(key, promise);
    return promise;
  },

  getPayments: (reservationId) => {
    const key = String(reservationId);
    if (inFlightPayments.has(key)) {
      return inFlightPayments.get(key);
    }

    const promise = apiClient.get(`/guest/reservations/${reservationId}/payments`)
      .finally(() => {
        inFlightPayments.delete(key);
      });

    inFlightPayments.set(key, promise);
    return promise;
  },

  createPayment: (reservationId, data) => apiClient.post(`/guest/reservations/${reservationId}/payments`, data),
};
