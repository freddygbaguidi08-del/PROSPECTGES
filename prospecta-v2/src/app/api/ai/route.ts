import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { generateEmail, analyzeSentiment } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json() as {
    action: 'generate' | 'sentiment';
    prospectName?: string; company?: string; jobTitle?: string;
    goal?: string; tone?: string; language?: string;
    text?: string;
  };

  if (body.action === 'generate') {
    const result = await generateEmail({
      prospectName: body.prospectName ?? 'Prospect',
      company: body.company ?? 'votre entreprise',
      jobTitle: body.jobTitle ?? '',
      senderName: session.name,
      goal: body.goal ?? 'présenter notre solution',
      tone: body.tone ?? 'friendly',
      language: body.language ?? 'fr',
    });
    return NextResponse.json({ data: result });
  }

  if (body.action === 'sentiment') {
    const result = await analyzeSentiment(body.text ?? '');
    return NextResponse.json({ data: result });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
