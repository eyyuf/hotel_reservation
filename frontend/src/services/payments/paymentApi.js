import apiClient from '../api/apiClient';

export const paymentApi = {
  getPayment: (paymentId) => apiClient.get(`/guest/payments/${paymentId}`),
  
};
