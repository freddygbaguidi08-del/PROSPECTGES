// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, orgName } = body;

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 caractères min)' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL manquante — configurez Supabase sur Vercel' }, { status: 500 });
    }

    const sql = (await import('@/lib/db')).default;
    const { initDB } = await import('@/lib/db');
    await initDB();

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });

    const hashed = await hashPassword(password);

    const [user] = await sql`
      INSERT INTO users (name, email, password, role, org_name, must_change_password)
      VALUES (${name}, ${email}, ${hashed}, 'ADMIN', ${orgName}, false)
      RETURNING id, name, email, org_name
    `;

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgName: user.org_name,
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, orgName: user.org_name },
    });

    res.cookies.set('nof_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
