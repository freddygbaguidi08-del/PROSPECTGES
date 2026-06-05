'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Globe, Linkedin, MapPin, Building2, Edit2, Check, X } from 'lucide-react';
import { fmt, STATUS, DEAL_STAGES, scoreColor, cn } from '@/lib/utils';

interface ProspectDetail {
  id: string; first_name: string; last_name: string; email: string; phone?: string;
  company?: string; job_title?: string; website?: string; linkedin_url?: string;
  country?: string; city?: string; industry?: string; status: string; score: number;
  notes?: string; created_at: string;
  deals: Array<{ id: string; title: string; value: string; stage: string }>;
  emails: Array<{ id: string; subject: string; status: string; open_count: number; sent_at: string }>;
}

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [editStatus, setEditStatus] = useState(false);

  useEffect(() => {
    fetch(`/api/prospects/${id}`).then(r => r.json()).then(d => {
      setProspect((d as { data: ProspectDetail }).data);
      setNotes((d as { data: ProspectDetail }).data?.notes ?? '');
      setLoading(false);
    });
  }, [id]);

  const saveNotes = async () => {
    await fetch(`/api/prospects/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prospect, firstName: prospect?.first_name, lastName: prospect?.last_name, notes }),
    });
    setEditNotes(false);
    setProspect(p => p ? { ...p, notes } : p);
  };

  const saveStatus = async (status: string) => {
    await fetch(`/api/prospects/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prospect, firstName: prospect?.first_name, lastName: prospect?.last_name, status }),
    });
    setProspect(p => p ? { ...p, status } : p);
    setEditStatus(false);
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />)}</div>;
  if (!prospect) return <div className="text-center py-20 text-slate-400">Prospect introuvable</div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <button onClick={() => router.push('/prospects')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition text-sm">
        <ArrowLeft className="w-4 h-4" /> Retour aux prospects
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {prospect.first_name[0]}{prospect.last_name[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-900">{prospect.first_name} {prospect.last_name}</h1>
                <p className="text-slate-500">{prospect.job_title ?? '—'}{prospect.company ? ` · ${prospect.company}` : ''}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {editStatus ? (
                    <div className="flex gap-1">
                      {Object.entries(STATUS).map(([k, v]) => (
                        <button key={k} onClick={() => saveStatus(k)} className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', v.color)}>{v.label}</button>
                      ))}
                    </div>
                  ) : (
                    <button onClick={() => setEditStatus(true)} className={cn('text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80', STATUS[prospect.status]?.color)}>
                      {STATUS[prospect.status]?.label ?? prospect.status}
                    </button>
                  )}
                  <span className={cn('text-xs font-bold px-2 py-1 rounded-lg ring-1', scoreColor(prospect.score))}>Score: {prospect.score}/100</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { icon: Mail, label: 'Email', value: prospect.email, href: `mailto:${prospect.email}` },
                { icon: Phone, label: 'Téléphone', value: prospect.phone },
                { icon: Globe, label: 'Site web', value: prospect.website, href: prospect.website },
                { icon: Linkedin, label: 'LinkedIn', value: prospect.linkedin_url ? 'Voir profil' : undefined, href: prospect.linkedin_url },
                { icon: Building2, label: 'Entreprise', value: prospect.company },
                { icon: MapPin, label: 'Localisation', value: [prospect.city, prospect.country].filter(Boolean).join(', ') || undefined },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="flex items-start gap-2">
                  <item.icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{item.value}</a>
                    ) : (
                      <p className="text-sm text-slate-700 truncate">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Notes</h3>
              {editNotes ? (
                <div className="flex gap-1">
                  <button onClick={saveNotes} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditNotes(false)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => setEditNotes(true)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
              )}
            </div>
            {editNotes ? (
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
            ) : (
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{prospect.notes || <span className="text-slate-400 italic">Aucune note — cliquez sur ✏️ pour ajouter</span>}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Deals */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Deals ({prospect.deals?.length ?? 0})</h3>
            {prospect.deals?.length === 0 ? (
              <p className="text-xs text-slate-400">Aucun deal</p>
            ) : (
              <div className="space-y-2">
                {prospect.deals?.map(deal => (
                  <div key={deal.id} className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-800">{deal.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">{DEAL_STAGES.find(s => s.key === deal.stage)?.label ?? deal.stage}</span>
                      <span className="text-sm font-bold text-slate-900">{fmt.currency(parseFloat(deal.value || '0'))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emails */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Emails ({prospect.emails?.length ?? 0})</h3>
            {prospect.emails?.length === 0 ? (
              <p className="text-xs text-slate-400">Aucun email envoyé</p>
            ) : (
              <div className="space-y-2">
                {prospect.emails?.slice(0, 5).map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-700 truncate">{log.subject}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-400">{log.sent_at ? fmt.date(log.sent_at) : '—'}</span>
                      {log.open_count > 0 && <span className="text-xs text-emerald-600 font-medium">{log.open_count} vue(s)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500">
            <p>Ajouté le {fmt.date(prospect.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
