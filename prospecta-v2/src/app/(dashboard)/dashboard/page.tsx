// @ts-nocheck
import { getSession } from '@/lib/auth';
import { fmt, STATUS, scoreColor } from '@/lib/utils';

async function getData(userId) {
  try {
    const sql = (await import('@/lib/db')).default;
    const { initDB } = await import('@/lib/db');
    await initDB();
    const [prospects, campaigns, deals, byStatus, recent] = await Promise.all([
      sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as this_month, ROUND(AVG(score)) as avg_score FROM prospects WHERE user_id = ${userId}`,
      sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'RUNNING') as running FROM campaigns WHERE user_id = ${userId}`,
      sql`SELECT COUNT(*) as total, COALESCE(SUM(value) FILTER (WHERE stage = 'CLOSED_WON'), 0) as won_value, COALESCE(SUM(value) FILTER (WHERE stage NOT IN ('CLOSED_WON','CLOSED_LOST')), 0) as pipeline FROM deals WHERE user_id = ${userId}`,
      sql`SELECT status, COUNT(*) as count FROM prospects WHERE user_id = ${userId} GROUP BY status`,
      sql`SELECT first_name, last_name, company, score, status, created_at FROM prospects WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 6`,
    ]);
    return { p: prospects[0], c: campaigns[0], d: deals[0], byStatus, recent };
  } catch { return null; }
}

const S = {
  card: { background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '0.5px solid rgba(255,255,255,.10)', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.4), 0 1px 0 rgba(255,255,255,.08) inset' },
  h1: { fontSize: 20, fontWeight: 700, color: '#f0f9ff', letterSpacing: '-.2px' },
  h3: { fontSize: 13, fontWeight: 600, color: '#f0f9ff', letterSpacing: '-.2px', marginBottom: 16 },
  txt2: { color: 'rgba(255,255,255,.55)' },
  label: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.5px' },
};

export default async function DashboardPage() {
  const session = await getSession();
  const data = session ? await getData(session.userId) : null;

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';

  const kpis = [
    { label: 'Prospects', value: fmt.number(Number(data?.p?.total ?? 0)), sub: `+${data?.p?.this_month ?? 0} ce mois`, color: '#3b82f6', bg: 'rgba(59,130,246,.12)', border: 'rgba(59,130,246,.25)', emoji: '👥' },
    { label: 'Campagnes actives', value: String(data?.c?.running ?? 0), sub: `${data?.c?.total ?? 0} au total`, color: '#4ade80', bg: 'rgba(74,222,128,.10)', border: 'rgba(74,222,128,.2)', emoji: '📧' },
    { label: 'Score moyen', value: `${data?.p?.avg_score ?? 0}`, sub: 'sur 100 pts', color: '#60a5fa', bg: 'rgba(96,165,250,.1)', border: 'rgba(96,165,250,.2)', emoji: '⭐' },
    { label: 'Pipeline', value: fmt.currency(Number(data?.d?.pipeline ?? 0)), sub: `${fmt.currency(Number(data?.d?.won_value ?? 0))} gagnés`, color: '#fbbf24', bg: 'rgba(251,191,36,.1)', border: 'rgba(251,191,36,.2)', emoji: '💰' },
  ];

  const byStatusList = Array.isArray(data?.byStatus) ? data.byStatus : [];
  const recentList = Array.isArray(data?.recent) ? data.recent : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={S.h1}>{greeting}, {session?.name?.split(' ')[0]} 👋</h1>
        <p style={{ ...S.txt2, fontSize: 12, marginTop: 4 }}>Vue d&apos;ensemble de votre activité · NOF PROSPECT PROD</p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...S.card, padding: 20, transition: 'transform 200ms ease', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={S.label}>{k.label}</span>
              <div style={{ width: 32, height: 32, background: k.bg, border: `1px solid ${k.border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{k.emoji}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: '-.5px' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Status breakdown */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.h3}>Prospects par statut</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byStatusList.length === 0 ? (
              <p style={{ ...S.txt2, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Aucun prospect encore</p>
            ) : byStatusList.map((s, i) => {
              const total = Number(data?.p?.total ?? 1);
              const pct = Math.round((Number(s.count) / total) * 100);
              const cfg = STATUS[s.status] ?? { label: s.status };
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className={`badge ${cfg.cls}`} style={{ fontSize: 11 }}>{cfg.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#f0f9ff' }}>{s.count} <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', borderRadius: 4, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent prospects */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={S.h3}>Derniers prospects</div>
            <a href="/prospects" style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Voir tous →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentList.length === 0 ? (
              <p style={{ ...S.txt2, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Aucun prospect encore</p>
            ) : recentList.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 9, transition: 'background 150ms' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f9ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.company || '—'}</div>
                </div>
                <span className={`badge ${scoreColor(p.score)}`} style={{ fontSize: 11, flexShrink: 0 }}>{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ ...S.card, padding: 20 }}>
        <div style={S.h3}>Actions rapides</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Ajouter un prospect', href: '/prospects', emoji: '👤', desc: 'Créer manuellement' },
            { label: 'Nouvelle campagne', href: '/campaigns', emoji: '📧', desc: 'Avec génération IA' },
            { label: 'Créer un deal', href: '/pipeline', emoji: '💼', desc: 'Pipeline CRM' },
            { label: 'Rechercher', href: '/search', emoji: '🔍', desc: 'Trouver des prospects' },
          ].map(a => (
            <a key={a.label} href={a.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '16px 12px',
              background: 'rgba(255,255,255,.04)',
              border: '0.5px solid rgba(255,255,255,.08)',
              borderRadius: 12, textDecoration: 'none',
              transition: 'all 150ms ease',
              textAlign: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,.12)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.transform = 'none'; }}
            >
              <span style={{ fontSize: 28 }}>{a.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f9ff' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{a.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
