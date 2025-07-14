import { NextRequest, NextResponse } from 'next/server';
import { submitFeedback, FeedbackType } from '@/lib/ai-engine/feedback';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Basic validation
    if (!data.userId || !data.sessionId || !data.type || !data.prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate feedback type
    if (!Object.values(FeedbackType).includes(data.type)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
    }

    await submitFeedback({
      userId: data.userId,
      sessionId: data.sessionId,
      type: data.type,
      prompt: data.prompt,
      responseSummary: data.responseSummary || '',
      details: data.details || '',
    }, data.context || {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
