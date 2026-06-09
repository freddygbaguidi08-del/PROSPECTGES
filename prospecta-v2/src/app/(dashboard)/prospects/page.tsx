// @ts-nocheck
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Upload, Trash2, ExternalLink, RefreshCw, X, Filter } from 'lucide-react';
import Link from 'next/link';
import { fmt, STATUS, scoreColor, cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', company: '',
  jobTitle: '', website: '', linkedinUrl: '', country: '', city: '',
  industry: '', companySize: '', notes: ''
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json();
    setProspects(data.data ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setShowAdd(false);
      setForm(EMPTY_FORM);
      load();
      toast.success('Prospect créé avec succès');
    } else {
      toast.error(data.error || 'Erreur lors de la création');
    }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer ${name} ?`)) return;
    const res = await fetch(`/api/prospects/${id}`, { method: 'DELETE' });
    if (res.ok) { load(); toast.success('Prospect supprimé'); }
    else toast.error('Erreur lors de la suppression');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    toast.info('Import en cours...');
    try {
      const Papa = (await import('papaparse')).default;
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: async (results) => {
          let created = 0, errors = 0;
          for (const row of results.data) {
            const res = await fetch('/api/prospects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstName: row.first_name || row.firstname || row.prenom || '',
                lastName: row.last_name || row.lastname || row.nom || '',
                email: row.email || '',
                phone: row.phone || row.telephone || '',
                company: row.company || row.entreprise || '',
                jobTitle: row.job_title || row.title || row.poste || '',
                country: row.country || row.pays || '',
                city: row.city || row.ville || '',
              }),
            });
            if (res.ok) created++; else errors++;
          }
          toast.success(`Import terminé · ${created} créés · ${errors} erreurs`);
          load();
          setImporting(false);
        },
      });
    } catch (e) {
      toast.error('Erreur d\'import: ' + e.message);
      setImporting(false);
    }
    e.target.value = '';
  };

  const fields = [
    { key: 'firstName', label: 'Prénom *', req: true },
    { key: 'lastName', label: 'Nom *', req: true },
    { key: 'email', label: 'Email *', req: true, type: 'email' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'company', label: 'Entreprise' },
    { key: 'jobTitle', label: 'Poste' },
    { key: 'country', label: 'Pays' },
    { key: 'city', label: 'Ville' },
    { key: 'industry', label: 'Secteur' },
    { key: 'linkedinUrl', label: 'LinkedIn URL' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {fmt.number(total)} prospect(s) au total
          </p>
        </div>
        <div className="flex gap-2">
          <label className={cn('btn-secondary cursor-pointer', importing && 'opacity-50 cursor-not-allowed')}>
            <Upload className="w-4 h-4" />
            {importing ? 'Import...' : 'Importer CSV'}
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouveau prospect
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-10"
            placeholder="Rechercher par nom, email, entreprise..." />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-auto">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={() => load()} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {['Prospect', 'Entreprise & Poste', 'Statut', 'Score', 'Ajouté le', ''].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : prospects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="font-semibold text-slate-600">Aucun prospect trouvé</p>
                    <p className="text-sm text-slate-400 mt-1">Ajoutez votre premier prospect ou importez un CSV</p>
                  </td>
                </tr>
              ) : (
                prospects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-blue-200">
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{p.first_name} {p.last_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{p.company || '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{p.job_title || ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('badge', STATUS[p.status]?.color ?? 'bg-slate-100 text-slate-600')}>
                        {STATUS[p.status]?.label ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('badge ring-1', scoreColor(p.score))}>
                        {p.score}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{fmt.date(p.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/prospects/${p.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => handleDelete(p.id, `${p.first_name} ${p.last_name}`)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">{fmt.number(total)} prospects · Page {page} / {totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Préc.</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Suiv. →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Nouveau prospect</h3>
                <p className="text-sm text-slate-500 mt-0.5">Remplissez les informations du prospect</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.key} className={f.key === 'linkedinUrl' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    required={!!f.req}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="input"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3} className="input resize-none" placeholder="Notes internes..." />
              </div>
              <div className="col-span-2 flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
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
