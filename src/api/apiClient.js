import axios from 'axios';

// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
export const BASE_URL = 'https://emission-theology-scrooge.ngrok-free.dev/api'; 
export const IMAGE_BASE_URL = 'https://emission-theology-scrooge.ngrok-free.dev';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default apiClient;
