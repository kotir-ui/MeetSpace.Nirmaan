import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down and try again shortly.' },
});
app.use('/api', limiter);

app.get('/', (req, res) => {
  res.json({ name: 'Website Analytics Dashboard API', version: '1.0.0' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
