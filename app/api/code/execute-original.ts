import { NextRequest, NextResponse } from 'next/server';
import { executeCode } from '@/lib/coding/tools/code-executor';

export async function POST(req: NextRequest) {
  const { code, language } = await req.json();
  if (!code || !language) {
    return NextResponse.json({ error: 'Code and language required.' }, { status: 400 });
  }
  try {
    const result = await executeCode(code, language);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
