import { getSession } from '@/lib/auth';
import { fmt, STATUS, scoreColor } from '@/lib/utils';
import { Users, Mail, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';

async function getDashboardData(userId: string) {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  try {
    // Direct DB call to avoid fetch auth issues in server component
    const sql = (await import('@/lib/db')).default;
    const { initDB } = await import('@/lib/db');
    await initDB();

    const [prospects, campaigns, deals, byStatus, recent] = await Promise.all([
      sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as this_month, ROUND(AVG(score)) as avg_score FROM prospects WHERE user_id = ${userId}`,
      sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'RUNNING') as running FROM campaigns WHERE user_id = ${userId}`,
      sql`SELECT COUNT(*) as total, COALESCE(SUM(value) FILTER (WHERE stage = 'CLOSED_WON'), 0) as won_value, COALESCE(SUM(value) FILTER (WHERE stage NOT IN ('CLOSED_WON','CLOSED_LOST')), 0) as pipeline FROM deals WHERE user_id = ${userId}`,
      sql`SELECT status, COUNT(*) as count FROM prospects WHERE user_id = ${userId} GROUP BY status`,
      sql`SELECT first_name, last_name, company, score, status, created_at FROM prospects WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 5`,
    ]);

    return { prospects: prospects[0], campaigns: campaigns[0], deals: deals[0], byStatus, recent };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getSession();
  const data = session ? await getDashboardData(session.userId) : null;

  const kpis = [
    { label: 'Total prospects', value: fmt.number(Number(data?.prospects?.total ?? 0)), sub: `+${data?.prospects?.this_month ?? 0} ce mois`, icon: Users, color: 'blue' },
    { label: 'Campagnes actives', value: String(data?.campaigns?.running ?? 0), sub: `${data?.campaigns?.total ?? 0} au total`, icon: Mail, color: 'green' },
    { label: 'Score moyen', value: `${data?.prospects?.avg_score ?? 0}/100`, sub: 'Qualité des prospects', icon: TrendingUp, color: 'amber' },
    { label: 'Pipeline', value: fmt.currency(Number(data?.deals?.pipeline ?? 0)), sub: `${fmt.currency(Number(data?.deals?.won_value ?? 0))} gagnés`, icon: DollarSign, color: 'purple' },
  ];

  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{getHour()}, {session?.name.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Voici un aperçu de votre activité commerciale</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md hover:shadow-slate-200/50 transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${colors[k.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{k.label}</p>
              <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Prospects by status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Prospects par statut</h3>
          <div className="space-y-2.5">
            {(data?.byStatus ?? [] as Array<{ status: string; count: string }>).map((s) => {
              const total = Number(data?.prospects?.total ?? 1);
              const pct = Math.round((Number(s.count) / total) * 100);
              const cfg = STATUS[s.status] ?? { label: s.status, color: 'bg-slate-100 text-slate-600' };
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-sm font-semibold text-slate-700">{s.count} <span className="text-slate-400 font-normal text-xs">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(data?.byStatus ?? []).length === 0 && (
              <p className="text-slate-400 text-sm text-center py-6">Aucun prospect encore</p>
            )}
          </div>
        </div>

        {/* Recent prospects */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Derniers prospects</h3>
            <a href="/prospects" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Voir tous <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {(data?.recent ?? []).map((p: { first_name: string; last_name: string; company: string; score: number; status: string; created_at: string }, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.first_name} {p.last_name}</p>
                  <p className="text-xs text-slate-400 truncate">{p.company ?? '—'}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ring-1 ${scoreColor(p.score)}`}>{p.score}</span>
              </div>
            ))}
            {(data?.recent ?? []).length === 0 && (
              <p className="text-slate-400 text-sm text-center py-6">Aucun prospect encore</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Ajouter un prospect', href: '/prospects', emoji: '👤' },
            { label: 'Nouvelle campagne', href: '/campaigns', emoji: '📧' },
            { label: 'Créer un deal', href: '/pipeline', emoji: '💼' },
            { label: 'Voir analytics', href: '/analytics', emoji: '📊' },
          ].map(a => (
            <a key={a.label} href={a.href}
              className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition text-center">
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-xs font-medium text-slate-600">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
