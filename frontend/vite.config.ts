import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '172.29.190.149',
    port: 80,
    strictPort: false,
    // Allow requests from your server IP
    allowedHosts: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
        define: {
          // Set default API base URL for development
          'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://172.29.190.149/api'),
        },
});