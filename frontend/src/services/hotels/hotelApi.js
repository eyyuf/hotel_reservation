import apiClient from '../api/apiClient';

export const hotelApi = {
  getHotels: (params) => apiClient.get('/hotels', { params }),
  getHotel: (hotelId) => apiClient.get(`/hotels/${hotelId}`),
  getRoomTypes: (hotelId, params) => apiClient.get(`/hotels/${hotelId}/room-types`, { params }),
  getRoomType: (hotelId, roomTypeId) => apiClient.get(`/hotels/${hotelId}/room-types/${roomTypeId}`),
  getAvailability: (hotelId, params) => apiClient.get(`/hotels/${hotelId}/availability`, { params }),
};
