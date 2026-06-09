// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, signToken, getSessionFromRequest } from '@/lib/auth';

export async function POST(req) {
  try {
    const { userId, newPassword, currentPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 min)' }, { status: 400 });
    }

    const sql = (await import('@/lib/db')).default;

    // If userId provided (force change from login) — no auth needed
    if (userId) {
      const [user] = await sql`SELECT id, name, email, org_name FROM users WHERE id = ${userId}`;
      if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

      const hashed = await hashPassword(newPassword);
      await sql`UPDATE users SET password = ${hashed}, must_change_password = false WHERE id = ${userId}`;

      const token = await signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        orgName: user.org_name,
      });

      const res = NextResponse.json({ success: true });
      res.cookies.set('nof_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

    // Authenticated change password
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

    if (currentPassword) {
      const bcrypt = await import('bcryptjs');
      const [user] = await sql`SELECT password FROM users WHERE id = ${session.userId}`;
      const valid = await bcrypt.default.compare(currentPassword, user.password);
      if (!valid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await sql`UPDATE users SET password = ${hashed}, must_change_password = false WHERE id = ${session.userId}`;
    return NextResponse.json({ success: true, message: 'Mot de passe modifié' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
