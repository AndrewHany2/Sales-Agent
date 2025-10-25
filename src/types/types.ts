import { Prisma } from "@prisma/client";

interface PlatformConfig {
  enabled: boolean;
  [key: string]: unknown;
}

interface Config {
  port: number;
  baseUrl: string | undefined;
  frontEndUrl: string | undefined;
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


export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: Date;
  extra?: Prisma.InputJsonValue;
}

export interface EncryptedTokenResult {
  encrypted: string;
  iv: string;
  authTag: string;
}

export interface SaveTokenParams {
  clientId: string;
  platform: string;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType?: string;
  expiresIn?: number;
  scope?: string;
  externalAccountId?: string;
  externalName?: string;
  externalHandle?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  email?: string;
  name?: string;
  picture?: string;
  channelId?: string;
  [key: string]: unknown;
}

export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    customUrl?: string;
    description?: string;
  };
}

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface TokenRefreshLogParams {
  connectionId: string;
  platform: string;
  success: boolean;
  errorMessage?: string;
  oldExpiresAt?: Date;
  newExpiresAt?: Date;
}

export interface YouTubeChannelsResponse {
  items?: YouTubeChannel[];
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelId: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface YouTubeComment {
  id: string;
  snippet: {
    textDisplay: string;
    textOriginal: string;
    authorDisplayName: string;
    authorChannelId?: {
      value: string;
    };
    likeCount: number;
    publishedAt: string;
    updatedAt: string;
  };
}

export interface YouTubeCommentThread {
  id: string;
  snippet: {
    topLevelComment: YouTubeComment;
    totalReplyCount: number;
    videoId: string;
  };
}

export interface LiveChatMessage {
  id: string;
  snippet: {
    displayMessage: string;
    publishedAt: string;
    authorChannelId: string;
  };
  authorDetails: {
    displayName: string;
    channelId: string;
    isChatModerator: boolean;
    isChatOwner: boolean;
  };
}


export { PlatformAdapter, SendMessageResult, Message, Config, GoogleTokenResponse, GoogleUserInfo };
