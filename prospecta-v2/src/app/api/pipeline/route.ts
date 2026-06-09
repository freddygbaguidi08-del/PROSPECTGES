// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { DEAL_STAGES } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const deals = await sql`
    SELECT d.*, p.first_name, p.last_name, p.company
    FROM deals d
    LEFT JOIN prospects p ON d.prospect_id = p.id
    WHERE d.user_id = ${session.userId}
    ORDER BY d.created_at DESC
  `;

  const kanban: Record<string, any[]> = {};
  for (const stage of DEAL_STAGES) kanban[stage.key] = [];
  for (const deal of deals) {
    if (kanban[deal.stage]) kanban[deal.stage].push(deal);
  }

  const totalValue = deals
    .filter((d: any) => d.stage !== 'CLOSED_LOST')
    .reduce((sum: number, d: any) => sum + parseFloat(d.value || '0'), 0);

  return NextResponse.json({ data: { kanban, totalValue, total: deals.length } });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json();
  const stage = body.stage ?? 'LEAD';
  const prob = DEAL_STAGES.find((s: any) => s.key === stage)?.prob ?? 10;

  const [deal] = await sql`
    INSERT INTO deals (user_id, prospect_id, title, value, currency, stage, probability, notes)
    VALUES (${session.userId}, ${body.prospectId ?? null}, ${body.title}, ${body.value ?? 0}, ${body.currency ?? 'EUR'}, ${stage}, ${prob}, ${body.notes ?? null})
    RETURNING *
  `;
  return NextResponse.json({ data: deal }, { status: 201 });
}
