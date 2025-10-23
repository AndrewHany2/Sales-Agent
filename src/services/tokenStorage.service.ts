import { PrismaClient, Platform, ConnectorStatus, ClientPlatformConnection, EncryptedToken, Client, Prisma } from '@prisma/client';
import { TokenEncryptionService } from './tokenEncryption.service';
import { Logger } from '../utils/logger';
import { TokenData, SaveTokenParams, TokenRefreshLogParams } from '../types/types'

const prisma = new PrismaClient();

type ConnectionWithEncryption = ClientPlatformConnection & {
  encryptedToken: EncryptedToken | null;
  client?: Client;
};

export class TokenStorageService {
  private encryption: TokenEncryptionService;

  constructor() {
    this.encryption = new TokenEncryptionService();
  }

  /**
   * Save or update token for a client's platform connection
   */
  async saveToken(params: SaveTokenParams): Promise<void> {
    try {
      const expiresAt = params.expiresIn
        ? new Date(Date.now() + params.expiresIn * 1000)
        : undefined;

      // Prepare token data for encryption
      const tokenData: TokenData = {
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        idToken: params.idToken,
        tokenType: params.tokenType || 'Bearer',
        scope: params.scope,
        expiresAt,
        extra: params.profile as Prisma.InputJsonValue,
      };

      // Encrypt the token data
      const { encrypted, iv, authTag } = this.encryption.encrypt(tokenData);

      const platformEnum = params.platform as Platform;
      
      // Ensure client exists BEFORE transaction
      const existingClient = await prisma.client.findUnique({
        where: { id: params.clientId },
      });

      if (!existingClient) {
        await prisma.client.create({
          data: {
            id: params.clientId,
            name: params.externalName 
              ? `${params.externalName} (${params.platform})` 
              : `Client ${params.clientId.substring(0, 8)}`,
          },
        });
      }

      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Upsert the connection
        const connection = await tx.clientPlatformConnection.upsert({
          where: {
            clientId_platform: {
              clientId: params.clientId,
              platform: platformEnum,
            },
          },
          create: {
            clientId: params.clientId,
            platform: platformEnum,
            status: ConnectorStatus.CONNECTED,
            accessToken: '***',
            refreshToken: params.refreshToken ? '***' : null,
            tokenType: params.tokenType || 'Bearer',
            expiresAt,
            externalAccountId: params.externalAccountId,
            externalName: params.externalName,
            externalHandle: params.externalHandle,
            scopesGranted: params.scope,
            extra: params.profile as Prisma.InputJsonValue,
          },
          update: {
            status: ConnectorStatus.CONNECTED,
            accessToken: '***',
            refreshToken: params.refreshToken ? '***' : null,
            tokenType: params.tokenType || 'Bearer',
            expiresAt,
            externalAccountId: params.externalAccountId,
            externalName: params.externalName,
            externalHandle: params.externalHandle,
            scopesGranted: params.scope,
            extra: params.profile as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
        });

        // Store encrypted tokens
        await tx.encryptedToken.upsert({
          where: {
            connectionId: connection.id,
          },
          create: {
            connectionId: connection.id,
            encryptedData: encrypted,
            iv,
            authTag,
          },
          update: {
            encryptedData: encrypted,
            iv,
            authTag,
            updatedAt: new Date(),
          },
        });
      });

      Logger.info('Token saved successfully', {
        clientId: params.clientId,
        platform: params.platform,
      });
    } catch (error) {
      Logger.error('Failed to save token', error instanceof Error ? error : new Error('Unknown save error'));
      throw new Error('Failed to save token');
    }
  }

  /**
   * Get decrypted token for a client's platform connection
   */
  async getToken(clientId: string, platform: Platform): Promise<TokenData | null> {
    try {
      const connection = await prisma.clientPlatformConnection.findUnique({
        where: {
          clientId_platform: {
            clientId,
            platform,
          },
        },
        include: {
          encryptedToken: true,
        },
      });

      if (!connection || !connection.encryptedToken) {
        return null;
      }

      // Decrypt token data
      const tokenData = this.encryption.decrypt(
        connection.encryptedToken.encryptedData,
        connection.encryptedToken.iv,
        connection.encryptedToken.authTag
      );

      // Check if token is expired
      if (tokenData.expiresAt && new Date() >= tokenData.expiresAt) {
        Logger.warn('Token is expired', { clientId, platform });
        
        if (tokenData.refreshToken) {
          Logger.info('Attempting to refresh expired token', { clientId, platform });
        }
      }

      return tokenData;
    } catch (error) {
      Logger.error('Failed to get token', error instanceof Error ? error : new Error('Unknown get error'));
      return null;
    }
  }

  /**
   * Check if token exists and is valid
   */
  async isTokenValid(clientId: string, platform: Platform): Promise<boolean> {
    try {
      const tokenData = await this.getToken(clientId, platform);

      if (!tokenData) {
        return false;
      }

      // Check expiration
      if (tokenData.expiresAt && new Date() >= tokenData.expiresAt) {
        return false;
      }

      return true;
    } catch (error) {
      Logger.error('Failed to check token validity', error instanceof Error ? error : new Error('Unknown validity check error'));
      return false;
    }
  }

  /**
   * Delete token for a client's platform connection
   */
  async deleteToken(clientId: string, platform: Platform): Promise<boolean> {
    try {
      const connection = await prisma.clientPlatformConnection.findUnique({
        where: {
          clientId_platform: {
            clientId,
            platform,
          },
        },
      });

      if (!connection) {
        return false;
      }

      // Delete encrypted token
      await prisma.encryptedToken.delete({
        where: {
          connectionId: connection.id,
        },
      });

      // Update connection status
      await prisma.clientPlatformConnection.update({
        where: {
          id: connection.id,
        },
        data: {
          status: ConnectorStatus.DISCONNECTED,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        },
      });

      Logger.info('Token deleted successfully', { clientId, platform });
      return true;
    } catch (error) {
      Logger.error('Failed to delete token', error instanceof Error ? error : new Error('Unknown delete error'));
      return false;
    }
  }

  /**
   * Get all connections for a client
   */
  async getClientConnections(clientId: string): Promise<ClientPlatformConnection[]> {
    try {
      return await prisma.clientPlatformConnection.findMany({
        where: {
          clientId,
        },
      });
    } catch (error) {
      Logger.error('Failed to get client connections', error instanceof Error ? error : new Error('Unknown connections error'));
      return [];
    }
  }

  /**
   * Log token refresh attempt
   */
  async logTokenRefresh(params: TokenRefreshLogParams): Promise<void> {
    try {
      const platformEnum = params.platform as Platform;
      
      await prisma.tokenRefreshLog.create({
        data: {
          connectionId: params.connectionId,
          platform: platformEnum,
          success: params.success,
          errorMessage: params.errorMessage,
          oldExpiresAt: params.oldExpiresAt,
          newExpiresAt: params.newExpiresAt,
        },
      });
    } catch (error) {
      Logger.error('Failed to log token refresh', error instanceof Error ? error : new Error('Unknown log error'));
    }
  }

  /**
   * Get tokens that are about to expire (for proactive refresh)
   */
  async getExpiringTokens(withinMinutes: number = 30): Promise<ConnectionWithEncryption[]> {
    try {
      const expiryThreshold = new Date(Date.now() + withinMinutes * 60 * 1000);

      return await prisma.clientPlatformConnection.findMany({
        where: {
          status: ConnectorStatus.CONNECTED,
          expiresAt: {
            lte: expiryThreshold,
            gte: new Date(),
          },
          refreshToken: {
            not: null,
          },
        },
        include: {
          client: true,
          encryptedToken: true,
        },
      });
    } catch (error) {
      Logger.error('Failed to get expiring tokens', error instanceof Error ? error : new Error('Unknown expiring tokens error'));
      return [];
    }
  }
}
