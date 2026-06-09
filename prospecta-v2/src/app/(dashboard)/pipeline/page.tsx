// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { Plus, X, DollarSign, TrendingUp, Target } from 'lucide-react';
import { fmt, DEAL_STAGES, cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

export default function PipelinePage() {
  const [kanban, setKanban] = useState({});
  const [total, setTotal] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [form, setForm] = useState({ title: '', value: '', notes: '', stage: 'LEAD' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/pipeline');
    const data = await res.json();
    setKanban(data.data?.kanban ?? {});
    setTotalValue(data.data?.totalValue ?? 0);
    setTotal(data.data?.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const moveStage = async (dealId, newStage) => {
    const res = await fetch(`/api/pipeline/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    if (res.ok) { load(); toast.success('Deal déplacé'); }
    else toast.error('Erreur lors du déplacement');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.warning('Le titre est requis'); return; }
    setSaving(true);
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, value: parseFloat(form.value) || 0, stage: form.stage, notes: form.notes }),
    });
    if (res.ok) {
      setShowNew(false);
      setForm({ title: '', value: '', notes: '', stage: 'LEAD' });
      load();
      toast.success('Deal créé avec succès');
    } else {
      toast.error('Erreur lors de la création');
    }
    setSaving(false);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return;
    const res = await fetch(`/api/pipeline/deals/${id}`, { method: 'DELETE' });
    if (res.ok) { load(); toast.success('Deal supprimé'); }
    else toast.error('Erreur lors de la suppression');
  };

  const stageHeaderColors = {
    LEAD: 'from-slate-400 to-slate-500',
    QUALIFIED: 'from-blue-400 to-blue-600',
    PROPOSAL: 'from-amber-400 to-amber-500',
    NEGOTIATION: 'from-orange-400 to-orange-500',
    CLOSED_WON: 'from-emerald-400 to-emerald-600',
    CLOSED_LOST: 'from-red-400 to-red-500',
  };

  const stageBg = {
    LEAD: 'bg-slate-50',
    QUALIFIED: 'bg-blue-50/50',
    PROPOSAL: 'bg-amber-50/50',
    NEGOTIATION: 'bg-orange-50/50',
    CLOSED_WON: 'bg-emerald-50/50',
    CLOSED_LOST: 'bg-red-50/30',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline CRM</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} deal(s) · Pipeline: {fmt.currency(totalValue)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="font-semibold">{total} deals</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold">{fmt.currency(totalValue)}</span>
            </div>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouveau deal
          </button>
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DEAL_STAGES.map(s => (
            <div key={s.key} className="min-w-[220px] w-[220px] shrink-0 h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {DEAL_STAGES.map(stage => {
            const deals = kanban[stage.key] ?? [];
            const stageValue = deals.reduce((s, d) => s + parseFloat(d.value || '0'), 0);
            const isOver = dragOver === stage.key;

            return (
              <div key={stage.key}
                className={cn('min-w-[220px] w-[220px] shrink-0 rounded-2xl flex flex-col border transition-all duration-200', stageBg[stage.key], isOver ? 'border-blue-400 shadow-lg shadow-blue-100' : 'border-slate-200/80')}
                onDragOver={e => { e.preventDefault(); setDragOver(stage.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => { if (dragging) { moveStage(dragging, stage.key); setDragging(null); setDragOver(null); } }}
              >
                {/* Column header */}
                <div className={cn('p-3 rounded-t-2xl bg-gradient-to-r text-white', stageHeaderColors[stage.key])}>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-90">{stage.label}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-80">{deals.length} deal(s)</span>
                    <span className="text-xs font-bold">{fmt.currency(stageValue)}</span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                  {deals.map(deal => (
                    <div key={deal.id}
                      draggable
                      onDragStart={() => setDragging(deal.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      className={cn(
                        'bg-white rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-all group',
                        dragging === deal.id ? 'opacity-50 scale-95' : 'hover:shadow-md hover:shadow-slate-200/60 hover:-translate-y-0.5 border-slate-200'
                      )}>
                      <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug mb-2">{deal.title}</p>
                      {(deal.first_name || deal.company) && (
                        <p className="text-xs text-slate-400 mb-2 truncate">
                          {deal.first_name ? `${deal.first_name} ${deal.last_name}` : deal.company}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{fmt.currency(parseFloat(deal.value || '0'))}</span>
                        <button onClick={() => handleDelete(deal.id, deal.title)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Probability bar */}
                      <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', stage.key === 'CLOSED_WON' ? 'bg-emerald-500' : stage.key === 'CLOSED_LOST' ? 'bg-red-400' : 'bg-blue-500')}
                          style={{ width: `${deal.probability}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{deal.probability}%</p>
                    </div>
                  ))}

                  {deals.length === 0 && (
                    <div className={cn('h-20 flex items-center justify-center text-xs text-slate-300 border-2 border-dashed rounded-xl transition-all', isOver ? 'border-blue-400 bg-blue-50/50 text-blue-400' : 'border-slate-200')}>
                      {isOver ? 'Déposer ici' : 'Vide'}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Nouveau deal</h3>
                <p className="text-sm text-slate-500 mt-0.5">Ajoutez une opportunité commerciale</p>
              </div>
              <button onClick={() => setShowNew(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Titre du deal *</label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="input" placeholder="Ex: Abonnement annuel Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Valeur (€)</label>
                  <input type="number" min="0" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    className="input" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Étape</label>
                  <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} className="input">
                    {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3} className="input resize-none" placeholder="Informations supplémentaires..." />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
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
