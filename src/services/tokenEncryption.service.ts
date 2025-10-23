import crypto from 'crypto';
import { Logger } from '../utils/logger';
import { TokenData, EncryptedTokenResult } from '../types/types';

export class TokenEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor() {
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    
    if (!key) {
      throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required');
    }

    // Ensure key is 32 bytes for AES-256
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  /**
   * Encrypt token data
   */
  encrypt(data: TokenData): EncryptedTokenResult {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      const jsonString = JSON.stringify(data);
      let encrypted = cipher.update(jsonString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      Logger.error('Token encryption failed', error instanceof Error ? error : new Error('Unknown encryption error'));
      throw new Error('Failed to encrypt token data');
    }
  }

  /**
   * Decrypt token data
   */
  decrypt(encrypted: string, iv: string, authTag: string): TokenData {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted) as TokenData;
    } catch (error) {
      Logger.error('Token decryption failed', error instanceof Error ? error : new Error('Unknown decryption error'));
      throw new Error('Failed to decrypt token data');
    }
  }

  /**
   * Generate secure random token for verify tokens
   */
  generateVerifyToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
