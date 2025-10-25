import { Router, Request, Response } from 'express';
import { MessageBus } from '../services/messageBus.service';
import { PlatformManager } from '../services/platformManager.service';
import { TelegramAdapter } from '../adapters';

interface Message {
  platform: string;
  messageId: string;
  chatId?: string;
  isForwarded?: boolean;
  forwardedFrom?: {
    userId?: string;
    username?: string;
  };
}

export const createMessageRoutes = (messageBus: MessageBus, platformManager: PlatformManager): Router => {
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
      return res.json(result);
    });
    
  // Get messages
  router.get('/', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const platform = req.query.platform as string;

    let messages = messageBus.getMessages(limit);

    if (platform) {
      messages = messages.filter((m) => m.platform === platform);
    }

    res.json({ messages, count: messages.length });
  });

  // Get forwarded messages only
  router.get('/forwarded', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = messageBus.getMessages(limit * 2) // Get more to filter
      .filter((m: Message) => m.platform === 'telegram' && m.isForwarded)
      .slice(-limit);

    res.json({ messages, count: messages.length });
  });

  // Get messages by original sender
  router.get('/from/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const messages = messageBus.getMessages(limit * 5)
      .filter((m: Message) => 
        m.platform === 'telegram' && 
        m.isForwarded &&
        (m.forwardedFrom?.userId === userId || 
        m.forwardedFrom?.username === userId)
      )
      .slice(-limit);

    res.json({ messages, count: messages.length });
  });

  // Reply to forwarded message
  router.post('/reply', async (req: Request, res: Response) => {
    const { messageId, text } = req.body;

    if (!messageId || !text) {
      return res.status(400).json({ 
        error: 'Missing required fields: messageId, text' 
      });
    }

    // Find the message
    const messages = messageBus.getMessages(1000);
    const originalMessage = messages.find((m: Message) => m.messageId === messageId);

    if (!originalMessage || !originalMessage.chatId) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Send reply
    const adapter = platformManager.getAdapter('telegram') as TelegramAdapter;
    const result = await adapter.sendMessage(
      originalMessage.chatId,
      text,
      { replyToMessageId: messageId }
    );

    return res.json(result);
  });

  // Clear messages
  router.delete('/', (_req: Request, res: Response) => {
    messageBus.clearMessages();
    res.json({ success: true, message: 'Messages cleared' });
  });

  return router;
};