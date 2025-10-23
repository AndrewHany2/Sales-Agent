import { config } from '../config';
import { SendMessageResult, PlatformAdapter, Message } from '../types/types';
import { MessageBus } from './messageBus.service';
import {
  FacebookAdapter,
  InstagramAdapter,
  TelegramAdapter,
  WhatsAppAdapter,
  SlackAdapter,
  TwitterAdapter,
} from '../adapters';
import { Logger } from '../utils/logger';

export class PlatformManager {
  private adapters: Record<string, PlatformAdapter>;
  private messageBus: MessageBus;

  constructor(messageBus: MessageBus) {
    this.messageBus = messageBus;
    this.adapters = {
      facebook: new FacebookAdapter(config.platforms.facebook),
      instagram: new InstagramAdapter(config.platforms.instagram),
      telegram: new TelegramAdapter(config.platforms.telegram),
      whatsapp: new WhatsAppAdapter(config.platforms.whatsapp),
      slack: new SlackAdapter(config.platforms.slack),
      twitter: new TwitterAdapter(config.platforms.twitter),
    };

    // Inject message emitter into adapters via a setter to respect visibility
    Object.values(this.adapters).forEach((adapter) => {
      // adapters are instances of BaseAdapter subclasses; call setEmitter if available
      (adapter as unknown as { setEmitter?: (emit: (message: Message) => void) => void }).setEmitter?.(
        (message: Message) => {
          this.messageBus.addMessage(message);
        }
      );
    });

    Logger.info('PlatformManager initialized');
  }

  async sendMessage(platform: string, recipient: string, text: string): Promise<SendMessageResult> {
    const adapter = this.adapters[platform];
    if (!adapter) {
      Logger.error('Platform not supported', { platform });
      return { success: false, error: 'Platform not supported' };
    }
    return await adapter.sendMessage(recipient, text);
  }

  handleWebhook(platform: string, data: unknown): void {
    const adapter = this.adapters[platform];
    if (adapter) {
      adapter.handleWebhook(data);
    } else {
      Logger.warn('Webhook received for unsupported platform', { platform });
    }
  }

  getAdapter(platform: string): PlatformAdapter | undefined {
    return this.adapters[platform];
  }

  getEnabledPlatforms(): string[] {
    return Object.keys(config.platforms).filter(
      (platform) => config.platforms[platform as keyof typeof config.platforms].enabled
    );
  }
}
