import { Router, Request, Response } from 'express';
import { PlatformManager } from '../services/platformManager.service';
import { config } from '../config';
import { TelegramAdapter } from '../adapters';

export const createPlatformRoutes = (platformManager: PlatformManager): Router => {
  const router = Router();

  // Get supported platforms
  router.get('/platforms', (_req: Request, res: Response) => {
    const platforms = Object.keys(config.platforms).map((name) => ({
      name,
      enabled: config.platforms[name as keyof typeof config.platforms].enabled,
    }));
    res.json({ platforms });
  });

  // Setup Telegram webhook
  router.post('/setup/telegram', async (req: Request, res: Response) => {
    const { webhookUrl } = req.body;
    const adapter = platformManager.getAdapter('telegram') as TelegramAdapter;
    const result = await adapter.setWebhook(webhookUrl);
    res.json(result);
  });

  return router;
};