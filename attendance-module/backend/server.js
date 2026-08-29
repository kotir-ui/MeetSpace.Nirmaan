import { createApp } from './app.js';
import { env } from './src/config/env.js';

createApp().listen(env.port, () => {
  console.log(`Attendance API listening on port ${env.port}`);
});
