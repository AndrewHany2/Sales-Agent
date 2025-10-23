interface PlatformConfig {
  enabled: boolean;
  [key: string]: unknown;
}

interface Config {
  port: number;
  baseUrl: string | undefined;
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
    youtube: PlatformConfig & {
      clientId?: string;
      clientSecret?: string;
    }
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
  data?: unknown;
  error?: string;
}

interface PlatformAdapter {
  sendMessage(recipient: string, text: string): Promise<SendMessageResult>;
  handleWebhook(data: unknown): void;
}

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: 'Bearer';
  id_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

export { PlatformAdapter, SendMessageResult, Message, Config, GoogleTokenResponse, GoogleUserInfo };
