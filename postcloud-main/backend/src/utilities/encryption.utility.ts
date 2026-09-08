import * as crypto from 'crypto';

export class EncryptionUtility {
  private static readonly IV_LENGTH = 16; // AES requires a 16-byte IV
  private static encryptionKey: Buffer;

  static configureFromRawKey(rawKey: string): void {
    if (!rawKey || rawKey.trim() === '') {
      throw new Error('Missing required configuration value: ENCRYPTION_KEY');
    }

    EncryptionUtility.encryptionKey = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest();
  }

  private static getEncryptionKey(): Buffer {
    if (!EncryptionUtility.encryptionKey) {
      throw new Error(
        'Encryption key is not configured. Ensure encryption config bootstrap runs on startup.',
      );
    }
    return EncryptionUtility.encryptionKey;
  }

  // Encrypt text using AES-256-CBC
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(EncryptionUtility.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      EncryptionUtility.getEncryptionKey(),
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return `${iv.toString('base64')}:${encrypted}`;
  }

  static isEncrypted(value: string): boolean {
    const [iv, data, ...extraParts] = value.split(':');
    if (!iv || !data || extraParts.length > 0) {
      return false;
    }

    return Buffer.from(iv, 'base64').length === EncryptionUtility.IV_LENGTH;
  }

  // Decrypt text using AES-256-CBC
  static decrypt(encrypted: string): string {
    if (!EncryptionUtility.isEncrypted(encrypted)) {
      return encrypted;
    }

    const [iv, data] = encrypted.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      EncryptionUtility.getEncryptionKey(),
      Buffer.from(iv, 'base64'),
    );
    let decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
