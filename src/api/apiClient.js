import axios from 'axios';

// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
export const BASE_URL = 'https://ddh-electronics.powercapital-hk.space/api'; 
export const IMAGE_BASE_URL = 'https://ddh-electronics.powercapital-hk.space';

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) {
    // Sửa lỗi mapping IP local nếu có
    return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
  }
  return `${IMAGE_BASE_URL}/${path.replace('public/', '')}`;
};

export const getUserAvatar = (user) => {
  if (user?.social_avatar) return user.social_avatar;
  if (user?.avatar) {
    if (user.avatar.startsWith('http')) return user.avatar;
    return `${IMAGE_BASE_URL}/${user.avatar.replace('public/', '')}`;
  }
  // Default avatar if none
  return `${IMAGE_BASE_URL}/images/avatars/1776311457.jpg`;
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// 🛡️ GLOBAL ERROR INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only overwrite the message if it's NOT a login attempt
      const isLoginRoute = error.config?.url?.includes('/v1/login');
      
      if (!isLoginRoute && error.response.data) {
        error.response.data.message = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
