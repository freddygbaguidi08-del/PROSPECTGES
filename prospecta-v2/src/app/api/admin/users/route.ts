// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  // Check admin role
  const [user] = await sql`SELECT role FROM users WHERE id = ${session.userId}`;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé — Admin uniquement' }, { status: 403 });
  }

  // Get all users with their stats
  const users = await sql`
    SELECT
      u.id, u.name, u.email, u.role, u.org_name, u.created_at,
      (SELECT COUNT(*) FROM prospects WHERE user_id = u.id) as prospects_count,
      (SELECT COUNT(*) FROM campaigns WHERE user_id = u.id) as campaigns_count,
      (SELECT COUNT(*) FROM deals WHERE user_id = u.id) as deals_count,
      (SELECT COUNT(*) FROM email_logs WHERE user_id = u.id) as emails_count
    FROM users u
    ORDER BY u.created_at DESC
  `;

  // Global stats
  const [globalStats] = await sql`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM prospects) as total_prospects,
      (SELECT COUNT(*) FROM campaigns) as total_campaigns,
      (SELECT COUNT(*) FROM email_logs) as total_emails,
      (SELECT COUNT(*) FROM deals WHERE stage = 'CLOSED_WON') as total_deals_won
  `;

  return NextResponse.json({ data: { users, globalStats } });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const [admin] = await sql`SELECT role FROM users WHERE id = ${session.userId}`;
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { userId, action, role } = await req.json();

  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

  // Cannot modify yourself
  if (userId === session.userId) {
    return NextResponse.json({ error: 'Vous ne pouvez pas modifier votre propre compte ici' }, { status: 400 });
  }

  if (action === 'change_role' && role) {
    if (!['ADMIN', 'USER', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }
    await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
    return NextResponse.json({ success: true, message: `Rôle mis à jour: ${role}` });
  }

  if (action === 'delete') {
    await sql`DELETE FROM users WHERE id = ${userId}`;
    return NextResponse.json({ success: true, message: 'Utilisateur supprimé' });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
