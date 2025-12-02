import { z } from 'zod';

export const CreateTokenSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
  expiresInMinutes: z.number().int().positive('expiresInMinutes must be a positive integer'),
});

export type CreateTokenRequest = z.infer<typeof CreateTokenSchema>;

export const GetTokensQuerySchema = z.object({
  userId: z.string().min(1),
});
