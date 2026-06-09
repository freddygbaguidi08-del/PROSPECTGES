// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

async function searchFromHunter(domain: string): Promise<any[]> {
  if (!process.env.HUNTER_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}&limit=50`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data?.emails) return [];
    return data.data.emails.map((email: any) => ({
      firstName: email.first_name || '',
      lastName: email.last_name || '',
      email: email.value,
      company: data.data.organization || domain,
      jobTitle: email.position || '',
      website: `https://${domain}`,
      linkedinUrl: email.linkedin || '',
      source: 'Hunter.io',
      confidence: email.confidence,
    }));
  } catch { return []; }
}

async function searchCompanies(sector: string, city: string, country: string): Promise<any[]> {
  if (!process.env.GOOGLE_MAPS_API_KEY) return [];
  try {
    const query = encodeURIComponent(`${sector} ${city} ${country}`.trim());
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=fr&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).slice(0, 50).map((place: any) => ({
      company: place.name,
      address: place.formatted_address,
      website: '',
      phone: place.formatted_phone_number || '',
      sector,
      source: 'Google Maps',
      placeId: place.place_id,
      rating: place.rating,
    }));
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const sector = searchParams.get('sector') || '';
  const country = searchParams.get('country') || '';
  const city = searchParams.get('city') || '';
  const type = searchParams.get('type') || 'companies';

  try {
    if (type === 'companies') {
      const companies = await searchCompanies(sector || query, city, country);
      return NextResponse.json({ data: companies, type: 'companies', total: companies.length });
    }

    if (type === 'prospects' && query) {
      const domain = query.replace(/https?:\/\//g, '').replace(/www\./g, '').split('/')[0];
      if (domain.includes('.')) {
        const prospects = await searchFromHunter(domain);
        return NextResponse.json({ data: prospects, type: 'prospects', total: prospects.length });
      }
    }

    // Search internal DB
    const sql = (await import('@/lib/db')).default;
    const prospects = await sql`
      SELECT * FROM prospects
      WHERE user_id = ${session.userId}
        AND (
          first_name ILIKE ${'%' + query + '%'} OR
          last_name ILIKE ${'%' + query + '%'} OR
          email ILIKE ${'%' + query + '%'} OR
          company ILIKE ${'%' + (sector || query) + '%'} OR
          industry ILIKE ${'%' + (sector || query) + '%'}
        )
      ORDER BY score DESC LIMIT 50
    `;
    return NextResponse.json({ data: prospects, type: 'internal', total: prospects.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json();
  const { prospects } = body;

  if (!prospects?.length) return NextResponse.json({ error: 'Aucun prospect' }, { status: 400 });

  try {
    const sql = (await import('@/lib/db')).default;
    const { initDB } = await import('@/lib/db');
    await initDB();

    let imported = 0;
    let duplicates = 0;
    const errors: string[] = [];

    for (const p of prospects) {
      if (!p.email && !p.company) continue;

      const email = p.email || `contact-${Date.now()}-${Math.random().toString(36).slice(2)}@unknown.com`;
      const firstName = p.firstName || p.company?.split(' ')[0] || 'Contact';
      const lastName = p.lastName || p.company?.split(' ').slice(1).join(' ') || '';

      try {
        // Check duplicate
        const existing = await sql`
          SELECT id FROM prospects WHERE user_id = ${session.userId} AND email = ${email}
        `;
        if (existing.length > 0) { duplicates++; continue; }

        await sql`
          INSERT INTO prospects (
            user_id, first_name, last_name, email, company,
            job_title, website, country, industry, score
          ) VALUES (
            ${session.userId}, ${firstName}, ${lastName}, ${email},
            ${p.company || null}, ${p.jobTitle || null}, ${p.website || null},
            ${p.country || null}, ${p.sector || null}, 30
          )
        `;
        imported++;
      } catch (e: any) {
        errors.push(e.message);
        duplicates++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      errors: errors.slice(0, 3),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
