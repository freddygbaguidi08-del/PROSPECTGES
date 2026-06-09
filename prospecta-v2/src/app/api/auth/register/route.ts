import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, orgName } = body;

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 });
    }

    // Test DB connection
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL manquante' }, { status: 500 });
    }

    let sql;
    try {
      const mod = await import('@/lib/db');
      sql = mod.default;
    } catch (e: any) {
      return NextResponse.json({ error: 'Import DB failed: ' + e.message }, { status: 500 });
    }

    // Init tables
    try {
      const mod = await import('@/lib/db');
      await mod.initDB();
    } catch (e: any) {
      return NextResponse.json({ error: 'InitDB failed: ' + e.message }, { status: 500 });
    }

    // Check existing user
    let existing;
    try {
      existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    } catch (e: any) {
      return NextResponse.json({ error: 'DB query failed: ' + e.message }, { status: 500 });
    }

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    // Hash password
    let hashed;
    try {
      const bcrypt = await import('bcryptjs');
      hashed = await bcrypt.default.hash(password, 12);
    } catch (e: any) {
      return NextResponse.json({ error: 'Bcrypt failed: ' + e.message }, { status: 500 });
    }

    // Create user
    let user;
    try {
      const result = await sql`
        INSERT INTO users (name, email, password, org_name)
        VALUES (${name}, ${email}, ${hashed}, ${orgName})
        RETURNING id, name, email, org_name
      `;
      user = result[0];
    } catch (e: any) {
      return NextResponse.json({ error: 'Insert failed: ' + e.message }, { status: 500 });
    }

    // Sign token
    let token;
    try {
      const { signToken } = await import('@/lib/auth');
      token = await signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        orgName: user.org_name,
      });
    } catch (e: any) {
      return NextResponse.json({ error: 'Token failed: ' + e.message }, { status: 500 });
    }

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, orgName: user.org_name }
    });
    res.cookies.set('prospecta_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });
    return res;

  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected: ' + e.message }, { status: 500 });
  }
}
