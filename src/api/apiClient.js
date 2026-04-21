import axios from 'axios';

// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
export const BASE_URL = 'https://ddh-electronics.loca.lt/api'; 
export const IMAGE_BASE_URL = 'https://ddh-electronics.loca.lt';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Bypass-Tunnel-Reminder': 'true', // Header quan trọng để bypass trang cảnh báo của Localtunnel
  },
});

export default apiClient;
