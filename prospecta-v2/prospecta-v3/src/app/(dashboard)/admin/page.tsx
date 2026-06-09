'use client';
import { useState, useEffect } from 'react';
import { Users, Mail, BarChart3, Shield, Trash2, ChevronDown, Globe, TrendingUp } from 'lucide-react';
import { fmt, cn } from '@/lib/utils';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  org_name: string;
  created_at: string;
  prospects_count: string;
  campaigns_count: string;
  deals_count: string;
  emails_count: string;
}

interface GlobalStats {
  total_users: string;
  total_prospects: string;
  total_campaigns: string;
  total_emails: string;
  total_deals_won: string;
}

const ROLES = ['ADMIN', 'USER', 'VIEWER'];
const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  USER: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-slate-100 text-slate-600',
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json() as { data?: { users: UserData[]; globalStats: GlobalStats }; error?: string };
    if (data.error) { setError(data.error); setLoading(false); return; }
    setUsers(data.data?.users ?? []);
    setStats(data.data?.globalStats ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (userId: string, action: string, role?: string) => {
    if (action === 'delete' && !confirm('Supprimer cet utilisateur et toutes ses données ?')) return;

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, role }),
    });
    const data = await res.json() as { message?: string; error?: string };
    if (data.message) {
      setActionMsg('✅ ' + data.message);
      load();
    } else {
      setActionMsg('❌ ' + data.error);
    }
    setTimeout(() => setActionMsg(''), 4000);
  };

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Shield className="w-12 h-12 text-red-300 mx-auto mb-3" />
        <h2 className="font-bold text-slate-900 text-lg">Accès refusé</h2>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Espace Admin</h1>
          <p className="text-sm text-slate-500">Gestion des utilisateurs et supervision globale</p>
        </div>
      </div>

      {actionMsg && (
        <div className={cn('p-3 rounded-xl text-sm', actionMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
          {actionMsg}
        </div>
      )}

      {/* Global stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Utilisateurs', value: stats.total_users, icon: Users, color: 'blue' },
            { label: 'Prospects', value: stats.total_prospects, icon: Users, color: 'green' },
            { label: 'Campagnes', value: stats.total_campaigns, icon: Mail, color: 'amber' },
            { label: 'Emails envoyés', value: stats.total_emails, icon: Mail, color: 'purple' },
            { label: 'Deals gagnés', value: stats.total_deals_won, icon: TrendingUp, color: 'emerald' },
          ].map(s => {
            const Icon = s.icon;
            const colorMap: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600', emerald: 'bg-emerald-50 text-emerald-600' };
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', colorMap[s.color])}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{fmt.number(Number(s.value))}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Tous les utilisateurs ({users.length})</h2>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Utilisateur', 'Organisation', 'Rôle', 'Prospects', 'Campagnes', 'Emails', 'Inscrit le', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm">{u.org_name}</td>
                    <td className="px-4 py-3.5">
                      <div className="relative group">
                        <button className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium', roleColors[u.role] ?? 'bg-slate-100 text-slate-600')}>
                          {u.role}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute left-0 top-8 bg-white rounded-xl shadow-xl border border-slate-200 z-10 py-1 w-28 hidden group-hover:block">
                          {ROLES.map(r => (
                            <button key={r} onClick={() => handleAction(u.id, 'change_role', r)}
                              className={cn('w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition', u.role === r ? 'font-bold text-blue-600' : 'text-slate-700')}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm text-center">{u.prospects_count}</td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm text-center">{u.campaigns_count}</td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm text-center">{u.emails_count}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{fmt.date(u.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => handleAction(u.id, 'delete')}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
        <h3 className="font-semibold text-amber-900 mb-2">Rôles disponibles</h3>
        <div className="space-y-1.5 text-sm text-amber-800">
          <p><span className="font-bold">ADMIN</span> — Accès complet + espace admin + gestion des utilisateurs</p>
          <p><span className="font-bold">USER</span> — Accès à toutes les fonctionnalités (prospects, campagnes, pipeline)</p>
          <p><span className="font-bold">VIEWER</span> — Lecture seule, ne peut pas modifier ni créer</p>
        </div>
      </div>
    </div>
  );
}
