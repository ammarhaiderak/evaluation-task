import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../app/api/tokens/route';
import { AccessToken } from '../types';

describe('API /api/tokens', () => {
  it('should create a token successfully via POST', async () => {
    const body = {
      userId: 'user123',
      scopes: ['read', 'write'],
      expiresInMinutes: 60,
    };

    const request = new NextRequest('http://localhost/api/tokens', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json() as AccessToken;
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('userId', 'user123');
    expect(data).toHaveProperty('scopes', ['read', 'write']);
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('expiresAt');
  });

  it('should return 400 for invalid input', async () => {
    const body = {
      scopes: ['read'],
      expiresInMinutes: 60,
      // Missing userId
    };

    const request = new NextRequest('http://localhost/api/tokens', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error', 'Validation Error');
  });

  it('should retrieve token by userId via GET', async () => {
    // First create a token
    const createRequest = new NextRequest('http://localhost/api/tokens', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user456',
        scopes: ['read', 'write'],
        expiresInMinutes: 60,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    await POST(createRequest);

    // Then retrieve it
    const getRequest = new NextRequest('http://localhost/api/tokens?userId=user456', {
      method: 'GET',
    });

    const response = await GET(getRequest);
    expect(response.status).toBe(200);

    const data = await response.json() as AccessToken[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].userId).toBe('user456');
  });

  it('should return 400 for missing userId in GET request', async () => {
    const request = new NextRequest('http://localhost/api/tokens', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error', 'Missing or invalid userId parameter');
  });
});
