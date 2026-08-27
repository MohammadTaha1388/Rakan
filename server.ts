import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  handleChatApi,
  handleGetHistoryApi,
  handleClearHistoryApi,
  handleDownloadHistoryApi,
  handleStatusApi,
  handleWeeklyStatsApi,
  handleAdminLoginApi,
  handleAdminGetDataApi,
  handleAdminUpdateSettingsApi,
  handleAdminChangePasswordApi,
  handleAdminDeleteUserApi,
  handleAdminClearLogsApi,
  handleAdminLogoutApi
} from './src/server/apiHandler';
import {
  handleRegisterApi,
  handleLoginApi,
  handleMeApi,
  handleLogoutApi
} from './src/server/authService';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post('/api/auth/register', handleRegisterApi);
  app.post('/api/auth/login', handleLoginApi);
  app.get('/api/auth/me', handleMeApi);
  app.post('/api/auth/logout', handleLogoutApi);

  // Chat & History Routes
  app.post('/api/chat', handleChatApi);
  app.get('/api/history', handleGetHistoryApi);
  app.post('/api/history/clear', handleClearHistoryApi);
  app.get('/api/history/download', handleDownloadHistoryApi);
  app.get('/api/stats/weekly', handleWeeklyStatsApi);
  app.get('/api/status', handleStatusApi);

  // Developer Admin & Security Routes
  app.post('/api/admin/login', handleAdminLoginApi);
  app.get('/api/admin/data', handleAdminGetDataApi);
  app.post('/api/admin/settings', handleAdminUpdateSettingsApi);
  app.post('/api/admin/change-password', handleAdminChangePasswordApi);
  app.delete('/api/admin/users/:id', handleAdminDeleteUserApi);
  app.post('/api/admin/clear-logs', handleAdminClearLogsApi);
  app.post('/api/admin/logout', handleAdminLogoutApi);

  // Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rakan School AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
