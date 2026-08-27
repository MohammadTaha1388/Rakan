import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { defineConfig, Plugin } from 'vite';
import {
  handleChatApi,
  handleGetHistoryApi,
  handleClearHistoryApi,
  handleDownloadHistoryApi,
  handleStatusApi,
  handleWeeklyStatsApi
} from './src/server/apiHandler';
import {
  handleRegisterApi,
  handleLoginApi,
  handleMeApi,
  handleLogoutApi
} from './src/server/authService';

dotenv.config();

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      const apiApp = express();
      apiApp.use(express.json());

      // Auth Endpoints
      apiApp.post('/api/auth/register', handleRegisterApi);
      apiApp.post('/api/auth/login', handleLoginApi);
      apiApp.get('/api/auth/me', handleMeApi);
      apiApp.post('/api/auth/logout', handleLogoutApi);

      // Chat, History & Stats Endpoints
      apiApp.post('/api/chat', handleChatApi);
      apiApp.get('/api/history', handleGetHistoryApi);
      apiApp.post('/api/history/clear', handleClearHistoryApi);
      apiApp.get('/api/history/download', handleDownloadHistoryApi);
      apiApp.get('/api/stats/weekly', handleWeeklyStatsApi);
      apiApp.get('/api/status', handleStatusApi);

      server.middlewares.use(apiApp);
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
