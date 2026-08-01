import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { supabaseContext } from './middleware/auth';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

import stripeRoutes from './routes/stripe.routes';
import adminRoutes from './routes/admin.routes';
import avatarRoutes from './routes/avatar.routes';
import bannersRoutes from './routes/banners.routes';
import challengesRoutes from './routes/challenges.routes';
import feedRoutes from './routes/feed.routes';
import followRoutes from './routes/follow.routes';
import groupsRoutes from './routes/groups.routes';
import messagesRoutes from './routes/messages.routes';
import newsletterRoutes from './routes/newsletter.routes';
import notificationsRoutes from './routes/notifications.routes';
import profileRoutes from './routes/profile.routes';
import reportsRoutes from './routes/reports.routes';
import storeRoutes from './routes/store.routes';
import transactionsRoutes from './routes/transactions.routes';
import uploadRoutes from './routes/upload.routes';
import usersRoutes from './routes/users.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: '*' })); // Android app has no browser origin; lock down if you also serve a web client
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Stripe webhook MUST be mounted before express.json() because it needs the
  // raw request body to verify the signature (see routes/stripe.routes.ts).
  app.use('/api/stripe', stripeRoutes);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Attach req.supabase / req.user to every request (Bearer token optional)
  app.use(supabaseContext);

  app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  app.use('/api/admin', adminRoutes);
  app.use('/api/avatar', avatarRoutes);
  app.use('/api/banners', bannersRoutes);
  app.use('/api/challenges', challengesRoutes);
  app.use('/api/feed', feedRoutes);
  app.use('/api/follow', followRoutes);
  app.use('/api/groups', groupsRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/newsletter', newsletterRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/store', storeRoutes);
  app.use('/api/transactions', transactionsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/users', usersRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
