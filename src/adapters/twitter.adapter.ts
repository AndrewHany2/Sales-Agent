import { BaseAdapter } from "./base.adapter";
import { SendMessageResult, Config, Message } from "../types/types";
import { Logger } from "../utils/logger";

export class TwitterAdapter extends BaseAdapter {
  constructor(config: Config["platforms"]["twitter"]) {
    super(config);
  }

  async sendMessage(
    recipientId: string,
    text: string
  ): Promise<SendMessageResult> {
    Logger.warn("Twitter DM API not implemented");
    return {
      success: false,
      error: "Twitter DM API requires OAuth 1.0a implementation",
    };
  }

  handleWebhook(data: any): void {
    if (data.direct_message_events) {
      data.direct_message_events.forEach((event: any) => {
        if (event.type === "message_create") {
          const message: Message = {
            platform: "twitter",
            senderId: event.message_create.sender_id,
            text: event.message_create.message_data.text,
            timestamp: parseInt(event.created_timestamp),
            messageId: event.id,
          };
          this.emitMessage(message);
        }
      });
    }
  }

  protected emitMessage(message: Message): void {
    // This will be injected by PlatformManager
  }
}
