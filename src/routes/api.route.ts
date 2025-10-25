import { Router } from 'express';
import { PlatformManager } from '../services/platformManager.service';
import { MessageBus } from '../services/messageBus.service';
import { createWebhookRoutes } from './webhook.route';
import { createAuthRoutes } from './auth.route';
import { createYouTubeRoutes } from './youtube.route';
import { createClientRoutes } from './client.route';
import { createPlatformRoutes } from './platform.route';
import { createMessageRoutes } from './message.route';

export const createApiRoutes = (
  platformManager: PlatformManager,
  messageBus: MessageBus
): Router => {
  const router = Router();
  const v1Router = Router();

  // Add all routes to v1Router
  v1Router.use('/webhook', createWebhookRoutes(platformManager));
  v1Router.use('/auth', createAuthRoutes(platformManager));
  v1Router.use('/youtube', createYouTubeRoutes());
  v1Router.use('/client', createClientRoutes());
  v1Router.use('/platform', createPlatformRoutes(platformManager));
  v1Router.use('/messages', createMessageRoutes(messageBus, platformManager));

  // Mount the v1 router under /api/v1
  router.use('/api/v1', v1Router);

  return router;
};
