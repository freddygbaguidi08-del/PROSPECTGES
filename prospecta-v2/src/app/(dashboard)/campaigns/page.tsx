// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/Toaster';
import { fmt, CAMPAIGN_STATUS } from '@/lib/utils';

const S = {
  card: { background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '0.5px solid rgba(255,255,255,.10)', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.4)' },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: 'rgba(10,15,28,.95)', backdropFilter: 'blur(24px)', border: '0.5px solid rgba(255,255,255,.12)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,.7)', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' as const },
  label: { display: 'block' as const, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 5, letterSpacing: '.5px', textTransform: 'uppercase' as const },
  input: { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#f0f9ff', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none' },
  section: { padding: '20px 24px', borderBottom: '0.5px solid rgba(255,255,255,.06)' },
};

const EMPTY_FORM = { name: '', description: '', fromName: '', fromEmail: '', dailyLimit: '50' };
const EMPTY_STEP = { order: 1, subject: '', body: '', delayDays: 0 };
const AI_CFG = { company: '', jobTitle: 'Directeur', goal: 'Obtenir un RDV de 20 minutes', tone: 'friendly', language: 'fr' };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);
  const [aiCfg, setAiCfg] = useState(AI_CFG);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/campaigns');
    const data = await res.json();
    setCampaigns(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateAI = async (isEdit = false, idx = 0) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', ...aiCfg }),
      });
      const data = await res.json();
      if (data.data) {
        if (isEdit && editData) {
          const ns = [...(editData.steps || [])];
          ns[idx] = { ...ns[idx], subject: data.data.subject, body: data.data.body };
          setEditData({ ...editData, steps: ns });
        } else {
          const ns = [...steps];
          ns[idx] = { ...ns[idx], subject: data.data.subject, body: data.data.body };
          setSteps(ns);
        }
        toast.success(`✨ Email généré via ${data.data.provider}`);
      } else toast.error(data.error || 'Erreur IA');
    } catch (e) { toast.error(e.message); }
    setAiLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.fromEmail) { toast.warning('Nom et email expéditeur requis'); return; }
    setSaving(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, dailyLimit: parseInt(form.dailyLimit), steps }),
    });
    if (res.ok) {
      setShowNew(false); setWizardStep(1);
      setForm(EMPTY_FORM); setSteps([{ ...EMPTY_STEP }]);
      load(); toast.success('Campagne créée');
    } else toast.error('Erreur');
    setSaving(false);
  };

  const handleEdit = async (id) => {
    const res = await fetch(`/api/campaigns/${id}`);
    const data = await res.json();
    setEditData(data.data); setEditingId(id);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await fetch(`/api/campaigns/${editingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editData.name, description: editData.description,
        fromName: editData.from_name, fromEmail: editData.from_email,
        dailyLimit: editData.daily_limit,
        steps: (editData.steps || []).map(s => ({ order: s.step_order, subject: s.subject, body: s.body, delayDays: s.delay_days })),
      }),
    });
    setEditingId(null); setEditData(null); load();
    toast.success('Campagne mise à jour'); setSaving(false);
  };

  const handleToggle = async (id, status) => {
    const next = status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    await fetch(`/api/campaigns/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    load(); toast.success('Supprimée');
  };

  const AiBox = ({ isEdit, idx }) => (
    <div style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 10 }}>✨ Générateur IA</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[['company','Entreprise','Acme Corp'],['jobTitle','Poste','CEO, Directeur...'],['goal','Objectif','RDV 20 min']].map(([k,l,p]) => (
          <div key={k}>
            <label style={{ ...S.label, fontSize: 10 }}>{l}</label>
            <input value={aiCfg[k]} onChange={e => setAiCfg(c => ({ ...c, [k]: e.target.value }))}
              style={{ ...S.input, fontSize: 12, padding: '7px 10px' }} placeholder={p} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ ...S.label, fontSize: 10 }}>Ton</label>
          <select value={aiCfg.tone} onChange={e => setAiCfg(c => ({ ...c, tone: e.target.value }))} style={{ ...S.input, fontSize: 12, padding: '7px 10px' }}>
            <option value="friendly">Amical</option>
            <option value="formal">Formel</option>
            <option value="direct">Direct</option>
          </select>
        </div>
        <div>
          <label style={{ ...S.label, fontSize: 10 }}>Langue</label>
          <select value={aiCfg.language} onChange={e => setAiCfg(c => ({ ...c, language: e.target.value }))} style={{ ...S.input, fontSize: 12, padding: '7px 10px' }}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={() => generateAI(isEdit, idx)} disabled={aiLoading}
            style={{ width: '100%', padding: '7px 10px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: aiLoading ? .5 : 1 }}>
            {aiLoading ? '...' : '✨ Générer'}
          </button>
        </div>
      </div>
    </div>
  );

  const StepEditor = ({ step, idx, isEdit }) => (
    <div style={{ background: 'rgba(255,255,255,.04)', border: '0.5px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{idx + 1}</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f9ff' }}>{idx === 0 ? 'Email initial' : `Relance #${idx}`}</span>
          {idx > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
              après <input type="number" min="0"
                value={isEdit ? (step.delay_days || 0) : step.delayDays}
                onChange={e => {
                  if (isEdit) {
                    const ns = [...editData.steps]; ns[idx] = { ...step, delay_days: +e.target.value };
                    setEditData({ ...editData, steps: ns });
                  } else {
                    const ns = [...steps]; ns[idx] = { ...step, delayDays: +e.target.value }; setSteps(ns);
                  }
                }}
                style={{ ...S.input, width: 48, padding: '4px 8px', textAlign: 'center', fontSize: 12 }} /> jours
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => generateAI(isEdit, idx)} disabled={aiLoading}
            style={{ padding: '5px 10px', background: 'rgba(59,130,246,.2)', border: '1px solid rgba(59,130,246,.3)', borderRadius: 7, color: '#60a5fa', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            ✨ {aiLoading ? '...' : 'IA'}
          </button>
          {((isEdit ? editData?.steps?.length : steps.length) > 1) && (
            <button onClick={() => {
              if (isEdit) { const ns = editData.steps.filter((_, i) => i !== idx); setEditData({ ...editData, steps: ns }); }
              else setSteps(prev => prev.filter((_, i) => i !== idx));
            }} style={{ padding: '5px 8px', background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 7, color: '#f87171', fontSize: 12, cursor: 'pointer' }}>✕</button>
          )}
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={S.label}>Objet</label>
        <input value={isEdit ? (step.subject || '') : step.subject}
          onChange={e => {
            if (isEdit) { const ns = [...editData.steps]; ns[idx] = { ...step, subject: e.target.value }; setEditData({ ...editData, steps: ns }); }
            else { const ns = [...steps]; ns[idx] = { ...step, subject: e.target.value }; setSteps(ns); }
          }}
          style={S.input} placeholder="Objet de l'email..." />
      </div>
      <div>
        <label style={S.label}>Message</label>
        <textarea value={isEdit ? (step.body || '') : step.body}
          onChange={e => {
            if (isEdit) { const ns = [...editData.steps]; ns[idx] = { ...step, body: e.target.value }; setEditData({ ...editData, steps: ns }); }
            else { const ns = [...steps]; ns[idx] = { ...step, body: e.target.value }; setSteps(ns); }
          }}
          rows={6} style={{ ...S.input, resize: 'none', fontFamily: 'monospace', lineHeight: 1.6 }}
          placeholder="Corps de l'email... Utilisez {{firstName}} et {{company}}" />
      </div>
    </div>
  );

  // Edit modal
  if (editingId && editData) return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={{ ...S.section, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f9ff' }}>Modifier la campagne</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{editData.name}</div>
          </div>
          <button onClick={() => { setEditingId(null); setEditData(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[['name','Nom','text'],['from_name','Expéditeur','text'],['from_email','Email expéditeur','email'],['daily_limit','Limite/jour','number']].map(([k,l,t]) => (
              <div key={k}>
                <label style={S.label}>{l}</label>
                <input type={t} value={editData[k] || ''} onChange={e => setEditData({ ...editData, [k]: e.target.value })} style={S.input} />
              </div>
            ))}
          </div>
          <AiBox isEdit={true} idx={0} />
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f9ff', marginBottom: 12 }}>Étapes de la séquence</div>
            {(editData.steps || []).map((s, i) => <StepEditor key={i} step={s} idx={i} isEdit={true} />)}
            <button onClick={() => setEditData({ ...editData, steps: [...(editData.steps || []), { step_order: (editData.steps?.length || 0) + 1, subject: '', body: '', delay_days: 3 }] })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.15)', borderRadius: 10, color: 'rgba(255,255,255,.4)', fontSize: 13, cursor: 'pointer' }}>
              + Ajouter une relance
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setEditingId(null); setEditData(null); }} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,.06)', border: '0.5px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#f0f9ff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button onClick={handleSaveEdit} disabled={saving} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? .5 : 1 }}>{saving ? 'Sauvegarde...' : '✓ Sauvegarder'}</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f0f9ff', letterSpacing: '-.2px' }}>Campagnes email</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>{campaigns.length} campagne(s)</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,.3)' }}>
          + Nouvelle campagne
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[1,2,3].map(i => <div key={i} style={{ ...S.card, height: 160 }} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{ ...S.card, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
          <p style={{ color: '#f0f9ff', fontWeight: 600, marginBottom: 6 }}>Aucune campagne</p>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, marginBottom: 20 }}>Créez votre première séquence email avec IA</p>
          <button onClick={() => setShowNew(true)} style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Créer une campagne</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {campaigns.map(c => {
            const cfg = CAMPAIGN_STATUS[c.status] ?? { label: c.status, cls: '' };
            return (
              <div key={c.id} style={{ ...S.card, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span className={`badge ${cfg.cls}`} style={{ fontSize: 11 }}>{cfg.label}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleEdit(c.id)} title="Modifier" style={{ padding: '4px 7px', background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 7, color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleToggle(c.id, c.status)} title={c.status === 'RUNNING' ? 'Pause' : 'Lancer'} style={{ padding: '4px 7px', background: 'rgba(74,222,128,.12)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 7, color: '#4ade80', fontSize: 11, cursor: 'pointer' }}>{c.status === 'RUNNING' ? '⏸' : '▶'}</button>
                    <button onClick={() => handleDelete(c.id)} style={{ padding: '4px 7px', background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 7, color: '#f87171', fontSize: 11, cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f9ff', marginBottom: 4 }}>{c.name}</div>
                {c.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.description}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                  {[['Étapes', c.steps_count],['Envois', c.emails_sent]].map(([l,v]) => (
                    <div key={l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f9ff' }}>{v || 0}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 10 }}>De: {c.from_name} · {fmt.date(c.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create wizard */}
      {showNew && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ ...S.section, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f9ff' }}>Nouvelle campagne</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {['Paramètres','Emails','Confirmer'].map((l,i) => (
                    <span key={l} style={{ fontSize: 11, fontWeight: wizardStep === i+1 ? 700 : 400, color: wizardStep === i+1 ? '#60a5fa' : 'rgba(255,255,255,.3)' }}>{i > 0 && '→ '}{l}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => { setShowNew(false); setWizardStep(1); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>
              {wizardStep === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[['name','Nom *','text','Prospection Q3 2025'],['fromName','Nom expéditeur *','text','Jean Dupont'],['fromEmail','Email expéditeur *','email','jean@co.com'],['dailyLimit','Limite/jour','number','50']].map(([k,l,t,p]) => (
                    <div key={k}>
                      <label style={S.label}>{l}</label>
                      <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={S.input} placeholder={p} />
                    </div>
                  ))}
                </div>
              )}

              {wizardStep === 2 && (
                <div>
                  <AiBox isEdit={false} idx={0} />
                  {steps.map((s, i) => <StepEditor key={i} step={s} idx={i} isEdit={false} />)}
                  <button onClick={() => setSteps(p => [...p, { order: p.length + 1, subject: '', body: '', delayDays: 3 }])}
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.15)', borderRadius: 10, color: 'rgba(255,255,255,.4)', fontSize: 13, cursor: 'pointer' }}>
                    + Ajouter une relance
                  </button>
                </div>
              )}

              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[['Nom',form.name],['Expéditeur',`${form.fromName} <${form.fromEmail}>`],['Étapes',`${steps.length} email(s)`],['Limite/jour',`${form.dailyLimit}/jour`]].map(([l,v]) => (
                      <div key={l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f9ff' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 10, alignItems: 'center' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{i+1}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#f0f9ff' }}>{s.subject || '(sans objet)'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{i === 0 ? 'Immédiat' : `+${s.delayDays} jour(s)`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between' }}>
              {wizardStep > 1 ? (
                <button onClick={() => setWizardStep(w => w-1)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,.06)', border: '0.5px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#f0f9ff', fontSize: 13, cursor: 'pointer' }}>← Retour</button>
              ) : <div />}
              {wizardStep < 3 ? (
                <button onClick={() => setWizardStep(w => w+1)} disabled={wizardStep === 1 && (!form.name || !form.fromEmail)}
                  style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (wizardStep === 1 && (!form.name || !form.fromEmail)) ? .4 : 1 }}>
                  Suivant →
                </button>
              ) : (
                <button onClick={handleCreate} disabled={saving}
                  style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? .5 : 1 }}>
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
