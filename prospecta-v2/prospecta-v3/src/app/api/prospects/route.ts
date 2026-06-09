// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { calcScore } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let prospects;
  let countResult;

  if (search && status) {
    prospects = await sql`
      SELECT * FROM prospects WHERE user_id = ${session.userId}
        AND status = ${status}
        AND (first_name ILIKE ${'%' + search + '%'} OR last_name ILIKE ${'%' + search + '%'}
          OR email ILIKE ${'%' + search + '%'} OR company ILIKE ${'%' + search + '%'})
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    countResult = await sql`SELECT COUNT(*) FROM prospects WHERE user_id = ${session.userId} AND status = ${status} AND (first_name ILIKE ${'%' + search + '%'} OR last_name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'} OR company ILIKE ${'%' + search + '%'})`;
  } else if (search) {
    prospects = await sql`
      SELECT * FROM prospects WHERE user_id = ${session.userId}
        AND (first_name ILIKE ${'%' + search + '%'} OR last_name ILIKE ${'%' + search + '%'}
          OR email ILIKE ${'%' + search + '%'} OR company ILIKE ${'%' + search + '%'})
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    countResult = await sql`SELECT COUNT(*) FROM prospects WHERE user_id = ${session.userId} AND (first_name ILIKE ${'%' + search + '%'} OR last_name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'} OR company ILIKE ${'%' + search + '%'})`;
  } else if (status) {
    prospects = await sql`SELECT * FROM prospects WHERE user_id = ${session.userId} AND status = ${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    countResult = await sql`SELECT COUNT(*) FROM prospects WHERE user_id = ${session.userId} AND status = ${status}`;
  } else {
    prospects = await sql`SELECT * FROM prospects WHERE user_id = ${session.userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    countResult = await sql`SELECT COUNT(*) FROM prospects WHERE user_id = ${session.userId}`;
  }

  const total = parseInt(countResult[0].count as string);
  return NextResponse.json({ data: prospects, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json() as Record<string, string>;
  const { firstName, lastName, email, phone, company, jobTitle, website, linkedinUrl, country, city, industry, companySize, notes } = body;

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: 'Prénom, nom et email requis' }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM prospects WHERE user_id = ${session.userId} AND email = ${email}`;
  if (existing.length > 0) return NextResponse.json({ error: 'Ce prospect existe déjà' }, { status: 409 });

  const score = calcScore({ email, phone, company, jobTitle, linkedinUrl, country, industry, companySize });

  const [prospect] = await sql`
    INSERT INTO prospects (user_id, first_name, last_name, email, phone, company, job_title, website, linkedin_url, country, city, industry, company_size, notes, score)
    VALUES (${session.userId}, ${firstName}, ${lastName}, ${email}, ${phone ?? null}, ${company ?? null}, ${jobTitle ?? null}, ${website ?? null}, ${linkedinUrl ?? null}, ${country ?? null}, ${city ?? null}, ${industry ?? null}, ${companySize ?? null}, ${notes ?? null}, ${score})
    RETURNING *
  `;

  return NextResponse.json({ data: prospect }, { status: 201 });
}
