import crypto from 'node:crypto';
import { AccessToken } from '../types';
import { CreateTokenRequest } from '../schema/token.schema';

export class TokenRepository {
  private db: Map<string, AccessToken> = new Map();

  /**
   * Creates a token with expiry and stores it.
   * Ensures token ID uniqueness by checking for collisions.
   */
  async create(data: CreateTokenRequest): Promise<AccessToken> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + data.expiresInMinutes * 60000);

    // Generate unique ID (with collision check, though UUID collisions are extremely rare)
    let tokenId: string;
    let attempts = 0;
    const maxAttempts = 10; // Safety limit

    do {
      tokenId = `id_${crypto.randomUUID()}`;
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique token ID after multiple attempts');
      }
    } while (this.db.has(tokenId)); // Check for collision

    const newToken: AccessToken = {
      id: tokenId,
      userId: data.userId,
      scopes: data.scopes,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      token: crypto.randomBytes(32).toString('hex'), // Secure random token
    };

    this.db.set(newToken.id, newToken);
    return newToken;
  }

  /**
   * Finds all non-expired tokens for a user.
   */
  async findValidByUser(userId: string): Promise<AccessToken[]> {
    const now = new Date();
    const tokens: AccessToken[] = [];

    for (const token of this.db.values()) {
      if (token.userId === userId) {
        const expiry = new Date(token.expiresAt);
        if (expiry > now) {
          tokens.push(token);
        }
      }
    }

    return tokens;
  }
}

export const tokenRepo = new TokenRepository();
