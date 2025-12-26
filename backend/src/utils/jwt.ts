import jwt from 'jsonwebtoken';

/**
 * JWT Token Payload Interface
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  [key: string]: any;
}

/**
 * JWT Token Response Interface
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * JWT Verification Result Interface
 */
export interface VerificationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

/**
 * JWT Utility Class for Token Generation and Validation
 */
class JWTUtil {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiration: string;
  private refreshTokenExpiration: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.accessTokenExpiration = process.env.JWT_EXPIRATION || '15m';
    this.refreshTokenExpiration = process.env.JWT_REFRESH_EXPIRATION || '7d';

    this.validateSecrets();
  }

  /**
   * Validate that secrets are configured
   */
  private validateSecrets(): void {
    if (!this.accessTokenSecret || this.accessTokenSecret === 'your-secret-key') {
      console.warn(
        'WARNING: JWT_SECRET is not properly configured. Using default secret is unsafe for production.'
      );
    }
    if (!this.refreshTokenSecret || this.refreshTokenSecret === 'your-refresh-secret-key') {
      console.warn(
        'WARNING: JWT_REFRESH_SECRET is not properly configured. Using default secret is unsafe for production.'
      );
    }
  }

  /**
   * Generate Access Token
   * @param payload - Token payload data
   * @returns JWT access token
   */
  generateAccessToken(payload: TokenPayload): string {
    try {
      const token = jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiration,
        algorithm: 'HS256',
      });
      return token;
    } catch (error) {
      throw new Error(`Failed to generate access token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate Refresh Token
   * @param payload - Token payload data
   * @returns JWT refresh token
   */
  generateRefreshToken(payload: TokenPayload): string {
    try {
      const token = jwt.sign(payload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiration,
        algorithm: 'HS256',
      });
      return token;
    } catch (error) {
      throw new Error(`Failed to generate refresh token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate both Access and Refresh Tokens
   * @param payload - Token payload data
   * @returns Object containing both tokens and expiration
   */
  generateTokenPair(payload: TokenPayload): TokenResponse {
    try {
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      // Extract expiration time in seconds from the access token
      const decoded = jwt.decode(accessToken) as any;
      const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900; // Default to 15 minutes

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      throw new Error(`Failed to generate token pair: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verify Access Token
   * @param token - JWT access token to verify
   * @returns Verification result with payload if valid
   */
  verifyAccessToken(token: string): VerificationResult {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload;

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      const errorMessage = error instanceof jwt.JsonWebTokenError ? error.message : String(error);
      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify Refresh Token
   * @param token - JWT refresh token to verify
   * @returns Verification result with payload if valid
   */
  verifyRefreshToken(token: string): VerificationResult {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload;

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      const errorMessage = error instanceof jwt.JsonWebTokenError ? error.message : String(error);
      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Decode Token without Verification
   * @param token - JWT token to decode
   * @returns Decoded payload or null if invalid
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.decode(token) as TokenPayload;
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param token - JWT token to check
   * @returns True if token is expired, false otherwise
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true;
    }
  }

  /**
   * Extract Token from Bearer Header
   * @param authHeader - Authorization header value
   * @returns Token string or null if invalid format
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Validate Token and Extract Payload
   * @param token - JWT token to validate
   * @param tokenType - Type of token ('access' or 'refresh')
   * @returns Verification result
   */
  validateToken(token: string, tokenType: 'access' | 'refresh' = 'access'): VerificationResult {
    if (tokenType === 'refresh') {
      return this.verifyRefreshToken(token);
    }
    return this.verifyAccessToken(token);
  }

  /**
   * Refresh Access Token using Refresh Token
   * @param refreshToken - Valid refresh token
   * @returns New token pair or error
   */
  refreshAccessToken(refreshToken: string): TokenResponse | VerificationResult {
    const verificationResult = this.verifyRefreshToken(refreshToken);

    if (!verificationResult.valid || !verificationResult.payload) {
      return verificationResult;
    }

    const { userId, email, role } = verificationResult.payload;
    return this.generateTokenPair({
      userId,
      email,
      role,
    });
  }

  /**
   * Get token expiration time
   * @param token - JWT token
   * @returns Expiration time in seconds from now, or -1 if invalid
   */
  getTokenExpiresIn(token: string): number {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return -1;
      }
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      return Math.max(expiresIn, -1);
    } catch (error) {
      return -1;
    }
  }
}

// Export singleton instance
export const jwtUtil = new JWTUtil();

// Export class for testing or custom instantiation
export default JWTUtil;
