// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, signToken, getSessionFromRequest } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });

    const sql = (await import('@/lib/db')).default;
    const { initDB } = await import('@/lib/db');
    await initDB();

    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user) return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });

    const valid = await comparePassword(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgName: user.org_name,
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, orgName: user.org_name },
      mustChangePassword: user.must_change_password === true,
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

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('nof_token');
  return res;
}

export async function GET(req) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  return NextResponse.json({ user: session });
}
