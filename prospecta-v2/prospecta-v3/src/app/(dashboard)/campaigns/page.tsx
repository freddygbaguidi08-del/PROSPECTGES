'use client';
import { useState, useEffect } from 'react';
import { Mail, Plus, Play, Pause, Trash2, Sparkles, X, ChevronRight, Edit2, Check } from 'lucide-react';
import { fmt, CAMPAIGN_STATUS, cn } from '@/lib/utils';

interface Campaign {
  id: string; name: string; description?: string; status: string;
  from_name: string; from_email: string; created_at: string;
  steps_count: string; emails_sent: string;
}

interface Step { order: number; subject: string; body: string; delayDays: number; }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', fromName: '', fromEmail: '', dailyLimit: '50' });
  const [steps, setSteps] = useState<Step[]>([{ order: 1, subject: '', body: '', delayDays: 0 }]);
  const [aiConfig, setAiConfig] = useState({ company: '', jobTitle: 'Directeur', goal: 'Obtenir un RDV de 20 minutes', tone: 'friendly', language: 'fr' });

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/campaigns');
    const data = await res.json() as { data: Campaign[] };
    setCampaigns(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    await fetch('/api/campaigns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, dailyLimit: parseInt(form.dailyLimit), steps }),
    });
    setShowNew(false); setWizardStep(1);
    setForm({ name: '', description: '', fromName: '', fromEmail: '', dailyLimit: '50' });
    setSteps([{ order: 1, subject: '', body: '', delayDays: 0 }]);
    load(); setSaving(false);
  };

  const handleEdit = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}`);
    const data = await res.json() as { data: any };
    setEditData(data.data);
    setEditingId(id);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await fetch(`/api/campaigns/${editingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editData.name,
        description: editData.description,
        fromName: editData.from_name,
        fromEmail: editData.from_email,
        dailyLimit: editData.daily_limit,
        steps: editData.steps?.map((s: any) => ({
          order: s.step_order,
          subject: s.subject,
          body: s.body,
          delayDays: s.delay_days,
        })),
      }),
    });
    setEditingId(null); setEditData(null);
    load(); setSaving(false);
  };

  const handleToggle = async (id: string, status: string) => {
    const next = status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    await fetch(`/api/campaigns/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    load();
  };

  const generateAI = async (isEdit = false, stepIdx = 0) => {
    setAiLoading(true);
    const res = await fetch('/api/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', ...aiConfig }),
    });
    const data = await res.json() as { data?: { subject: string; body: string; provider: string }; error?: string };
    if (data.data) {
      if (isEdit && editData) {
        const newSteps = [...(editData.steps || [])];
        newSteps[stepIdx] = { ...newSteps[stepIdx], subject: data.data.subject, body: data.data.body };
        setEditData({ ...editData, steps: newSteps });
      } else {
        const updated = [...steps];
        updated[stepIdx] = { ...updated[stepIdx], subject: data.data.subject, body: data.data.body };
        setSteps(updated);
      }
      alert(`✨ Email généré via ${data.data.provider}`);
    } else {
      alert('❌ ' + data.error);
    }
    setAiLoading(false);
  };

  // Edit modal
  if (editingId && editData) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg">Modifier la campagne</h3>
            <button onClick={() => { setEditingId(null); setEditData(null); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name', label: 'Nom *' },
                { key: 'from_name', label: 'Nom expéditeur' },
                { key: 'from_email', label: 'Email expéditeur' },
                { key: 'daily_limit', label: 'Limite/jour', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={editData[f.key] || ''}
                    onChange={e => setEditData({ ...editData, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              ))}
            </div>

            {/* AI config */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold text-blue-900">Config IA</span></div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'company', placeholder: 'Entreprise cible' },
                  { key: 'jobTitle', placeholder: 'Poste cible' },
                  { key: 'goal', placeholder: 'Objectif' },
                ].map(f => (
                  <input key={f.key} value={(aiConfig as any)[f.key]}
                    onChange={e => setAiConfig(p => ({ ...p, [f.key]: e.target.value }))}
                    className="px-2 py-1.5 text-xs border border-blue-200 rounded-lg bg-white focus:outline-none"
                    placeholder={f.placeholder} />
                ))}
              </div>
            </div>

            {/* Steps editor */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900">Étapes de la séquence</h4>
              {(editData.steps || []).map((s: any, i: number) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">{i + 1}</div>
                      <span className="text-sm font-medium text-slate-800">{i === 0 ? 'Email initial' : `Relance #${i}`}</span>
                      {i > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          après <input type="number" min="0" value={s.delay_days || 0}
                            onChange={e => { const ns = [...editData.steps]; ns[i] = { ...s, delay_days: +e.target.value }; setEditData({ ...editData, steps: ns }); }}
                            className="w-12 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs focus:outline-none" /> jours
                        </div>
                      )}
                    </div>
                    <button onClick={() => generateAI(true, i)} disabled={aiLoading}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                      <Sparkles className="w-3 h-3" /> {aiLoading ? '...' : 'IA'}
                    </button>
                  </div>
                  <input value={s.subject || ''}
                    onChange={e => { const ns = [...editData.steps]; ns[i] = { ...s, subject: e.target.value }; setEditData({ ...editData, steps: ns }); }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Objet..." />
                  <textarea value={s.body || ''}
                    onChange={e => { const ns = [...editData.steps]; ns[i] = { ...s, body: e.target.value }; setEditData({ ...editData, steps: ns }); }}
                    rows={5} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-mono"
                    placeholder="Corps de l'email... ({{firstName}}, {{company}})" />
                </div>
              ))}
              <button onClick={() => setEditData({ ...editData, steps: [...(editData.steps || []), { step_order: (editData.steps?.length || 0) + 1, subject: '', body: '', delay_days: 3 }] })}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Ajouter une relance
              </button>
            </div>
          </div>
          <div className="flex gap-2 p-6 border-t border-slate-100">
            <button onClick={() => { setEditingId(null); setEditData(null); }}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">Annuler</button>
            <button onClick={handleSaveEdit} disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campagnes email</h1>
          <p className="text-sm text-slate-500 mt-0.5">{campaigns.length} campagne(s)</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouvelle campagne
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 py-20 text-center">
          <Mail className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">Aucune campagne</h3>
          <p className="text-sm text-slate-400 mt-1 mb-5">Créez votre première campagne email avec IA</p>
          <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">Créer une campagne</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => {
            const cfg = CAMPAIGN_STATUS[c.status] ?? { label: c.status, color: 'bg-slate-100 text-slate-600' };
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>{cfg.label}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(c.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleToggle(c.id, c.status)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title={c.status === 'RUNNING' ? 'Pause' : 'Lancer'}>
                      {c.status === 'RUNNING' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{c.name}</h3>
                {c.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{c.description}</p>}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[{ label: 'Étapes', value: c.steps_count }, { label: 'Envois', value: c.emails_sent }].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">De: {c.from_name} · {fmt.date(c.created_at)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create campaign wizard */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Nouvelle campagne</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <span className={wizardStep >= 1 ? 'text-blue-600 font-medium' : ''}>Paramètres</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className={wizardStep >= 2 ? 'text-blue-600 font-medium' : ''}>Emails</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className={wizardStep >= 3 ? 'text-blue-600 font-medium' : ''}>Confirmer</span>
                </div>
              </div>
              <button onClick={() => setShowNew(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'name', label: 'Nom *', placeholder: 'Prospection Q3 2025' },
                      { key: 'fromName', label: 'Nom expéditeur *', placeholder: 'Jean Dupont' },
                      { key: 'fromEmail', label: 'Email expéditeur *', placeholder: 'jean@entreprise.com' },
                      { key: 'dailyLimit', label: 'Limite/jour', placeholder: '50', type: 'number' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                        <input type={f.type ?? 'text'} value={(form as any)[f.key]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                          placeholder={f.placeholder} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-5">
                  {/* AI config */}
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">Générateur IA</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'company', label: 'Entreprise cible', placeholder: 'Acme Corp' },
                        { key: 'jobTitle', label: 'Poste cible', placeholder: 'CEO, Directeur...' },
                        { key: 'goal', label: 'Objectif', placeholder: 'RDV 20 min' },
                      ].map(f => (
                        <div key={f.key} className={f.key === 'goal' ? 'col-span-2' : ''}>
                          <label className="block text-xs font-medium text-blue-800 mb-1">{f.label}</label>
                          <input value={(aiConfig as any)[f.key]} onChange={e => setAiConfig(p => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-lg bg-white focus:outline-none"
                            placeholder={f.placeholder} />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-medium text-blue-800 mb-1">Ton</label>
                        <select value={aiConfig.tone} onChange={e => setAiConfig(p => ({ ...p, tone: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-lg bg-white">
                          <option value="friendly">Amical</option>
                          <option value="formal">Formel</option>
                          <option value="direct">Direct</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-800 mb-1">Langue</label>
                        <select value={aiConfig.language} onChange={e => setAiConfig(p => ({ ...p, language: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-lg bg-white">
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {steps.map((s, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">{i + 1}</div>
                          <span className="font-medium text-slate-800 text-sm">{i === 0 ? 'Email initial' : `Relance #${i}`}</span>
                          {i > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              après <input type="number" min="0" value={s.delayDays}
                                onChange={e => { const u = [...steps]; u[i] = { ...s, delayDays: +e.target.value }; setSteps(u); }}
                                className="w-12 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs focus:outline-none" /> jours
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => generateAI(false, i)} disabled={aiLoading}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                            <Sparkles className="w-3 h-3" /> {aiLoading ? '...' : 'Générer IA'}
                          </button>
                          {steps.length > 1 && (
                            <button onClick={() => setSteps(prev => prev.filter((_, idx) => idx !== i))}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <input value={s.subject} onChange={e => { const u = [...steps]; u[i] = { ...s, subject: e.target.value }; setSteps(u); }}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Objet de l'email..." />
                      <textarea value={s.body} onChange={e => { const u = [...steps]; u[i] = { ...s, body: e.target.value }; setSteps(u); }}
                        rows={5} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-mono"
                        placeholder="Corps de l'email... ({{firstName}}, {{company}})" />
                    </div>
                  ))}

                  <button onClick={() => setSteps(prev => [...prev, { order: prev.length + 1, subject: '', body: '', delayDays: 3 }])}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Ajouter une relance
                  </button>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Nom', value: form.name },
                      { label: 'Expéditeur', value: `${form.fromName} <${form.fromEmail}>` },
                      { label: 'Étapes', value: `${steps.length} email(s)` },
                      { label: 'Limite/jour', value: `${form.dailyLimit} emails` },
                    ].map(i => (
                      <div key={i.label} className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500">{i.label}</p>
                        <p className="font-semibold text-slate-900 text-sm mt-0.5">{i.value}</p>
                      </div>
                    ))}
                  </div>
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center font-bold">{i + 1}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{s.subject || '(sans objet)'}</p>
                        <p className="text-xs text-slate-400">{i === 0 ? 'Immédiat' : `+${s.delayDays} jour(s)`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between p-6 border-t border-slate-100">
              {wizardStep > 1 ? (
                <button onClick={() => setWizardStep(w => w - 1)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">← Retour</button>
              ) : <div />}
              {wizardStep < 3 ? (
                <button onClick={() => setWizardStep(w => w + 1)}
                  disabled={wizardStep === 1 && (!form.name || !form.fromEmail || !form.fromName)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition">
                  Suivant →
                </button>
              ) : (
                <button onClick={handleCreate} disabled={saving}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition">
                  {saving ? 'Création...' : '✓ Créer la campagne'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
