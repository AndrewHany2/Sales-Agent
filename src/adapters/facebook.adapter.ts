import axios, { AxiosResponse } from 'axios';
import { SendMessageResult, Config, Message } from '../types/types';
import { Logger } from '../utils/logger';
import { BaseAdapter } from './base.adapter';

export class FacebookAdapter extends BaseAdapter {
  private baseUrl: string;

  constructor(config: Config['platforms']['facebook']) {
    super(config);
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}`;
  }

  async sendMessage(recipientId: string, text: string): Promise<SendMessageResult> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text },
        },
        {
          params: { access_token: (this.config as Config['platforms']['facebook']).pageAccessToken },
        }
      );
      Logger.info('Facebook message sent', { recipientId });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      Logger.error('Facebook send error', error);
      return this.handleError(error);
    }
  }

  handleWebhook(data: unknown): void {
    type FbMessagingEvent = {
      sender: { id: string };
      message?: { mid: string; text?: string };
      timestamp: number;
    };
    type FbEntry = { messaging?: FbMessagingEvent[] };
    const payload = data as { object?: string; entry?: FbEntry[] };
    if (payload.object === 'page') {
      payload.entry?.forEach((entry) => {
        entry.messaging?.forEach((event) => {
          if (event.message?.text) {
            const message: Message = {
              platform: 'facebook',
              senderId: event.sender.id,
              text: event.message.text,
              timestamp: event.timestamp,
              messageId: event.message.mid,
            };
            this.emitMessage(message);
          }
        });
      });
    }
  }

  protected emitMessage(_message: Message): void {
    void _message;
    // This will be injected by PlatformManager
  }
}
