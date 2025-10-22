import axios, { AxiosResponse } from "axios";
import { BaseAdapter } from "./base.adapter";
import { SendMessageResult, Config, Message } from "../types/types";
import { Logger } from "../utils/logger";

export class TelegramAdapter extends BaseAdapter {
  private baseUrl: string;

  constructor(config: Config["platforms"]["telegram"]) {
    super(config);
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;
  }

  async sendMessage(chatId: string, text: string): Promise<SendMessageResult> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/sendMessage`,
        {
          chat_id: chatId,
          text,
        }
      );
      Logger.info("Telegram message sent", { chatId });
      return { success: true, data: response.data };
    } catch (error: any) {
      Logger.error("Telegram send error", error);
      return this.handleError(error);
    }
  }

  handleWebhook(data: any): void {
    if (data.message?.text) {
      const message: Message = {
        platform: "telegram",
        senderId: data.message.from.id.toString(),
        chatId: data.message.chat.id.toString(),
        text: data.message.text,
        timestamp: data.message.date * 1000,
        messageId: data.message.message_id.toString(),
        username: data.message.from.username,
      };
      this.emitMessage(message);
    }
  }

  async setWebhook(webhookUrl: string): Promise<SendMessageResult> {
    try {
      await axios.post(`${this.baseUrl}/setWebhook`, {
        url: `${webhookUrl}/webhook/telegram`,
      });
      Logger.info("Telegram webhook set", { webhookUrl });
      return { success: true };
    } catch (error: any) {
      Logger.error("Telegram webhook setup error", error);
      return this.handleError(error);
    }
  }

  protected emitMessage(message: Message): void {
    // This will be injected by PlatformManager
  }
}
