// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req, { params }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  const [campaign] = await sql`SELECT * FROM campaigns WHERE id = ${params.id} AND user_id = ${session.userId}`;
  if (!campaign) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const steps = await sql`SELECT * FROM campaign_steps WHERE campaign_id = ${params.id} ORDER BY step_order ASC`;
  const [stats] = await sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='SENT') as sent, COUNT(*) FILTER (WHERE open_count>0) as opened FROM email_logs WHERE campaign_id = ${params.id}`;
  return NextResponse.json({ data: { ...campaign, steps, stats } });
}

export async function PUT(req, { params }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  const [existing] = await sql`SELECT * FROM campaigns WHERE id = ${params.id} AND user_id = ${session.userId}`;
  if (!existing) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const body = await req.json();
  const [updated] = await sql`
    UPDATE campaigns SET
      name = ${body.name || existing.name},
      description = ${body.description ?? existing.description},
      from_name = ${body.fromName || existing.from_name},
      from_email = ${body.fromEmail || existing.from_email},
      daily_limit = ${body.dailyLimit || existing.daily_limit}
    WHERE id = ${params.id} AND user_id = ${session.userId} RETURNING *
  `;
  if (body.steps && Array.isArray(body.steps)) {
    await sql`DELETE FROM campaign_steps WHERE campaign_id = ${params.id}`;
    for (const step of body.steps) {
      await sql`INSERT INTO campaign_steps (campaign_id, step_order, subject, body, delay_days) VALUES (${params.id}, ${step.order}, ${step.subject}, ${step.body}, ${step.delayDays || 0})`;
    }
  }
  const steps = await sql`SELECT * FROM campaign_steps WHERE campaign_id = ${params.id} ORDER BY step_order ASC`;
  return NextResponse.json({ data: { ...updated, steps } });
}

export async function PATCH(req, { params }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  const { status } = await req.json();
  const [updated] = await sql`UPDATE campaigns SET status = ${status} WHERE id = ${params.id} AND user_id = ${session.userId} RETURNING *`;
  return NextResponse.json({ data: updated });
}

export async function DELETE(req, { params }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  await sql`DELETE FROM campaigns WHERE id = ${params.id} AND user_id = ${session.userId}`;
  return NextResponse.json({ success: true });
}
