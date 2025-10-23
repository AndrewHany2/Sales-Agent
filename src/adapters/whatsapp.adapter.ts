import axios, { AxiosResponse } from 'axios';
import { BaseAdapter } from './base.adapter';
import { SendMessageResult, Config, Message } from '../types/types';
import { Logger } from '../utils/logger';

export class WhatsAppAdapter extends BaseAdapter {
  private baseUrl: string = 'https://graph.facebook.com/v18.0';

  constructor(config: Config['platforms']['whatsapp']) {
    super(config);
  }

  async sendMessage(recipientPhone: string, text: string): Promise<SendMessageResult> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/${(this.config as Config['platforms']['whatsapp']).phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipientPhone,
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${(this.config as Config['platforms']['whatsapp']).accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      Logger.info('WhatsApp message sent', { recipientPhone });
      return { success: true, data: response.data };
    } catch (error: any) {
      Logger.error('WhatsApp send error', error);
      return this.handleError(error);
    }
  }

  handleWebhook(data: any): void {
    data.entry?.forEach((entry: any) => {
      entry.changes?.forEach((change: any) => {
        if (change.field === 'messages') {
          change.value.messages?.forEach((msg: any) => {
            if (msg.type === 'text') {
              const message: Message = {
                platform: 'whatsapp',
                senderId: msg.from,
                text: msg.text.body,
                timestamp: parseInt(msg.timestamp) * 1000,
                messageId: msg.id,
              };
              this.emitMessage(message);
            }
          });
        }
      });
    });
  }

  protected emitMessage(_message: Message): void {
    // This will be injected by PlatformManager
  }
}
