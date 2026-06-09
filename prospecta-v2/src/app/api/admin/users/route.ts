// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

async function getSQL() {
  const sql = (await import('@/lib/db')).default;
  const { initDB } = await import('@/lib/db');
  await initDB();
  return sql;
}

async function isAdmin(session) {
  const sql = await getSQL();
  const [user] = await sql`SELECT role FROM users WHERE id = ${session.userId}`;
  return user?.role === 'ADMIN';
}

// GET — list all users with stats
export async function GET(req) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  if (!(await isAdmin(session))) return NextResponse.json({ error: 'Accès refusé — Admin uniquement' }, { status: 403 });

  const sql = await getSQL();

  const users = await sql`
    SELECT
      u.id, u.name, u.email, u.role, u.org_name, u.created_at,
      u.must_change_password,
      (SELECT COUNT(*) FROM prospects WHERE user_id = u.id) as prospects_count,
      (SELECT COUNT(*) FROM campaigns WHERE user_id = u.id) as campaigns_count,
      (SELECT COUNT(*) FROM email_logs WHERE user_id = u.id) as emails_count
    FROM users u
    ORDER BY u.created_at DESC
  `;

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

// POST — create user
export async function POST(req) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  if (!(await isAdmin(session))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const sql = await getSQL();
  const { name, email, password, role, orgName, mustChangePassword } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nom, email et mot de passe requis' }, { status: 400 });
  }

  // Check duplicate
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });

  const bcrypt = await import('bcryptjs');
  const hashed = await bcrypt.default.hash(password, 12);

  const [user] = await sql`
    INSERT INTO users (name, email, password, role, org_name, must_change_password)
    VALUES (${name}, ${email}, ${hashed}, ${role || 'USER'}, ${orgName || session.orgName}, ${mustChangePassword !== false})
    RETURNING id, name, email, role, org_name, created_at
  `;

  return NextResponse.json({ success: true, data: user, message: `Utilisateur ${name} créé` });
}

// PATCH — update user or action
export async function PATCH(req) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  if (!(await isAdmin(session))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const sql = await getSQL();
  const body = await req.json();
  const { userId, action, role, name, email } = body;

  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  if (userId === session.userId && action !== 'update') {
    return NextResponse.json({ error: 'Vous ne pouvez pas modifier votre propre compte ici' }, { status: 400 });
  }

  if (action === 'change_role') {
    if (!['ADMIN', 'USER', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }
    await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
    return NextResponse.json({ success: true, message: `Rôle mis à jour: ${role}` });
  }

  if (action === 'update') {
    const updates = {};
    if (name) await sql`UPDATE users SET name = ${name} WHERE id = ${userId}`;
    if (email) {
      const dup = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${userId}`;
      if (dup.length > 0) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 });
      await sql`UPDATE users SET email = ${email} WHERE id = ${userId}`;
    }
    if (role) await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
    return NextResponse.json({ success: true, message: 'Utilisateur mis à jour' });
  }

  if (action === 'force_password_change') {
    await sql`UPDATE users SET must_change_password = true WHERE id = ${userId}`;
    return NextResponse.json({ success: true, message: 'L\'utilisateur devra changer son mot de passe' });
  }

  if (action === 'reset_password') {
    const { newPassword } = body;
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 min)' }, { status: 400 });
    }
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.default.hash(newPassword, 12);
    await sql`UPDATE users SET password = ${hashed}, must_change_password = true WHERE id = ${userId}`;
    return NextResponse.json({ success: true, message: 'Mot de passe réinitialisé' });
  }

  if (action === 'delete') {
    await sql`DELETE FROM users WHERE id = ${userId}`;
    return NextResponse.json({ success: true, message: 'Utilisateur supprimé' });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
