import { NextRequest, NextResponse } from 'next/server';
import { CreateTokenSchema, GetTokensQuerySchema } from '@/schema/token.schema';
import { tokenRepo } from '@/lib/token-repository';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate Input
    const validatedData = CreateTokenSchema.parse(body);

    // 2. Execute Logic
    const token = await tokenRepo.create(validatedData);

    // 3. Return Response
    return NextResponse.json(token, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // 1. Validate Query Params manually or via Zod
  const validation = GetTokensQuerySchema.safeParse({ userId: userId || '' });

  if (!validation.success) {
    return NextResponse.json({ error: 'Missing or invalid userId parameter' }, { status: 400 });
  }

  // 2. Fetch Data
  const tokens = await tokenRepo.findValidByUser(validation.data.userId);

  return NextResponse.json(tokens, { status: 200 });
}
