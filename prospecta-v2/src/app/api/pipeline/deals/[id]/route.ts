import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { DEAL_STAGES } from '@/lib/utils';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json() as Record<string, string | number>;

  if (body.stage) {
    const prob = DEAL_STAGES.find(s => s.key === body.stage)?.prob ?? 10;
    const [deal] = await sql`
      UPDATE deals SET stage = ${body.stage as string}, probability = ${prob}, updated_at = NOW()
      WHERE id = ${params.id} AND user_id = ${session.userId} RETURNING *
    `;
    return NextResponse.json({ data: deal });
  }

  const [deal] = await sql`
    UPDATE deals SET
      title = COALESCE(${body.title as string ?? null}, title),
      value = COALESCE(${body.value as number ?? null}, value),
      notes = COALESCE(${body.notes as string ?? null}, notes),
      updated_at = NOW()
    WHERE id = ${params.id} AND user_id = ${session.userId} RETURNING *
  `;
  return NextResponse.json({ data: deal });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  await sql`DELETE FROM deals WHERE id = ${params.id} AND user_id = ${session.userId}`;
  return NextResponse.json({ success: true });
}
