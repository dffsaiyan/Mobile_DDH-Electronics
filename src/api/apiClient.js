import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
export const BASE_URL = 'http://192.168.31.8:8000/api'; 
export const IMAGE_BASE_URL = 'http://192.168.31.8:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Thêm interceptor để tự động chèn token vào header Authorization
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
