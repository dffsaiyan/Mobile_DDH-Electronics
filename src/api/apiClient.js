import axios from 'axios';

// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
export const BASE_URL = 'https://ddh-electronics.powercapital-hk.space/api'; 
export const IMAGE_BASE_URL = 'https://ddh-electronics.powercapital-hk.space';

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
      // Việt hóa lỗi Unauthenticated từ Server
      if (error.response.data) {
        error.response.data.message = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
