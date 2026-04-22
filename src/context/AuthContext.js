import * as React from 'react';
const { createContext, useState, useContext, useEffect } = React;
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLoggingOut = React.useRef(false);

  useEffect(() => {
    loadStoredAuth();

    // 🛡️ GLOBAL 401 INTERCEPTOR (LOGOUT ON SESSION EXPIRE)
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const isLoginRoute = error.config?.url?.includes('/v1/login') || error.config?.url?.includes('/v1/register');
        
        // 🚨 ONLY logout if 401 error, not a login route, we HAVE a user, and NOT already logging out
        if (error.response?.status === 401 && !isLoginRoute && user && !isLoggingOut.current) {
          console.log('401 detected, logging out...');
          await logout(true); // pass true to indicate it was triggered by 401
        }
        return Promise.reject(error);
      }
    );

    return () => apiClient.interceptors.response.eject(interceptor);
  }, [user]); // Re-bind interceptor when user changes to have correct 'user' in scope

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/v1/login', { email, password });
      if (response.data.success) {
        const { user: userData, token: authToken } = response.data;
        
        // ⚡ SET HEADER FIRST to avoid race conditions
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        
        setUser(userData);
        setToken(authToken);
        
        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra kết nối mạng.';
      return { success: false, message };
    }
  };

  const register = async (name, email, password, passwordConfirmation) => {
    try {
      const response = await apiClient.post('/v1/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      if (response.data.success) {
        const { user: userData, token: authToken } = response.data;
        
        // ⚡ SET HEADER FIRST
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        
        setUser(userData);
        setToken(authToken);
        
        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại.';
      return { success: false, message };
    }
  };

  const logout = async (isFromInterceptor = false) => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    try {
      // Only call server logout if NOT already triggered by a 401 interceptor
      if (!isFromInterceptor && token) {
        await apiClient.post('/v1/logout');
      }
    } catch (error) {
      // Ignore logout API errors
    } finally {
      setUser(null);
      setToken(null);
      delete apiClient.defaults.headers.common['Authorization'];
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      isLoggingOut.current = false;
    }
  };

  const socialLogin = async (userData, authToken) => {
    try {
      // ⚡ SET HEADER FIRST
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      setUser(userData);
      setToken(authToken);
      
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Lỗi lưu thông tin đăng nhập.' };
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await apiClient.put('/v1/profile', data);
      if (response.data.success) {
        setUser(response.data.user);
        await AsyncStorage.setItem('auth_user', JSON.stringify(response.data.user));
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: 'Cập nhật thất bại.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isLoggedIn: !!user,
      login, register, logout, updateProfile, socialLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
