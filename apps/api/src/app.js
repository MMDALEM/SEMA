import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/errors.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import logsRoutes from './routes/logs.routes.js';
import requestTypesRoutes from './routes/requestTypes.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import leavesRoutes from './routes/leaves.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import statsRoutes from './routes/stats.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use(globalLimiter);

  app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'SEMA API' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/logs', logsRoutes);
  app.use('/api/request-types', requestTypesRoutes);
  app.use('/api/requests', requestsRoutes);
  app.use('/api/leaves', leavesRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/stats', statsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
