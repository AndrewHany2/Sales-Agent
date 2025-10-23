import axios, { AxiosError, AxiosResponse } from 'axios';
import { Platform } from '@prisma/client';
import { TokenStorageService } from './tokenStorage.service';
import { Logger } from '../utils/logger';
import { GoogleTokenResponse, MetaTokenResponse } from '../types/types';

interface RefreshErrorResponse {
  error?: string;
  error_description?: string;
  message?: string;
}

export class TokenRefreshService {
  private storage: TokenStorageService;

  constructor() {
    this.storage = new TokenStorageService();
  }

  /**
   * Refresh token based on platform
   */
  async refreshToken(clientId: string, platform: Platform): Promise<boolean> {
    try {
      const tokenData = await this.storage.getToken(clientId, platform);

      if (!tokenData || !tokenData.refreshToken) {
        Logger.warn('No refresh token available', { clientId, platform });
        return false;
      }

      switch (platform) {
        case Platform.YOUTUBE:
          return await this.refreshGoogleToken(clientId, platform, tokenData.refreshToken);
        case Platform.FACEBOOK:
        case Platform.INSTAGRAM:
          return await this.refreshMetaToken(clientId, platform, tokenData.accessToken);
        default:
          Logger.warn('Token refresh not implemented for platform', { platform });
          return false;
      }
    } catch (error) {
      Logger.error('Token refresh failed', error instanceof Error ? error : new Error('Unknown refresh error'));
      return false;
    }
  }

  /**
   * Refresh Google/YouTube OAuth token
   */
  private async refreshGoogleToken(
    clientId: string,
    platform: Platform,
    refreshToken: string
  ): Promise<boolean> {
    try {
      const response: AxiosResponse<GoogleTokenResponse> = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const { access_token, expires_in, scope, id_token } = response.data;

      await this.storage.saveToken({
        clientId,
        platform: platform.toString(),
        accessToken: access_token,
        refreshToken,
        idToken: id_token,
        expiresIn: expires_in,
        scope,
      });

      Logger.info('Google token refreshed successfully', { clientId, platform });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<RefreshErrorResponse>;
        Logger.error('Google token refresh failed', {
          status: axiosError.response?.status,
          error: axiosError.response?.data?.error,
          message: axiosError.response?.data?.error_description,
        });
      } else {
        Logger.error('Google token refresh failed', error instanceof Error ? error : new Error('Unknown error'));
      }
      return false;
    }
  }

  /**
   * Refresh Meta (Facebook/Instagram) long-lived token
   */
  private async refreshMetaToken(
    clientId: string,
    platform: Platform,
    accessToken: string
  ): Promise<boolean> {
    try {
      const response: AxiosResponse<MetaTokenResponse> = await axios.get(
        'https://graph.facebook.com/v18.0/oauth/access_token',
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.FB_APP_ID,
            client_secret: process.env.FB_APP_SECRET,
            fb_exchange_token: accessToken,
          },
        }
      );

      const { access_token, expires_in } = response.data;

      await this.storage.saveToken({
        clientId,
        platform: platform.toString(),
        accessToken: access_token,
        expiresIn: expires_in,
      });

      Logger.info('Meta token refreshed successfully', { clientId, platform });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<RefreshErrorResponse>;
        Logger.error('Meta token refresh failed', {
          status: axiosError.response?.status,
          error: axiosError.response?.data,
        });
      } else {
        Logger.error('Meta token refresh failed', error instanceof Error ? error : new Error('Unknown error'));
      }
      return false;
    }
  }

  /**
   * Background job to refresh expiring tokens
   */
  async refreshExpiringTokens(): Promise<void> {
    try {
      const expiringConnections = await this.storage.getExpiringTokens(30);

      Logger.info(`Found ${expiringConnections.length} expiring tokens`);

      for (const connection of expiringConnections) {
        const success = await this.refreshToken(connection.clientId, connection.platform);

        await this.storage.logTokenRefresh({
          connectionId: connection.id,
          platform: connection.platform.toString(),
          success,
          oldExpiresAt: connection.expiresAt || undefined,
        });
      }
    } catch (error) {
      Logger.error('Background token refresh failed', error instanceof Error ? error : new Error('Unknown background refresh error'));
    }
  }
}
