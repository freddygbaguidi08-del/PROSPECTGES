// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const campaigns = await sql`
    SELECT c.*,
      (SELECT COUNT(*) FROM campaign_steps WHERE campaign_id = c.id) as steps_count,
      (SELECT COUNT(*) FROM email_logs WHERE campaign_id = c.id) as emails_sent
    FROM campaigns c WHERE c.user_id = ${session.userId}
    ORDER BY c.created_at DESC
  `;

  return NextResponse.json({ data: campaigns });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json() as {
    name: string; description?: string; fromName: string; fromEmail: string;
    dailyLimit?: number; steps?: Array<{ order: number; subject: string; body: string; delayDays: number }>;
  };

  const [campaign] = await sql`
    INSERT INTO campaigns (user_id, name, description, from_name, from_email, daily_limit)
    VALUES (${session.userId}, ${body.name}, ${body.description ?? null}, ${body.fromName}, ${body.fromEmail}, ${body.dailyLimit ?? 50})
    RETURNING *
  `;

  if (body.steps && body.steps.length > 0) {
    for (const step of body.steps) {
      await sql`
        INSERT INTO campaign_steps (campaign_id, step_order, subject, body, delay_days)
        VALUES (${campaign.id as string}, ${step.order}, ${step.subject}, ${step.body}, ${step.delayDays})
      `;
    }
  }

  return NextResponse.json({ data: campaign }, { status: 201 });
}
