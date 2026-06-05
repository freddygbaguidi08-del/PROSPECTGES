'use client';
import { useState, useEffect } from 'react';
import { Plus, X, DollarSign } from 'lucide-react';
import { fmt, DEAL_STAGES, cn } from '@/lib/utils';

interface Deal {
  id: string; title: string; value: string; currency: string; stage: string;
  probability: number; notes?: string; first_name?: string; last_name?: string; company?: string;
}

export default function PipelinePage() {
  const [kanban, setKanban] = useState<Record<string, Deal[]>>({});
  const [total, setTotal] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', value: '', notes: '', stage: 'LEAD' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/pipeline');
    const data = await res.json() as { data: { kanban: Record<string, Deal[]>; totalValue: number; total: number } };
    setKanban(data.data?.kanban ?? {});
    setTotalValue(data.data?.totalValue ?? 0);
    setTotal(data.data?.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const moveStage = async (dealId: string, newStage: string) => {
    await fetch(`/api/pipeline/deals/${dealId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    load();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/pipeline', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, value: parseFloat(form.value) || 0, stage: form.stage, notes: form.notes }),
    });
    setShowNew(false); setForm({ title: '', value: '', notes: '', stage: 'LEAD' });
    load(); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce deal ?')) return;
    await fetch(`/api/pipeline/deals/${id}`, { method: 'DELETE' });
    load();
  };

  const onDragStart = (dealId: string) => setDragging(dealId);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (stage: string) => {
    if (dragging) { moveStage(dragging, stage); setDragging(null); }
  };

  const stageColors: Record<string, string> = {
    LEAD: 'border-t-slate-400', QUALIFIED: 'border-t-blue-500', PROPOSAL: 'border-t-amber-500',
    NEGOTIATION: 'border-t-orange-500', CLOSED_WON: 'border-t-emerald-500', CLOSED_LOST: 'border-t-red-400',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline CRM</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} deal(s) · Pipeline: {fmt.currency(totalValue)}</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouveau deal
        </button>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {DEAL_STAGES.map(s => <div key={s.key} className="min-w-[200px] h-64 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
          {DEAL_STAGES.map(stage => {
            const deals = kanban[stage.key] ?? [];
            const stageValue = deals.reduce((s, d) => s + parseFloat(d.value || '0'), 0);
            return (
              <div key={stage.key} className={cn('min-w-[200px] w-[200px] shrink-0 bg-white rounded-2xl border-t-4 border border-slate-200/80 flex flex-col', stageColors[stage.key])}
                onDragOver={onDragOver} onDrop={() => onDrop(stage.key)}>
                <div className="p-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{stage.label}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{deals.length} deal(s)</span>
                    <span className="text-xs font-semibold text-slate-600">{fmt.currency(stageValue)}</span>
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                  {deals.map(deal => (
                    <div key={deal.id} draggable onDragStart={() => onDragStart(deal.id)}
                      className="bg-white rounded-xl border border-slate-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow group">
                      <p className="text-xs font-semibold text-slate-900 line-clamp-2 mb-1.5">{deal.title}</p>
                      {deal.company && <p className="text-xs text-slate-400 mb-2">{deal.company}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{fmt.currency(parseFloat(deal.value || '0'))}</span>
                        <button onClick={() => handleDelete(deal.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${deal.probability}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{deal.probability}% de probabilité</p>
                    </div>
                  ))}
                  {deals.length === 0 && (
                    <div className="h-16 flex items-center justify-center text-xs text-slate-300 border-2 border-dashed border-slate-100 rounded-xl">
                      Déposer ici
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New deal modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 text-lg">Nouveau deal</h3>
              <button onClick={() => setShowNew(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre du deal *</label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Ex: Abonnement annuel Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valeur (€)</label>
                  <input type="number" min="0" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Étape</label>
                  <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none bg-white">
                    {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                  {saving ? 'Création...' : 'Créer le deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
