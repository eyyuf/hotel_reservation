import apiClient from '../api/apiClient';

export const paymentApi = {
  getPayment: (paymentId) => apiClient.get(`/guest/payments/${paymentId}`),
  initializePayment: (paymentId) => apiClient.post(`/guest/payments/${paymentId}/initialize`),
  verifyPayment: (txRef) => apiClient.get(`/payments/chapa/verify/${txRef}`),
};
