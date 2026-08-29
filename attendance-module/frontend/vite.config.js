import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.VITE_PORT || 5173),
    proxy: process.env.VITE_ATTENDANCE_API_URL
      ? undefined
      : { '/api': `http://127.0.0.1:${process.env.ATTENDANCE_API_PORT || 4100}` }
  }
});
