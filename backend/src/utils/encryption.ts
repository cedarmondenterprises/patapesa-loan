import crypto from 'crypto';

/**
 * Encryption utility class for encrypting and decrypting sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */
class EncryptionUtil {
  private algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer;
  private keyLength = 32; // 256 bits for AES-256
  private tagLength = 16; // 128 bits for GCM tag
  private saltLength = 16; // 128 bits for salt

  /**
   * Initialize the encryption utility with a master key
   * @param masterKey - The master encryption key (will be derived if too short)
   */
  constructor(masterKey?: string) {
    if (!masterKey) {
      masterKey = process.env.ENCRYPTION_KEY || '';
      if (!masterKey) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
      }
    }

    // Derive a consistent key from the master key using PBKDF2
    this.encryptionKey = this.deriveKey(masterKey);
  }

  /**
   * Derive a consistent encryption key from a master key using PBKDF2
   * @param masterKey - The master key to derive from
   * @returns The derived key buffer
   */
  private deriveKey(masterKey: string): Buffer {
    const salt = 'patapesa-encryption-salt'; // Fixed salt for consistency
    return crypto.pbkdf2Sync(masterKey, salt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data - The data to encrypt (string or buffer)
   * @param additionalData - Optional additional authenticated data
   * @returns Encrypted data as base64 string in format: iv:tag:encryptedData
   */
  encrypt(data: string | Buffer, additionalData?: string): string {
    try {
      const iv = crypto.randomBytes(12); // 96-bit IV for GCM
      const plaintext = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Set additional authenticated data if provided
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData, 'utf-8'));
      }

      const encrypted = Buffer.concat([
        cipher.update(plaintext),
        cipher.final(),
      ]);

      const tag = cipher.getAuthTag();

      // Format: base64(iv):base64(tag):base64(encryptedData)
      const result = [
        iv.toString('base64'),
        tag.toString('base64'),
        encrypted.toString('base64'),
      ].join(':');

      return result;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data that was encrypted with the encrypt method
   * @param encryptedData - The encrypted data in format: iv:tag:encryptedData (base64)
   * @param additionalData - Optional additional authenticated data (must match encryption)
   * @returns Decrypted data as string
   */
  decrypt(encryptedData: string, additionalData?: string): string {
    try {
      const parts = encryptedData.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format. Expected format: iv:tag:encryptedData');
      }

      const [ivStr, tagStr, encryptedStr] = parts;

      const iv = Buffer.from(ivStr, 'base64');
      const tag = Buffer.from(tagStr, 'base64');
      const encrypted = Buffer.from(encryptedStr, 'base64');

      // Validate IV length
      if (iv.length !== 12) {
        throw new Error('Invalid IV length');
      }

      // Validate tag length
      if (tag.length !== this.tagLength) {
        throw new Error('Invalid authentication tag length');
      }

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);

      // Set additional authenticated data if provided
      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData, 'utf-8'));
      }

      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf-8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a random salt for password hashing
   * @returns Random salt as base64 string
   */
  generateSalt(): string {
    return crypto.randomBytes(this.saltLength).toString('base64');
  }

  /**
   * Hash a password using PBKDF2
   * @param password - The password to hash
   * @param salt - The salt to use (if not provided, a new one is generated)
   * @returns Hash in format: salt:hash or just hash if salt was provided
   */
  hashPassword(password: string, salt?: string): string {
    try {
      const useSalt = salt || this.generateSalt();
      const hash = crypto.pbkdf2Sync(password, useSalt, 100000, 32, 'sha256');

      // Return salt:hash if salt was generated, otherwise just hash
      if (!salt) {
        return `${useSalt}:${hash.toString('hex')}`;
      }
      return hash.toString('hex');
    } catch (error) {
      throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a password against a hash
   * @param password - The password to verify
   * @param hash - The hash to verify against (format: salt:hash or hash)
   * @returns True if the password matches the hash
   */
  verifyPassword(password: string, hash: string): boolean {
    try {
      const parts = hash.split(':');

      let salt: string;
      let hashToCompare: string;

      if (parts.length === 2) {
        [salt, hashToCompare] = parts;
      } else if (parts.length === 1) {
        // If no salt in hash, assume a default salt
        salt = 'patapesa-default-salt';
        hashToCompare = hash;
      } else {
        return false;
      }

      const passwordHash = this.hashPassword(password, salt);
      return passwordHash === hashToCompare;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a cryptographically secure random token
   * @param length - Length of the token in bytes (default: 32)
   * @returns Random token as base64 string
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Generate a hash of data (SHA-256)
   * @param data - The data to hash
   * @returns Hash as hexadecimal string
   */
  hashData(data: string | Buffer): string {
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Create an HMAC signature for data integrity verification
   * @param data - The data to sign
   * @param secret - The secret key (if not provided, uses the encryption key)
   * @returns HMAC signature as base64 string
   */
  createSignature(data: string | Buffer, secret?: Buffer): string {
    const secretKey = secret || this.encryptionKey;
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
    return crypto.createHmac('sha256', secretKey).update(buffer).digest('base64');
  }

  /**
   * Verify an HMAC signature
   * @param data - The original data
   * @param signature - The signature to verify
   * @param secret - The secret key (if not provided, uses the encryption key)
   * @returns True if the signature is valid
   */
  verifySignature(data: string | Buffer, signature: string, secret?: Buffer): boolean {
    try {
      const expectedSignature = this.createSignature(data, secret);
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export default new EncryptionUtil();

// Export class for testing or custom instances
export { EncryptionUtil };
