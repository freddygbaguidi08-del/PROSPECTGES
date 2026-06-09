// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const { name, email, password, orgName } = await req.json() as {
      name: string; email: string; password: string; orgName: string;
    };

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 caractères min)' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const [user] = await sql`
      INSERT INTO users (name, email, password, org_name)
      VALUES (${name}, ${email}, ${hashed}, ${orgName})
      RETURNING id, name, email, org_name
    `;

    const token = await signToken({ userId: user.id, email: user.email, name: user.name, orgName: user.org_name });

    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, orgName: user.org_name } });
    res.cookies.set('prospecta_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
