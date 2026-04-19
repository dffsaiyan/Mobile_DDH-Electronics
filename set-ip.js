const os = require('os');
const fs = require('fs');
const path = require('path');

// 1. Tìm địa chỉ IP nội bộ của máy tính
const networkInterfaces = os.networkInterfaces();
let currentIP = '127.0.0.1';

for (const interfaceName in networkInterfaces) {
  for (const iface of networkInterfaces[interfaceName]) {
    // Chỉ lấy IPv4 và không phải địa chỉ loopback (127.0.0.1)
    if (iface.family === 'IPv4' && !iface.internal) {
      currentIP = iface.address;
      break;
    }
  }
}

console.log('📡 Đã tìm thấy IP máy tính của bạn: ' + currentIP);

// 2. Đường dẫn đến file apiClient.js
const apiClientPath = path.join(__dirname, 'src', 'api', 'apiClient.js');

// 3. Nội dung mới cho file apiClient.js
const newContent = `import axios from 'axios';

// 🤖 FILE NÀY ĐƯỢC CẬP NHẬT TỰ ĐỘNG MỖI KHI CHẠY 'NPM START'
export const BASE_URL = 'http://${currentIP}:8000/api'; 
export const IMAGE_BASE_URL = 'http://${currentIP}:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default apiClient;
`;

// 4. Ghi file
try {
  fs.writeFileSync(apiClientPath, newContent);
  console.log('✅ Đã tự động cập nhật IP vào src/api/apiClient.js');
} catch (err) {
  console.error('❌ Lỗi khi cập nhật IP:', err);
}
