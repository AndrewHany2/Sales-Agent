import { Router } from 'express';
import { PlatformManager } from '../services/platformManager.service';
import { MessageBus } from '../services/messageBus.service';
import { createWebhookRoutes } from './webhook.route';
import { createAuthRoutes } from './auth.route';
import { createYouTubeRoutes } from './youtube.route';
import { createClientRoutes } from './client.route';
import { createPlatformRoutes } from './platform.route';
import { createMessageRoutes } from './message.route';

export const createRoutes = (
  platformManager: PlatformManager,
  messageBus: MessageBus
): Router => {
  const router = Router();

  // Add all routes to v1Router
  router.use('/webhook', createWebhookRoutes(platformManager));
  router.use('/auth', createAuthRoutes(platformManager));
  router.use('/youtube', createYouTubeRoutes());
  router.use('/client', createClientRoutes());
  router.use('/platform', createPlatformRoutes(platformManager));
  router.use('/message', createMessageRoutes(messageBus, platformManager));

  return router;

};
