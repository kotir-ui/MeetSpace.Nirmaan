import express from 'express';
import cors from 'cors';
import { env } from './src/config/env.js';
import attendanceRoutes from './src/routes/attendance.routes.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.frontendOrigin }));
  app.use(express.json());
  app.get(`${env.apiPrefix}/health`, (_req, res) => res.json({ ok: true, service: 'attendance-module' }));
  app.use(`${env.apiPrefix}/attendance`, attendanceRoutes);
  return app;
}
