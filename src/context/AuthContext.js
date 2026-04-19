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

  useEffect(() => {
    loadStoredAuth();
  }, []);

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
        setUser(userData);
        setToken(authToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
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
        setUser(userData);
        setToken(authToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
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

  const logout = async () => {
    try {
      await apiClient.post('/v1/logout');
    } catch (error) {
      // Ignore logout API errors
    }
    setUser(null);
    setToken(null);
    delete apiClient.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  };

  const socialLogin = async (userData, authToken) => {
    try {
      setUser(userData);
      setToken(authToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      console.error('Social Login Error:', error);
      return { success: false, message: 'Lỗi lưu thông tin đăng nhập.' };
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await apiClient.put('/v1/profile', data);
      if (response.data.success) {
        setUser(response.data.data);
        await AsyncStorage.setItem('auth_user', JSON.stringify(response.data.data));
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
