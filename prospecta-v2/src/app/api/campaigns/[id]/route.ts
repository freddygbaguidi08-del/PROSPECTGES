import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const [campaign] = await sql`SELECT * FROM campaigns WHERE id = ${params.id} AND user_id = ${session.userId}`;
  if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });

  const steps = await sql`SELECT * FROM campaign_steps WHERE campaign_id = ${params.id} ORDER BY step_order ASC`;
  const stats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'SENT') as sent,
      COUNT(*) FILTER (WHERE open_count > 0) as opened,
      COUNT(*) as total
    FROM email_logs WHERE campaign_id = ${params.id}
  `;

  return NextResponse.json({ data: { ...campaign, steps, stats: stats[0] } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { status } = await req.json() as { status: string };
  const [updated] = await sql`
    UPDATE campaigns SET status = ${status} WHERE id = ${params.id} AND user_id = ${session.userId} RETURNING *
  `;
  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  await sql`DELETE FROM campaigns WHERE id = ${params.id} AND user_id = ${session.userId}`;
  return NextResponse.json({ success: true });
}
