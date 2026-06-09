// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fmt, STATUS } from '@/lib/utils';
import { Users, Mail, TrendingUp, DollarSign } from 'lucide-react';

interface DashData {
  prospects: { total: string; this_month: string; avg_score: string };
  campaigns: { total: string; running: string };
  deals: { total: string; won_value: string; pipeline: string };
  prospectsByStatus: Array<{ status: string; count: string }>;
  recentProspects: Array<{ first_name: string; last_name: string; company: string; score: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];

export default function AnalyticsPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => {
      setData((d as { data: DashData }).data);
      setLoading(false);
    });
  }, []);

  const kpis = data ? [
    { label: 'Total prospects', value: fmt.number(Number(data.prospects.total)), sub: `+${data.prospects.this_month} ce mois`, icon: Users, color: 'blue' },
    { label: 'Score moyen', value: `${data.prospects.avg_score ?? 0}/100`, sub: 'Qualité ICP', icon: TrendingUp, color: 'green' },
    { label: 'Campagnes actives', value: String(data.campaigns.running), sub: `${data.campaigns.total} total`, icon: Mail, color: 'amber' },
    { label: 'Pipeline', value: fmt.currency(Number(data.deals.pipeline)), sub: `${fmt.currency(Number(data.deals.won_value))} gagnés`, icon: DollarSign, color: 'purple' },
  ] : [];

  const colors: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600' };

  const pieData = (data?.prospectsByStatus ?? []).map(s => ({
    name: STATUS[s.status]?.label ?? s.status,
    value: Number(s.count),
  }));

  const barData = (data?.prospectsByStatus ?? []).map(s => ({
    status: STATUS[s.status]?.label ?? s.status,
    count: Number(s.count),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vue globale de vos performances</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-white rounded-2xl border border-slate-200/80 p-5">
                  <div className={`inline-flex p-2.5 rounded-xl mb-3 ${colors[k.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{k.value}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{k.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Prospects par statut</h3>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-600">{d.name}</span>
                        <span className="font-semibold text-slate-900 ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-slate-400 text-sm text-center py-10">Aucune donnée</p>}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Distribution par statut</h3>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" name="Prospects" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-sm text-center py-10">Aucune donnée</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
