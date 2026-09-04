import apiClient from '../api/apiClient';

let inFlightMePromise = null;
let cachedUser = null;
let cachedToken = null;

// Initialize cache from sessionStorage if valid
try {
  const storedUser = sessionStorage.getItem('auth_user');
  const storedToken = localStorage.getItem('auth_token');
  if (storedUser && storedToken) {
    cachedUser = JSON.parse(storedUser);
    cachedToken = storedToken;
  }
} catch {
  // Ignore parsing errors
}

export const authApi = {
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  getMe: (forceRefresh = false) => {
    const currentToken = localStorage.getItem('auth_token');
    if (!currentToken) {
      cachedUser = null;
      cachedToken = null;
      inFlightMePromise = null;
      return Promise.reject(new Error('No authentication token found'));
    }

    // Return cached user if we already verified this token in the current session
    if (!forceRefresh && cachedToken === currentToken && cachedUser) {
      return Promise.resolve({
        data: {
          user: cachedUser,
          data: cachedUser,
        },
      });
    }

    // Deduplicate in-flight /auth/me requests
    if (inFlightMePromise) {
      return inFlightMePromise;
    }

    inFlightMePromise = apiClient.get('/auth/me')
      .then((response) => {
        const user = response.data?.user ?? response.data?.data ?? response.data;
        cachedUser = user;
        cachedToken = currentToken;
        try {
          sessionStorage.setItem('auth_user', JSON.stringify(user));
        } catch {
          // Ignore storage quota errors
        }
        return response;
      })
      .catch((error) => {
        cachedUser = null;
        cachedToken = null;
        try {
          sessionStorage.removeItem('auth_user');
        } catch {
          // Ignore storage errors
        }
        throw error;
      })
      .finally(() => {
        inFlightMePromise = null;
      });

    return inFlightMePromise;
  },
  updateProfile: (data) => apiClient.patch('/auth/profile', data),
  setCachedUser: (user, token) => {
    cachedUser = user;
    cachedToken = token;
    try {
      if (user && token) {
        sessionStorage.setItem('auth_user', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('auth_user');
      }
    } catch {
      // Ignore storage errors
    }
  },
  clearAuthCache: () => {
    cachedUser = null;
    cachedToken = null;
    inFlightMePromise = null;
    try {
      sessionStorage.removeItem('auth_user');
    } catch {
      // Ignore storage errors
    }
  },
  getCachedUser: () => cachedUser,
};
