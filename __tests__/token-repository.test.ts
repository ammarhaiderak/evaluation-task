import { describe, it, expect, beforeEach } from 'vitest';
import { TokenRepository } from '../lib/token-repository';
import { CreateTokenRequest } from '../schema/token.schema';

function createRepository(): TokenRepository {
  return new TokenRepository();
}

describe('TokenRepository', () => {
  let repo: TokenRepository;

  beforeEach(() => {
    repo = createRepository();
  });

  it('should create a token with correct structure and unique ID', async () => {
    const data: CreateTokenRequest = {
      userId: 'user123',
      scopes: ['read', 'write'],
      expiresInMinutes: 60,
    };

    const token = await repo.create(data);

    expect(token).toHaveProperty('id');
    expect(token).toHaveProperty('userId', 'user123');
    expect(token).toHaveProperty('scopes', ['read', 'write']);
    expect(token).toHaveProperty('token');
    expect(token).toHaveProperty('createdAt');
    expect(token).toHaveProperty('expiresAt');
    expect(token.id).toMatch(/^id_/);
    expect(token.token).toHaveLength(64);

    // Verify unique IDs
    const token2 = await repo.create({ ...data, userId: 'user456' });
    expect(token.id).not.toBe(token2.id);
  });

  it('should find multiple tokens by userId and filter expired tokens', async () => {
    // Create multiple tokens for same user
    await repo.create({
      userId: 'user123',
      scopes: ['read'],
      expiresInMinutes: 60,
    });

    await repo.create({
      userId: 'user123',
      scopes: ['write'],
      expiresInMinutes: 60,
    });

    // Should return both tokens
    const tokens = await repo.findValidByUser('user123');
    expect(tokens).toHaveLength(2);
    expect(tokens.every(t => t.userId === 'user123')).toBe(true);

    // Different user should have separate tokens
    await repo.create({
      userId: 'user456',
      scopes: ['admin'],
      expiresInMinutes: 60,
    });
    const user456Tokens = await repo.findValidByUser('user456');
    expect(user456Tokens).toHaveLength(1);
    expect(user456Tokens[0].scopes).toEqual(['admin']);
  });

  it('should return empty array for user with no tokens', async () => {
    const tokens = await repo.findValidByUser('nonexistent');
    expect(tokens).toEqual([]);
  });
});
