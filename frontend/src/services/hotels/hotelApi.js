import apiClient from '../api/apiClient';

// In-memory cache for hotel entities and in-flight promises
const hotelCache = new Map(); // hotelId -> { data, timestamp }
const roomTypeCache = new Map(); // `${hotelId}:${roomTypeId}` -> { data, timestamp }
const inFlightHotelRequests = new Map(); // hotelId -> Promise
const inFlightRoomTypeRequests = new Map(); // `${hotelId}:${roomTypeId}` -> Promise

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

export const hotelApi = {
  getHotels: (params) => apiClient.get('/hotels', { params }),

  getHotel: (hotelId) => {
    const key = String(hotelId);
    const cached = hotelCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return Promise.resolve(cached.data);
    }

    if (inFlightHotelRequests.has(key)) {
      return inFlightHotelRequests.get(key);
    }

    const promise = apiClient.get(`/hotels/${hotelId}`)
      .then((response) => {
        hotelCache.set(key, { data: response, timestamp: Date.now() });
        return response;
      })
      .finally(() => {
        inFlightHotelRequests.delete(key);
      });

    inFlightHotelRequests.set(key, promise);
    return promise;
  },

  getRoomTypes: (hotelId, params) => apiClient.get(`/hotels/${hotelId}/room-types`, { params }),

  getRoomType: (hotelId, roomTypeId) => {
    const key = `${hotelId}:${roomTypeId}`;
    const cached = roomTypeCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return Promise.resolve(cached.data);
    }

    if (inFlightRoomTypeRequests.has(key)) {
      return inFlightRoomTypeRequests.get(key);
    }

    const promise = apiClient.get(`/hotels/${hotelId}/room-types/${roomTypeId}`)
      .then((response) => {
        roomTypeCache.set(key, { data: response, timestamp: Date.now() });
        return response;
      })
      .finally(() => {
        inFlightRoomTypeRequests.delete(key);
      });

    inFlightRoomTypeRequests.set(key, promise);
    return promise;
  },

  getAvailability: (hotelId, params) => apiClient.get(`/hotels/${hotelId}/availability`, { params }),

  clearHotelCache: () => {
    hotelCache.clear();
    roomTypeCache.clear();
    inFlightHotelRequests.clear();
    inFlightRoomTypeRequests.clear();
  },
};

