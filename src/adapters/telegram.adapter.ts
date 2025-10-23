import axios, { AxiosResponse } from 'axios';
import { BaseAdapter } from './base.adapter';
import { SendMessageResult, Config, Message } from '../types/types';
import { Logger } from '../utils/logger';

export class TelegramAdapter extends BaseAdapter {
  private baseUrl: string;

  constructor(config: Config['platforms']['telegram']) {
    super(config);
    if (!config.botToken) {
      throw new Error('Telegram botToken is required but not provided');
    }
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;
  }

  async sendMessage(chatId: string, text: string): Promise<SendMessageResult> {
    try {
      const response: AxiosResponse = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text,
      });
      Logger.info('Telegram message sent', { chatId });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      Logger.error('Telegram send error', error);
      return this.handleError(error);
    }
  }

  handleWebhook(data: unknown): void {
    type TgFrom = { id: number; username?: string };
    type TgChat = { id: number };
    type TgMessage = {
      message_id: number;
      date: number;
      text?: string;
      from: TgFrom;
      chat: TgChat;
    };
    const payload = data as { message?: TgMessage };
    if (payload.message?.text) {
      const message: Message = {
        platform: 'telegram',
        senderId: payload.message.from.id.toString(),
        chatId: payload.message.chat.id.toString(),
        text: payload.message.text,
        timestamp: payload.message.date * 1000,
        messageId: payload.message.message_id.toString(),
        username: payload.message.from.username,
      };
      this.emitMessage(message);
    }
  }

  async setWebhook(webhookUrl: string): Promise<SendMessageResult> {
    try {
      await axios.post(`${this.baseUrl}/setWebhook`, {
        url: `${webhookUrl}/webhook/telegram`,
      });
      Logger.info('Telegram webhook set', { webhookUrl });
      return { success: true };
    } catch (error: unknown) {
      Logger.error('Telegram webhook setup error', error);
      return this.handleError(error);
    }
  }

  protected emitMessage(_message: Message): void {
    void _message;
    // This will be injected by PlatformManager
  }
}
