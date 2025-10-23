import axios, { AxiosResponse } from 'axios';
import { BaseAdapter } from './base.adapter';
import { SendMessageResult, Config, Message } from '../types/types';
import { Logger } from '../utils/logger';

// Extended Message type for forwarded messages
interface TelegramMessage extends Message {
  isForwarded?: boolean;
  forwardedFrom?: {
    userId?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    chatId?: string;
    chatTitle?: string;
    messageId?: string;
    date?: number;
  };
  replyToMessageId?: string;
  hasMedia?: boolean;
  mediaType?: 'photo' | 'video' | 'document' | 'audio' | 'voice' | 'sticker';
}

export class TelegramAdapter extends BaseAdapter {
  private baseUrl: string;
  private allowedForwarders: string[] = []; // List of user IDs allowed to forward

  constructor(config: Config['platforms']['telegram']) {
    super(config);
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;
    
    // Optional: Set allowed forwarders from config
    this.allowedForwarders = process.env.TELEGRAM_ALLOWED_FORWARDERS?.split(',') || [];
  }

  async sendMessage(chatId: string, text: string, options?: {
    replyToMessageId?: string;
    parseMode?: 'Markdown' | 'HTML';
    disableWebPagePreview?: boolean;
  }): Promise<SendMessageResult> {
    try {
      const response: AxiosResponse = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        reply_to_message_id: options?.replyToMessageId,
        parse_mode: options?.parseMode,
        disable_web_page_preview: options?.disableWebPagePreview
      });
      Logger.info('Telegram message sent', { chatId });
      return { success: true, data: response.data };
    } catch (error: any) {
      Logger.error('Telegram send error', error);
      return this.handleError(error);
    }
  }

  handleWebhook(data: any): void {
    const msg = data.message || data.edited_message;
    
    if (!msg) return;

    // Check if user is allowed to forward (optional security)
    if (this.allowedForwarders.length > 0 && 
        !this.allowedForwarders.includes(msg.from.id.toString())) {
      Logger.warn('Unauthorized forward attempt', { userId: msg.from.id });
      return;
    }

    // Handle forwarded messages
    if (msg.forward_from || msg.forward_from_chat || msg.forward_sender_name) {
      this.handleForwardedMessage(msg);
      return;
    }

    // Handle regular messages
    if (msg.text) {
      this.handleRegularMessage(msg);
    }

    // Handle media messages
    if (msg.photo || msg.video || msg.document || msg.audio || msg.voice || msg.sticker) {
      this.handleMediaMessage(msg);
    }
  }

  private handleForwardedMessage(msg: any): void {
    const message: TelegramMessage = {
      platform: 'telegram',
      senderId: msg.from.id.toString(),
      chatId: msg.chat.id.toString(),
      text: msg.text || msg.caption || '[No text content]',
      timestamp: msg.date * 1000,
      messageId: msg.message_id.toString(),
      username: msg.from.username,
      isForwarded: true,
      forwardedFrom: this.extractForwardInfo(msg)
    };

    // Add media info if present
    if (msg.photo || msg.video || msg.document) {
      message.hasMedia = true;
      message.mediaType = this.getMediaType(msg);
    }

    Logger.info('Forwarded message received', {
      from: message.forwardedFrom?.username || message.forwardedFrom?.firstName,
      forwarder: msg.from.username
    });

    this.emitMessage(message);
  }

  private handleRegularMessage(msg: any): void {
    const message: TelegramMessage = {
      platform: 'telegram',
      senderId: msg.from.id.toString(),
      chatId: msg.chat.id.toString(),
      text: msg.text,
      timestamp: msg.date * 1000,
      messageId: msg.message_id.toString(),
      username: msg.from.username,
      isForwarded: false
    };

    // Check if it's a reply
    if (msg.reply_to_message) {
      message.replyToMessageId = msg.reply_to_message.message_id.toString();
    }

    this.emitMessage(message);
  }

  private handleMediaMessage(msg: any): void {
    const message: TelegramMessage = {
      platform: 'telegram',
      senderId: msg.from.id.toString(),
      chatId: msg.chat.id.toString(),
      text: msg.caption || '[Media message]',
      timestamp: msg.date * 1000,
      messageId: msg.message_id.toString(),
      username: msg.from.username,
      hasMedia: true,
      mediaType: this.getMediaType(msg),
      isForwarded: !!(msg.forward_from || msg.forward_from_chat)
    };

    if (message.isForwarded) {
      message.forwardedFrom = this.extractForwardInfo(msg);
    }

    this.emitMessage(message);
  }

  private extractForwardInfo(msg: any): TelegramMessage['forwardedFrom'] {
    // Forward from user (privacy settings allow)
    if (msg.forward_from) {
      return {
        userId: msg.forward_from.id.toString(),
        username: msg.forward_from.username,
        firstName: msg.forward_from.first_name,
        lastName: msg.forward_from.last_name,
        date: msg.forward_date
      };
    }

    // Forward from channel or group
    if (msg.forward_from_chat) {
      return {
        chatId: msg.forward_from_chat.id.toString(),
        chatTitle: msg.forward_from_chat.title,
        messageId: msg.forward_from_message_id?.toString(),
        date: msg.forward_date
      };
    }

    // Forward from user with hidden privacy settings
    if (msg.forward_sender_name) {
      return {
        firstName: msg.forward_sender_name,
        date: msg.forward_date
      };
    }

    return {};
  }

  private getMediaType(msg: any): TelegramMessage['mediaType'] {
    if (msg.photo) return 'photo';
    if (msg.video) return 'video';
    if (msg.document) return 'document';
    if (msg.audio) return 'audio';
    if (msg.voice) return 'voice';
    if (msg.sticker) return 'sticker';
    return 'photo';
  }

  async downloadMedia(fileId: string): Promise<SendMessageResult> {
    try {
      // Get file path
      const fileResponse = await axios.get(`${this.baseUrl}/getFile`, {
        params: { file_id: fileId }
      });

      const filePath = fileResponse.data.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${(this.config as Config['platforms']['telegram']).botToken}/${filePath}`;

      // Download file
      const mediaResponse = await axios.get(fileUrl, {
        responseType: 'arraybuffer'
      });

      return {
        success: true,
        data: {
          buffer: mediaResponse.data,
          url: fileUrl,
          path: filePath
        }
      };
    } catch (error: any) {
      Logger.error('Media download error', error);
      return this.handleError(error);
    }
  }

  async setWebhook(webhookUrl: string): Promise<SendMessageResult> {
    try {
      await axios.post(`${this.baseUrl}/setWebhook`, {
        url: `${webhookUrl}/webhook/telegram`,
        allowed_updates: [
          'message',
          'edited_message',
          'channel_post',
          'edited_channel_post'
        ]
      });
      Logger.info('Telegram webhook set', { webhookUrl });
      return { success: true };
    } catch (error: any) {
      Logger.error('Telegram webhook setup error', error);
      return this.handleError(error);
    }
  }

  async getMe(): Promise<SendMessageResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return { success: true, data: response.data.result };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  protected emitMessage(_message: TelegramMessage): void {
    // This will be injected by PlatformManager
  }
}