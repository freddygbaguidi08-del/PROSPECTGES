import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { comparePassword, signToken, getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };

    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user) return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });

    const valid = await comparePassword(password, user.password as string);
    if (!valid) return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });

    const token = await signToken({ userId: user.id as string, email: user.email as string, name: user.name as string, orgName: user.org_name as string });

    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, orgName: user.org_name } });
    res.cookies.set('prospecta_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('prospecta_token');
  return res;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  return NextResponse.json({ user: session });
}
