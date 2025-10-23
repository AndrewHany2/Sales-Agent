import axios, { AxiosResponse } from 'axios';
import { BaseAdapter } from './base.adapter';
import { SendMessageResult, Config, Message } from '../types/types';
import { Logger } from '../utils/logger';

export class SlackAdapter extends BaseAdapter {
  private baseUrl: string = 'https://slack.com/api';

  constructor(config: Config['platforms']['slack']) {
    super(config);
  }

  async sendMessage(channel: string, text: string): Promise<SendMessageResult> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/chat.postMessage`,
        { channel, text },
        {
          headers: {
            Authorization: `Bearer ${(this.config as Config['platforms']['slack']).botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      Logger.info('Slack message sent', { channel });
      return { success: true, data: response.data };
    } catch (error: any) {
      Logger.error('Slack send error', error);
      return this.handleError(error);
    }
  }

  handleWebhook(data: any): void {
    if (data.event?.type === 'message' && !data.event.bot_id) {
      const message: Message = {
        platform: 'slack',
        senderId: data.event.user,
        channelId: data.event.channel,
        text: data.event.text,
        timestamp: parseFloat(data.event.ts) * 1000,
        messageId: data.event.client_msg_id || data.event.ts,
      };
      this.emitMessage(message);
    }
  }

  protected emitMessage(_message: Message): void {
    // This will be injected by PlatformManager
  }
}
