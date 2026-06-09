// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  try {
    const sql = (await import('@/lib/db')).default;
    const { initDB } = await import('@/lib/db');
    await initDB();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 30;
    const offset = (page - 1) * limit;

    let logs;
    if (filter === 'sent') {
      logs = await sql`
        SELECT el.*, p.first_name, p.last_name, p.company, c.name as campaign_name
        FROM email_logs el
        LEFT JOIN prospects p ON el.prospect_id = p.id
        LEFT JOIN campaigns c ON el.campaign_id = c.id
        WHERE el.user_id = ${session.userId} AND el.status = 'SENT'
        ORDER BY el.sent_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (filter === 'opened') {
      logs = await sql`
        SELECT el.*, p.first_name, p.last_name, p.company, c.name as campaign_name
        FROM email_logs el
        LEFT JOIN prospects p ON el.prospect_id = p.id
        LEFT JOIN campaigns c ON el.campaign_id = c.id
        WHERE el.user_id = ${session.userId} AND el.open_count > 0
        ORDER BY el.sent_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      logs = await sql`
        SELECT el.*, p.first_name, p.last_name, p.company, c.name as campaign_name
        FROM email_logs el
        LEFT JOIN prospects p ON el.prospect_id = p.id
        LEFT JOIN campaigns c ON el.campaign_id = c.id
        WHERE el.user_id = ${session.userId}
        ORDER BY el.sent_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const [countResult] = await sql`SELECT COUNT(*) as total FROM email_logs WHERE user_id = ${session.userId}`;
    const [stats] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE open_count > 0) as opened,
        COUNT(*) FILTER (WHERE status = 'SENT') as sent
      FROM email_logs WHERE user_id = ${session.userId}
    `;

    return NextResponse.json({ data: logs, total: countResult.total, stats, page });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
