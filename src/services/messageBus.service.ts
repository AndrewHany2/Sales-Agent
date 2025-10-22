import { EventEmitter } from "events";
import { Logger } from "../utils/logger";
import { Message } from "../types/types";

export class MessageBus extends EventEmitter {
  private messages: Message[] = [];
  private maxMessages: number = 1000;

  addMessage(message: Message): void {
    this.messages.push(message);

    // Keep only the last N messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    this.emit("message", message);
    Logger.info("New message received", {
      platform: message.platform,
      messageId: message.messageId,
    });
  }

  getMessages(limit: number = 50): Message[] {
    return this.messages.slice(-limit);
  }

  getMessagesByPlatform(platform: string, limit: number = 50): Message[] {
    return this.messages.filter((m) => m.platform === platform).slice(-limit);
  }

  clearMessages(): void {
    this.messages = [];
    Logger.info("Messages cleared");
  }
}
