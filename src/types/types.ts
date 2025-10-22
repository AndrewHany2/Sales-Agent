interface PlatformConfig {
  enabled: boolean;
  [key: string]: any;
}

interface Config {
  port: number;
  platforms: {
    facebook: PlatformConfig & {
      pageAccessToken?: string;
      verifyToken?: string;
      apiVersion: string;
    };
    instagram: PlatformConfig & {
      accessToken?: string;
      businessAccountId?: string;
    };
    twitter: PlatformConfig & {
      apiKey?: string;
      apiSecret?: string;
      accessToken?: string;
      accessSecret?: string;
    };
    telegram: PlatformConfig & {
      botToken?: string;
    };
    whatsapp: PlatformConfig & {
      phoneNumberId?: string;
      accessToken?: string;
    };
    slack: PlatformConfig & {
      botToken?: string;
      signingSecret?: string;
    };
  };
}

interface Message {
  platform: string;
  senderId: string;
  text: string;
  timestamp: number;
  messageId: string;
  chatId?: string;
  channelId?: string;
  username?: string;
}

interface SendMessageResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface PlatformAdapter {
  sendMessage(recipient: string, text: string): Promise<SendMessageResult>;
  handleWebhook(data: any): void;
}

export { PlatformAdapter, SendMessageResult, Message, Config };
