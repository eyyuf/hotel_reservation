export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  
  // Guest Routes
  HOTELS: '/hotels',
  HOTEL_DETAILS: (id) => `/hotels/${id || ':id'}`,
  RESERVATIONS: '/reservations',
  RESERVATION_DETAILS: (id) => `/reservations/${id || ':id'}`,
  
  // Receptionist Routes
  RECEPTIONIST_DASHBOARD: '/receptionist',
  RECEPTIONIST_RESERVATIONS: '/receptionist/reservations',
  
  // Manager Routes
  MANAGER_DASHBOARD: '/manager',
  MANAGER_HOTEL: '/manager/hotel',
  MANAGER_ROOM_TYPES: '/manager/room-types',
  MANAGER_RECEPTIONISTS: '/manager/receptionists',
  MANAGER_REPORTS: '/manager/reports',
  
  // Super Admin Routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_HOTELS: '/admin/hotels',
  ADMIN_MANAGERS: '/admin/managers',
  ADMIN_REPORTS: '/admin/reports',
};
