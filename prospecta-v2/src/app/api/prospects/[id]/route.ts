// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { calcScore } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const [prospect] = await sql`SELECT * FROM prospects WHERE id = ${params.id} AND user_id = ${session.userId}`;
  if (!prospect) return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 });

  const deals = await sql`SELECT * FROM deals WHERE prospect_id = ${params.id} ORDER BY created_at DESC`;
  const emails = await sql`SELECT * FROM email_logs WHERE prospect_id = ${params.id} ORDER BY sent_at DESC LIMIT 10`;

  return NextResponse.json({ data: { ...prospect, deals, emails } });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json() as Record<string, string>;
  const score = calcScore(body);

  const [updated] = await sql`
    UPDATE prospects SET
      first_name = ${body.firstName ?? ''},
      last_name = ${body.lastName ?? ''},
      email = ${body.email ?? ''},
      phone = ${body.phone ?? null},
      company = ${body.company ?? null},
      job_title = ${body.jobTitle ?? null},
      website = ${body.website ?? null},
      linkedin_url = ${body.linkedinUrl ?? null},
      country = ${body.country ?? null},
      city = ${body.city ?? null},
      industry = ${body.industry ?? null},
      company_size = ${body.companySize ?? null},
      status = ${body.status ?? 'NEW'},
      notes = ${body.notes ?? null},
      score = ${score},
      updated_at = NOW()
    WHERE id = ${params.id} AND user_id = ${session.userId}
    RETURNING *
  `;

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  await sql`DELETE FROM prospects WHERE id = ${params.id} AND user_id = ${session.userId}`;
  return NextResponse.json({ success: true });
}
