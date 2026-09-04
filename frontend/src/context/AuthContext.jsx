import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../services/auth/authApi';

const AuthContext = createContext(null);

const getInitialUser = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  try {
    const raw = sessionStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();
const hasToken = !!localStorage.getItem('auth_token');

const initialState = {
  user: initialUser,
  token: localStorage.getItem('auth_token') || null,
  isAuthenticated: hasToken,
  isLoading: hasToken && !initialUser,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        isLoading: false,
      };
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: action.payload.user,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let isCancelled = false;

    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await authApi.getMe();
          if (isCancelled) return;
          const user = response.data?.user ?? response.data?.data ?? response.data;
          dispatch({
            type: 'INITIALIZE',
            payload: {
              isAuthenticated: true,
              user,
            },
          });
        } catch {
          if (isCancelled) return;
          localStorage.removeItem('auth_token');
          authApi.clearAuthCache();
          dispatch({
            type: 'INITIALIZE',
            payload: { isAuthenticated: false, user: null },
          });
        }
      } else {
        authApi.clearAuthCache();
        dispatch({
          type: 'INITIALIZE',
          payload: { isAuthenticated: false, user: null },
        });
      }
    };

    initializeAuth();

    return () => {
      isCancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('auth_token', token);
      authApi.setCachedUser(user, token);
      dispatch({ type: 'LOGIN', payload: { token, user } });
      return user;
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid credentials. Please try again.';
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (data) => {
    await authApi.register(data);
    return login(data.email, data.password);
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem('auth_token');
      authApi.clearAuthCache();
      dispatch({ type: 'LOGOUT' });
      window.location.href = '/login';
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    const response = await authApi.updateProfile(data);
    const updatedUser = response.data?.user ?? response.data?.data ?? response.data;
    const token = localStorage.getItem('auth_token');
    authApi.setCachedUser(updatedUser, token);
    dispatch({ type: 'UPDATE_PROFILE', payload: { user: updatedUser } });
    return updatedUser;
  }, []);

  const contextValue = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    updateProfile,
  }), [state, login, register, logout, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
