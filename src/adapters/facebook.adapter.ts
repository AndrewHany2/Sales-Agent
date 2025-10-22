import axios, { AxiosResponse } from "axios";
import { SendMessageResult, Config, Message } from "../types/types";
import { Logger } from "../utils/logger";
import { BaseAdapter } from "./base.adapter";

export class FacebookAdapter extends BaseAdapter {
  private baseUrl: string;

  constructor(config: Config["platforms"]["facebook"]) {
    super(config);
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}`;
  }

  async sendMessage(
    recipientId: string,
    text: string
  ): Promise<SendMessageResult> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text },
        },
        {
          params: { access_token: this.config.pageAccessToken },
        }
      );
      Logger.info("Facebook message sent", { recipientId });
      return { success: true, data: response.data };
    } catch (error: any) {
      Logger.error("Facebook send error", error);
      return this.handleError(error);
    }
  }

  handleWebhook(data: any): void {
    if (data.object === "page") {
      data.entry?.forEach((entry: any) => {
        entry.messaging?.forEach((event: any) => {
          if (event.message?.text) {
            const message: Message = {
              platform: "facebook",
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

  protected emitMessage(message: Message): void {
    // This will be injected by PlatformManager
  }
}
