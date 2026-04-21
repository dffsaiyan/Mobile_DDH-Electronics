import axios from 'axios';

// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
export const BASE_URL = 'http://10.248.100.223:8000/api'; 
export const IMAGE_BASE_URL = 'http://10.248.100.223:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default apiClient;
