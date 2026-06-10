// @ts-nocheck
'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fmt, STATUS, scoreColor } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

const S = {
  card: { background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '0.5px solid rgba(255,255,255,.10)', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.4)' },
  th: { padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.5px', textAlign: 'left', borderBottom: '0.5px solid rgba(255,255,255,.08)', whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', fontSize: 13, color: '#f0f9ff', borderBottom: '0.5px solid rgba(255,255,255,.04)', verticalAlign: 'middle' },
};

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', company: '', jobTitle: '', website: '', linkedinUrl: '', country: '', city: '', industry: '', notes: '' };

export default function ProspectsPage() {
  const [prospects, setProspects] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (search) p.set('search', search);
    if (statusFilter) p.set('status', statusFilter);
    const res = await fetch(`/api/prospects?${p}`);
    const data = await res.json();
    setProspects(data.data ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    const res = await fetch('/api/prospects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) { setShowAdd(false); setForm(EMPTY); load(); toast.success('Prospect créé'); }
    else toast.error(data.error || 'Erreur');
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    const res = await fetch(`/api/prospects/${id}`, { method: 'DELETE' });
    if (res.ok) { load(); toast.success('Supprimé'); }
    else toast.error('Erreur');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    toast.info('Import en cours...');
    const Papa = (await import('papaparse')).default;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: async (results) => {
        let ok = 0, fail = 0;
        for (const row of results.data) {
          const res = await fetch('/api/prospects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: row.first_name || row.prenom || '', lastName: row.last_name || row.nom || '', email: row.email || '', company: row.company || row.entreprise || '', jobTitle: row.job_title || row.poste || '', country: row.country || row.pays || '' }) });
          if (res.ok) ok++; else fail++;
        }
        toast.success(`${ok} importés · ${fail} erreurs`); load();
      },
    });
    e.target.value = '';
  };

  const label = { display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 5, letterSpacing: '.5px', textTransform: 'uppercase' };
  const fields = [
    { k: 'firstName', l: 'Prénom *', req: true }, { k: 'lastName', l: 'Nom *', req: true },
    { k: 'email', l: 'Email *', req: true, t: 'email' }, { k: 'phone', l: 'Téléphone' },
    { k: 'company', l: 'Entreprise' }, { k: 'jobTitle', l: 'Poste' },
    { k: 'country', l: 'Pays' }, { k: 'city', l: 'Ville' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f0f9ff', letterSpacing: '-.2px' }}>Prospects</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>{fmt.number(total)} prospect(s)</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            📤 Importer CSV
            <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setShowAdd(true)} className="btn-primary">+ Nouveau prospect</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...S.card, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input"
          placeholder="🔍  Rechercher..." style={{ flex: 1, minWidth: 200 }} />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input" style={{ width: 'auto', minWidth: 160 }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => load()} className="btn-secondary" style={{ padding: '9px 12px' }}>↻</button>
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.03)' }}>
                {['Prospect', 'Entreprise', 'Statut', 'Score', 'Ajouté', ''].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 7 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={S.td}>
                      <div style={{ height: 12, background: 'rgba(255,255,255,.06)', borderRadius: 6, width: `${50 + Math.random() * 40}%`, animation: 'pulse 1.5s infinite' }} />
                    </td>
                  ))}
                </tr>
              )) : prospects.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
                  <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Aucun prospect · Ajoutez ou importez</p>
                </td></tr>
              ) : prospects.map(p => (
                <tr key={p.id} className="tbl-row" style={{ cursor: 'default' }}>
                  <td style={S.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {p.first_name[0]}{p.last_name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.first_name} {p.last_name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 500 }}>{p.company || '—'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{p.job_title || ''}</div>
                  </td>
                  <td style={S.td}><span className={`badge ${STATUS[p.status]?.cls || ''}`}>{STATUS[p.status]?.label || p.status}</span></td>
                  <td style={S.td}><span className={`badge ${scoreColor(p.score)}`}>{p.score}</span></td>
                  <td style={{ ...S.td, fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{fmt.date(p.created_at)}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 150ms' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    >
                      <Link href={`/prospects/${p.id}`} style={{ padding: '4px 8px', borderRadius: 7, background: 'rgba(59,130,246,.15)', color: '#60a5fa', fontSize: 12, textDecoration: 'none' }}>↗</Link>
                      <button onClick={() => handleDelete(p.id, `${p.first_name} ${p.last_name}`)} style={{ padding: '4px 8px', borderRadius: 7, background: 'rgba(248,113,113,.12)', color: '#f87171', border: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>Page {page} / {totalPages} · {fmt.number(total)} total</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>← Préc.</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Suiv. →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ ...S.card, width: '100%', maxWidth: 500, padding: 28, maxHeight: '90vh', overflowY: 'auto' }} className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f9ff' }}>Nouveau prospect</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Remplissez les informations</div>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {fields.map(f => (
                <div key={f.k}>
                  <label style={label}>{f.l}</label>
                  <input type={f.t || 'text'} required={!!f.req} value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} className="input" />
                </div>
              ))}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={label}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input" rows={3} style={{ resize: 'none' }} />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{saving ? 'Création...' : 'Créer le prospect'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
