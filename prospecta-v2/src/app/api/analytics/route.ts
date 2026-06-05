import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const uid = session.userId;

  const [
    prospectStats,
    campaignStats,
    dealStats,
    prospectsByStatus,
    recentProspects,
  ] = await Promise.all([
    sql`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as this_month,
      ROUND(AVG(score)) as avg_score
      FROM prospects WHERE user_id = ${uid}`,
    sql`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'RUNNING') as running
      FROM campaigns WHERE user_id = ${uid}`,
    sql`SELECT
      COUNT(*) as total,
      COALESCE(SUM(value) FILTER (WHERE stage = 'CLOSED_WON' AND updated_at >= date_trunc('month', NOW())), 0) as won_this_month,
      COALESCE(SUM(value) FILTER (WHERE stage NOT IN ('CLOSED_WON','CLOSED_LOST')), 0) as pipeline_value
      FROM deals WHERE user_id = ${uid}`,
    sql`SELECT status, COUNT(*) as count FROM prospects WHERE user_id = ${uid} GROUP BY status`,
    sql`SELECT first_name, last_name, company, score, status, created_at FROM prospects WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT 5`,
  ]);

  return NextResponse.json({
    data: {
      prospects: prospectStats[0],
      campaigns: campaignStats[0],
      deals: dealStats[0],
      prospectsByStatus,
      recentProspects,
    }
  });
}
