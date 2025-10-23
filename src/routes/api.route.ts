import { Router, Request, Response } from 'express';
import { PlatformManager } from '../services/platformManager.service';
import { MessageBus } from '../services/messageBus.service';
import { TelegramAdapter } from '../adapters';
import { config } from '../config';

export const createApiRoutes = (
  platformManager: PlatformManager,
  messageBus: MessageBus
): Router => {
  const router = Router();

  // Send message
  router.post('/send', async (req: Request, res: Response) => {
    const { platform, recipient, text } = req.body;

    if (!platform || !recipient || !text) {
      return res.status(400).json({
        error: 'Missing required fields: platform, recipient, text',
      });
    }

    const result = await platformManager.sendMessage(platform, recipient, text);
    res.json(result);
  });

  // Get messages
  router.get('/messages', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const platform = req.query.platform as string;

    let messages = messageBus.getMessages(limit);

    if (platform) {
      messages = messages.filter((m) => m.platform === platform);
    }

    res.json({ messages, count: messages.length });
  });

  // Get supported platforms
  router.get('/platforms', (req: Request, res: Response) => {
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

  // Clear messages
  router.delete('/messages', (req: Request, res: Response) => {
    messageBus.clearMessages();
    res.json({ success: true, message: 'Messages cleared' });
  });

  return router;
};
