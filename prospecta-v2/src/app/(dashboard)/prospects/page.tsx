'use client';
import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Upload, Trash2, ExternalLink, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { fmt, STATUS, scoreColor, calcScore } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Prospect {
  id: string; first_name: string; last_name: string; email: string;
  company?: string; job_title?: string; status: string; score: number;
  country?: string; created_at: string;
}

const EMPTY_FORM = { firstName: '', lastName: '', email: '', phone: '', company: '', jobTitle: '', website: '', linkedinUrl: '', country: '', city: '', industry: '', companySize: '', notes: '' };

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json() as { data: Prospect[]; total: number; totalPages: number };
    setProspects(data.data ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/prospects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) { setError(data.error ?? 'Erreur'); setSaving(false); return; }
    setShowAdd(false); setForm(EMPTY_FORM); load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce prospect ?')) return;
    await fetch(`/api/prospects/${id}`, { method: 'DELETE' });
    load();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const Papa = (await import('papaparse')).default;
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: async (results) => {
        let created = 0, errors = 0;
        for (const row of results.data) {
          const res = await fetch('/api/prospects', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: row.first_name || row.firstname || row.prenom || '',
              lastName: row.last_name || row.lastname || row.nom || '',
              email: row.email || '',
              phone: row.phone || row.telephone || '',
              company: row.company || row.entreprise || '',
              jobTitle: row.job_title || row.title || row.poste || '',
              country: row.country || row.pays || '',
            }),
          });
          if (res.ok) created++; else errors++;
        }
        alert(`Import terminé: ${created} créés, ${errors} erreurs`);
        load();
      },
    });
  };

  const fields = [
    { key: 'firstName', label: 'Prénom *', req: true }, { key: 'lastName', label: 'Nom *', req: true },
    { key: 'email', label: 'Email *', req: true, type: 'email' }, { key: 'phone', label: 'Téléphone' },
    { key: 'company', label: 'Entreprise' }, { key: 'jobTitle', label: 'Poste' },
    { key: 'country', label: 'Pays' }, { key: 'city', label: 'Ville' },
    { key: 'industry', label: 'Secteur' }, { key: 'linkedinUrl', label: 'LinkedIn URL' },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <p className="text-sm text-slate-500 mt-0.5">{fmt.number(total)} prospect(s)</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition">
            <Upload className="w-4 h-4" /> Importer CSV
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-2 w-full text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="Rechercher..." />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none bg-white">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Prospect', 'Entreprise & Poste', 'Statut', 'Score', 'Ajouté le', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3.5"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                ))}</tr>
              )) : prospects.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400">Aucun prospect trouvé</p>
                </td></tr>
              ) : prospects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {p.first_name[0]}{p.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-slate-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-700 font-medium">{p.company ?? '—'}</p>
                    <p className="text-xs text-slate-400">{p.job_title ?? ''}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS[p.status]?.color ?? 'bg-slate-100 text-slate-600')}>
                      {STATUS[p.status]?.label ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs font-bold px-2 py-1 rounded-lg ring-1', scoreColor(p.score))}>{p.score}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">{fmt.date(p.created_at)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Link href={`/prospects/${p.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} / {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition">← Préc.</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition">Suiv. →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 text-lg">Nouveau prospect</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.key} className={f.key === 'linkedinUrl' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                  <input type={('type' in f ? f.type : 'text') as string} required={'req' in f && f.req}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>
              <div className="col-span-2 flex gap-2 mt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                  {saving ? 'Création...' : 'Créer le prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
