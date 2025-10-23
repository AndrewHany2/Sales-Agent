import axios, { AxiosResponse } from 'axios';
import { SendMessageResult, Config, Message } from '../types/types';
import { Logger } from '../utils/logger';
import { BaseAdapter } from './base.adapter';

export class InstagramAdapter extends BaseAdapter {
  private baseUrl: string = 'https://graph.facebook.com/v18.0';

  constructor(config: Config['platforms']['instagram']) {
    super(config);
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
          params: { access_token: (this.config as Config['platforms']['instagram']).accessToken },
        }
      );
      Logger.info('Instagram message sent', { recipientId });
      return { success: true, data: response.data };
    } catch (error: any) {
      Logger.error('Instagram send error', error);
      return this.handleError(error);
    }
  }

  handleWebhook(data: any): void {
    if (data.object === 'instagram') {
      data.entry?.forEach((entry: any) => {
        entry.messaging?.forEach((event: any) => {
          if (event.message?.text) {
            const message: Message = {
              platform: 'instagram',
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
    // This will be injected by PlatformManager
  }
}
