// /app/api/chat/route.ts
import '@/lib/server-init'; // <-- Add this as the very first import

import { handleUserRequest } from '@/lib/ai-engine/orchestrator';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // ... your API route logic ...
  const { userId, sessionId, prompt } = await req.json();
  const result = await handleUserRequest(userId, sessionId, prompt);
  return NextResponse.json(result);
}
