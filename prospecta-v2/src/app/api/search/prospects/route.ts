// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

// Search prospects from free sources
async function searchFromWeb(query: string, sector: string, country: string): Promise<any[]> {
  const results: any[] = [];

  // Use Hunter.io free API (25 searches/month free)
  if (process.env.HUNTER_API_KEY) {
    try {
      const domain = query.replace(/https?:\/\//g, '').replace(/www\./g, '').split('/')[0];
      if (domain.includes('.')) {
        const res = await fetch(
          `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.data?.emails) {
            for (const email of data.data.emails) {
              results.push({
                firstName: email.first_name || '',
                lastName: email.last_name || '',
                email: email.value,
                company: data.data.organization || domain,
                jobTitle: email.position || '',
                website: `https://${domain}`,
                source: 'Hunter.io',
                confidence: email.confidence,
              });
            }
          }
        }
      }
    } catch (e) { /* ignore */ }
  }

  return results;
}

// Search companies from Google Maps (free)
async function searchCompanies(sector: string, city: string): Promise<any[]> {
  if (!process.env.GOOGLE_MAPS_API_KEY) return [];

  try {
    const query = encodeURIComponent(`${sector} ${city}`);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || []).slice(0, 20).map((place: any) => ({
      company: place.name,
      address: place.formatted_address,
      website: place.website || '',
      phone: place.formatted_phone_number || '',
      sector,
      source: 'Google Maps',
      placeId: place.place_id,
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
  const type = searchParams.get('type') || 'prospects'; // 'prospects' or 'companies'

  try {
    if (type === 'companies' && (sector || city)) {
      const companies = await searchCompanies(sector || query, city || country);
      return NextResponse.json({ data: companies, type: 'companies', total: companies.length });
    }

    if (query) {
      const prospects = await searchFromWeb(query, sector, country);
      return NextResponse.json({ data: prospects, type: 'prospects', total: prospects.length });
    }

    // Search in own database
    const sql = (await import('@/lib/db')).default;
    const prospects = await sql`
      SELECT * FROM prospects
      WHERE user_id = ${session.userId}
        AND (
          first_name ILIKE ${'%' + query + '%'} OR
          last_name ILIKE ${'%' + query + '%'} OR
          email ILIKE ${'%' + query + '%'} OR
          company ILIKE ${'%' + query + '%'} OR
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

  // Import selected prospects from search results
  const { prospects } = await req.json();
  if (!prospects?.length) return NextResponse.json({ error: 'Aucun prospect' }, { status: 400 });

  try {
    const sql = (await import('@/lib/db')).default;
    let imported = 0;
    let duplicates = 0;

    for (const p of prospects) {
      if (!p.email || !p.firstName) continue;
      try {
        await sql`
          INSERT INTO prospects (user_id, first_name, last_name, email, company, job_title, website, country, industry, score)
          VALUES (${session.userId}, ${p.firstName}, ${p.lastName || ''}, ${p.email},
            ${p.company || null}, ${p.jobTitle || null}, ${p.website || null},
            ${p.country || null}, ${p.sector || null}, 30)
        `;
        imported++;
      } catch {
        duplicates++;
      }
    }

    return NextResponse.json({ success: true, imported, duplicates });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
