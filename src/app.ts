import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import { MessageBus } from './services/messageBus.service';
import { PlatformManager } from './services/platformManager.service';
import { createRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const createApp = (): {
  app: Application;
  messageBus: MessageBus;
  platformManager: PlatformManager;
} => {
  const app: Application = express();

  // Middleware
  app.use(cors())
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Services
  const messageBus = new MessageBus();
  const platformManager = new PlatformManager(messageBus);

  // Health check
  
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      enabledPlatforms: platformManager.getEnabledPlatforms(),
    });
  });

  // Routes
  app.use('/api/v1', createRoutes(platformManager, messageBus));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, messageBus, platformManager };
};
