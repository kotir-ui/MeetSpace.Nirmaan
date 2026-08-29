import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 4100),
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  apiPrefix: process.env.API_PREFIX || '/api',
  databaseUrl: process.env.DATABASE_URL || '',
  authMode: process.env.ATTENDANCE_AUTH_MODE || 'none'
};
