// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/Toaster';
import { fmt, CAMPAIGN_STATUS } from '@/lib/utils';

const glass = {
  background: 'rgba(255,255,255,.06)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '0.5px solid rgba(255,255,255,.10)',
  borderRadius: 14,
  boxShadow: '0 8px 32px rgba(0,0,0,.4)',
};

const overlay = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(0,0,0,.8)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
};

const modal = {
  background: 'rgba(8,12,20,.97)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '0.5px solid rgba(255,255,255,.12)',
  borderRadius: 16,
  boxShadow: '0 24px 80px rgba(0,0,0,.8)',
  width: '100%',
  maxWidth: 660,
  height: '85vh',
  display: 'flex',
  flexDirection: 'column' as const,
};

const inp = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(255,255,255,.07)',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 10,
  color: '#f0f9ff',
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  transition: 'border-color 150ms',
};

const lbl = {
  display: 'block' as const,
  fontSize: 10,
  fontWeight: 700,
  color: 'rgba(255,255,255,.4)',
  marginBottom: 5,
  letterSpacing: '.8px',
  textTransform: 'uppercase' as const,
};

const btnPrimary = {
  padding: '9px 20px',
  background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 2px 12px rgba(59,130,246,.3)',
  transition: 'transform 150ms, box-shadow 150ms',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnGhost = {
  padding: '9px 18px',
  background: 'rgba(255,255,255,.06)',
  border: '0.5px solid rgba(255,255,255,.12)',
  borderRadius: 10,
  color: 'rgba(255,255,255,.7)',
  fontSize: 13,
  cursor: 'pointer',
};

const EMPTY_FORM = { name: '', description: '', fromName: '', fromEmail: '', dailyLimit: '50' };
const EMPTY_AI = { company: '', jobTitle: 'Directeur Commercial', goal: 'Obtenir un RDV de 20 minutes', tone: 'friendly', language: 'fr' };

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
  const [steps, setSteps] = useState([{ order: 1, subject: '', body: '', delayDays: 0 }]);
  const [ai, setAi] = useState(EMPTY_AI);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/campaigns');
    const data = await res.json();
    setCampaigns(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateAI = async (isEdit, idx) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', ...ai }),
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
        toast.success(`Email généré via ${data.data.provider}`);
      } else {
        toast.error(data.error || 'Erreur IA');
      }
    } catch (e) {
      toast.error('Erreur: ' + e.message);
    }
    setAiLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.fromEmail || !form.fromName) {
      toast.warning('Nom, expéditeur et email requis');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, dailyLimit: parseInt(form.dailyLimit || '50'), steps }),
    });
    if (res.ok) {
      setShowNew(false); setWizardStep(1);
      setForm(EMPTY_FORM); setSteps([{ order: 1, subject: '', body: '', delayDays: 0 }]);
      load(); toast.success('Campagne créée avec succès');
    } else {
      toast.error('Erreur lors de la création');
    }
    setSaving(false);
  };

  const handleEdit = async (id) => {
    const res = await fetch(`/api/campaigns/${id}`);
    const data = await res.json();
    setEditData(data.data);
    setEditingId(id);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const res = await fetch(`/api/campaigns/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editData.name,
        description: editData.description,
        fromName: editData.from_name,
        fromEmail: editData.from_email,
        dailyLimit: editData.daily_limit,
        steps: (editData.steps || []).map(s => ({
          order: s.step_order,
          subject: s.subject,
          body: s.body,
          delayDays: s.delay_days,
        })),
      }),
    });
    if (res.ok) {
      setEditingId(null); setEditData(null);
      load(); toast.success('Campagne mise à jour');
    } else {
      toast.error('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const handleToggle = async (id, status) => {
    const next = status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    load(); toast.success('Campagne supprimée');
  };

  const AiPanel = ({ isEdit, idx }) => (
    <div style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>✦</span> Génération par intelligence artificielle
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        {[['company','Entreprise cible','Ex: Orange SA'],['jobTitle','Poste visé','Ex: DG, DSI...'],['goal','Objectif','RDV, démo, info...']].map(([k,l,p]) => (
          <div key={k}>
            <label style={lbl}>{l}</label>
            <input value={ai[k]} onChange={e => setAi(c => ({ ...c, [k]: e.target.value }))}
              style={{ ...inp, fontSize: 12, padding: '7px 10px' }} placeholder={p} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
        <div>
          <label style={lbl}>Registre</label>
          <select value={ai.tone} onChange={e => setAi(c => ({ ...c, tone: e.target.value }))}
            style={{ ...inp, fontSize: 12, padding: '7px 10px' }}>
            <option value="friendly">Amical</option>
            <option value="formal">Formel</option>
            <option value="direct">Direct</option>
            <option value="creative">Créatif</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Langue</label>
          <select value={ai.language} onChange={e => setAi(c => ({ ...c, language: e.target.value }))}
            style={{ ...inp, fontSize: 12, padding: '7px 10px' }}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        <button onClick={() => generateAI(isEdit, idx)} disabled={aiLoading}
          style={{ padding: '8px 16px', background: aiLoading ? 'rgba(59,130,246,.3)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms' }}>
          {aiLoading ? '◌ Génération...' : '✦ Générer'}
        </button>
      </div>
    </div>
  );

  const StepCard = ({ step, idx, isEdit }) => {
    const subject = isEdit ? (step.subject || '') : step.subject;
    const body = isEdit ? (step.body || '') : step.body;
    const delay = isEdit ? (step.delay_days || 0) : step.delayDays;

    const updateStep = (field, val) => {
      if (isEdit) {
        const ns = [...(editData?.steps || [])];
        ns[idx] = { ...ns[idx], [field]: val };
        setEditData({ ...editData, steps: ns });
      } else {
        const ns = [...steps];
        const key = field === 'delay_days' ? 'delayDays' : field;
        ns[idx] = { ...ns[idx], [key]: val };
        setSteps(ns);
      }
    };

    const removeStep = () => {
      if (isEdit) {
        setEditData({ ...editData, steps: editData.steps.filter((_, i) => i !== idx) });
      } else {
        setSteps(prev => prev.filter((_, i) => i !== idx));
      }
    };

    const count = isEdit ? (editData?.steps?.length || 0) : steps.length;

    return (
      <div style={{ background: 'rgba(255,255,255,.04)', border: '0.5px solid rgba(255,255,255,.09)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{idx + 1}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f9ff' }}>
              {idx === 0 ? 'Email de prospection initial' : `Relance n°${idx}`}
            </span>
            {idx > 0 && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                — J+<input type="number" min="1" value={delay}
                  onChange={e => updateStep(isEdit ? 'delay_days' : 'delayDays', +e.target.value)}
                  style={{ ...inp, width: 44, padding: '3px 6px', fontSize: 12, textAlign: 'center', display: 'inline-block' }} />
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => generateAI(isEdit, idx)} disabled={aiLoading}
              style={{ padding: '5px 10px', background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 7, color: '#60a5fa', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {aiLoading ? '◌' : '✦'} IA
            </button>
            {count > 1 && (
              <button onClick={removeStep}
                style={{ padding: '5px 9px', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 7, color: '#f87171', fontSize: 12, cursor: 'pointer' }}>✕</button>
            )}
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={lbl}>Objet de l'email</label>
          <input value={subject} onChange={e => updateStep('subject', e.target.value)}
            style={inp} placeholder="Ex: Une idée pour accélérer votre croissance" />
        </div>
        <div>
          <label style={lbl}>Corps du message</label>
          <textarea value={body} onChange={e => updateStep('body', e.target.value)}
            rows={7}
            style={{ ...inp, resize: 'none', lineHeight: 1.7, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            placeholder={'Bonjour {{firstName}},\n\nVotre message ici...\n\nCordialement,\nVotre nom'} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 4 }}>
            Variables : <code style={{ color: '#60a5fa' }}>{'{{firstName}}'}</code> · <code style={{ color: '#60a5fa' }}>{'{{company}}'}</code> · <code style={{ color: '#60a5fa' }}>{'{{lastName}}'}</code>
          </div>
        </div>
      </div>
    );
  };

  // ─── Edit modal ──────────────────────────────────────────
  if (editingId && editData) return (
    <div style={overlay}>
      <div style={modal}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '0.5px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f9ff' }}>Modifier la campagne</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{editData.name}</div>
          </div>
          <button onClick={() => { setEditingId(null); setEditData(null); }}
            style={{ width: 32, height: 32, background: 'rgba(255,255,255,.06)', border: '0.5px solid rgba(255,255,255,.1)', borderRadius: 8, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[['name','Nom de la campagne'],['from_name','Nom expéditeur'],['from_email','Email expéditeur'],['daily_limit','Limite / jour']].map(([k,l]) => (
              <div key={k}>
                <label style={lbl}>{l}</label>
                <input value={editData[k] || ''} onChange={e => setEditData({ ...editData, [k]: e.target.value })} style={inp} />
              </div>
            ))}
          </div>
          <AiPanel isEdit={true} idx={0} />
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f9ff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>◈</span> Séquence d'emails
          </div>
          {(editData.steps || []).map((s, i) => <StepCard key={i} step={s} idx={i} isEdit={true} />)}
          <button onClick={() => setEditData({ ...editData, steps: [...(editData.steps || []), { step_order: (editData.steps?.length || 0) + 1, subject: '', body: '', delay_days: 3 }] })}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed rgba(255,255,255,.15)', borderRadius: 10, color: 'rgba(255,255,255,.35)', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
            + Ajouter une relance
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '0.5px solid rgba(255,255,255,.08)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={() => { setEditingId(null); setEditData(null); }} style={{ ...btnGhost, flex: 1 }}>Annuler</button>
          <button onClick={handleSaveEdit} disabled={saving}
            style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: saving ? .6 : 1 }}>
            {saving ? '◌ Sauvegarde...' : '✓ Sauvegarder les modifications'}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Main page ───────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f0f9ff', letterSpacing: '-.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>◎</span> Campagnes email
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>{campaigns.length} campagne(s) · Séquences de prospection automatisées</p>
        </div>
        <button onClick={() => setShowNew(true)} style={btnPrimary}>
          <span style={{ fontSize: 16 }}>+</span> Nouvelle campagne
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
          {[1,2,3].map(i => <div key={i} style={{ ...glass, height: 180 }} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{ ...glass, padding: '64px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>◎</div>
          <p style={{ color: '#f0f9ff', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Aucune campagne</p>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 13, marginBottom: 22 }}>Créez votre première séquence de prospection avec génération par IA</p>
          <button onClick={() => setShowNew(true)} style={{ ...btnPrimary, margin: '0 auto' }}>
            <span>+</span> Créer ma première campagne
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
          {campaigns.map(c => {
            const cfg = CAMPAIGN_STATUS[c.status] ?? { label: c.status, cls: '' };
            return (
              <div key={c.id} style={{ ...glass, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className={`badge ${cfg.cls}`} style={{ fontSize: 11 }}>{cfg.label}</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => handleEdit(c.id)} title="Modifier"
                      style={{ padding: '5px 8px', background: 'rgba(96,165,250,.12)', border: '0.5px solid rgba(96,165,250,.25)', borderRadius: 7, color: '#60a5fa', fontSize: 13, cursor: 'pointer' }}>✎</button>
                    <button onClick={() => handleToggle(c.id, c.status)} title={c.status === 'RUNNING' ? 'Mettre en pause' : 'Activer'}
                      style={{ padding: '5px 8px', background: c.status === 'RUNNING' ? 'rgba(251,191,36,.12)' : 'rgba(74,222,128,.12)', border: `0.5px solid ${c.status === 'RUNNING' ? 'rgba(251,191,36,.25)' : 'rgba(74,222,128,.25)'}`, borderRadius: 7, color: c.status === 'RUNNING' ? '#fbbf24' : '#4ade80', fontSize: 13, cursor: 'pointer' }}>
                      {c.status === 'RUNNING' ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => handleDelete(c.id)} title="Supprimer"
                      style={{ padding: '5px 8px', background: 'rgba(248,113,113,.1)', border: '0.5px solid rgba(248,113,113,.2)', borderRadius: 7, color: '#f87171', fontSize: 13, cursor: 'pointer' }}>⌫</button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f9ff', marginBottom: 2 }}>{c.name}</div>
                  {c.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{c.description}</div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Étapes',c.steps_count||0,'◈'],['Envois',c.emails_sent||0,'◉']].map(([l,v,ic]) => (
                    <div key={l as string} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 9, padding: '8px 10px' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f9ff' }}>{v}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>{ic} {l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', borderTop: '0.5px solid rgba(255,255,255,.06)', paddingTop: 10 }}>
                  De : {c.from_name || '—'} · {fmt.date(c.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create wizard ─── */}
      {showNew && (
        <div style={overlay}>
          <div style={modal}>
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '0.5px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f9ff' }}>Nouvelle campagne</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  {[{n:1,l:'Paramètres'},{n:2,l:'Emails'},{n:3,l:'Confirmation'}].map(s => (
                    <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {s.n > 1 && <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 10 }}>›</span>}
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: wizardStep >= s.n ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: wizardStep >= s.n ? '#fff' : 'rgba(255,255,255,.3)' }}>{s.n}</div>
                      <span style={{ fontSize: 11, color: wizardStep === s.n ? '#60a5fa' : 'rgba(255,255,255,.3)', fontWeight: wizardStep === s.n ? 700 : 400 }}>{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => { setShowNew(false); setWizardStep(1); }}
                style={{ width: 32, height: 32, background: 'rgba(255,255,255,.06)', border: '0.5px solid rgba(255,255,255,.1)', borderRadius: 8, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {wizardStep === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[['name','Nom de la campagne *','text','Ex: Prospection PME France Q3'],['fromName','Nom expéditeur *','text','Jean Dupont'],['fromEmail','Email expéditeur *','email','jean@entreprise.com'],['dailyLimit','Limite quotidienne','number','50']].map(([k,l,t,p]) => (
                    <div key={k}>
                      <label style={lbl}>{l}</label>
                      <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={inp} placeholder={p} />
                    </div>
                  ))}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={lbl}>Description (optionnel)</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={2} style={{ ...inp, resize: 'none' }} placeholder="Objectif de cette campagne..." />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div>
                  <AiPanel isEdit={false} idx={0} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f9ff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>◈</span> Séquence d'emails ({steps.length} étape{steps.length > 1 ? 's' : ''})
                  </div>
                  {steps.map((s, i) => <StepCard key={i} step={s} idx={i} isEdit={false} />)}
                  <button onClick={() => setSteps(p => [...p, { order: p.length + 1, subject: '', body: '', delayDays: 3 }])}
                    style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed rgba(255,255,255,.15)', borderRadius: 10, color: 'rgba(255,255,255,.4)', fontSize: 12, cursor: 'pointer' }}>
                    + Ajouter une relance
                  </button>
                </div>
              )}

              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#86efac' }}>
                    ✓ Vérifiez les informations avant de créer votre campagne
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[['Nom',form.name],['Expéditeur',`${form.fromName} <${form.fromEmail}>`],['Nombre d\'étapes',`${steps.length} email(s)`],['Limite/jour',`${form.dailyLimit} emails`]].map(([l,v]) => (
                      <div key={l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f9ff' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f9ff' }}>{s.subject || '(sans objet)'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{i === 0 ? 'Envoi immédiat' : `Relance J+${s.delayDays}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '0.5px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              {wizardStep > 1 ? (
                <button onClick={() => setWizardStep(w => w - 1)} style={btnGhost}>← Retour</button>
              ) : <div />}
              {wizardStep < 3 ? (
                <button onClick={() => setWizardStep(w => w + 1)}
                  disabled={wizardStep === 1 && (!form.name || !form.fromEmail || !form.fromName)}
                  style={{ ...btnPrimary, opacity: (wizardStep === 1 && (!form.name || !form.fromEmail || !form.fromName)) ? .4 : 1 }}>
                  Continuer →
                </button>
              ) : (
                <button onClick={handleCreate} disabled={saving}
                  style={{ ...btnPrimary, background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 2px 12px rgba(16,185,129,.3)', opacity: saving ? .6 : 1 }}>
                  {saving ? '◌ Création...' : '✓ Créer la campagne'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
