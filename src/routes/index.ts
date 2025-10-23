import { Router } from 'express';
import { PlatformManager } from '../services/platformManager.service';
import { MessageBus } from '../services/messageBus.service';
import { createWebhookRoutes } from './webhook.route';
import { createApiRoutes } from './api.route';
import { createAuthRoutes } from './auth.route';
import { createYouTubeRoutes } from './youtube.route';

export const createRoutes = (platformManager: PlatformManager, messageBus: MessageBus): Router => {
  const router = Router();

  router.use('/webhook', createWebhookRoutes(platformManager));
  router.use('/api', createApiRoutes(platformManager, messageBus));
  router.use('/auth', createAuthRoutes(platformManager));
  router.use('/youtube', createYouTubeRoutes());
  
  return router;
};
