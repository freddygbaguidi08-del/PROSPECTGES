// @ts-nocheck
'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import { toast } from '@/components/ui/Toaster';
import { fmt } from '@/lib/utils';

const glass = { background:'rgba(255,255,255,.06)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)', border:'0.5px solid rgba(255,255,255,.10)', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.4)' };
const inp = { width:'100%', padding:'9px 12px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, color:'#f0f9ff', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' };
const lbl = { display:'block', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.4)', marginBottom:5, letterSpacing:'.8px', textTransform:'uppercase' };
const btnP = { padding:'9px 18px', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 2px 12px rgba(59,130,246,.3)', display:'inline-flex', alignItems:'center', gap:6 };

const STATUS_CFG = {
  SENT: { label:'Envoyé', color:'rgba(59,130,246,.15)', border:'rgba(59,130,246,.3)', text:'#60a5fa', dot:'#3b82f6' },
  OPENED: { label:'Ouvert', color:'rgba(74,222,128,.12)', border:'rgba(74,222,128,.25)', text:'#4ade80', dot:'#4ade80' },
  CLICKED: { label:'Cliqué', color:'rgba(167,139,250,.12)', border:'rgba(167,139,250,.25)', text:'#c4b5fd', dot:'#a78bfa' },
  BOUNCED: { label:'Rebond', color:'rgba(248,113,113,.1)', border:'rgba(248,113,113,.25)', text:'#f87171', dot:'#f87171' },
};

// SendForm defined OUTSIDE to avoid focus loss
const SendForm = memo(function SendForm({ onSend, sending, aiLoading, onGenerate }) {
  const [email, setEmail] = useState({ to:'', toName:'', subject:'', body:'', fromName:'', fromEmail:'' });
  const [aiCfg, setAiCfg] = useState({ prospectName:'', company:'', jobTitle:'', goal:'Obtenir un RDV de 20 minutes', tone:'friendly', language:'fr' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSend(email);
    setEmail({ to:'', toName:'', subject:'', body:'', fromName:'', fromEmail:'' });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* AI panel */}
      <div style={{ background:'rgba(59,130,246,.08)', border:'1px solid rgba(59,130,246,.2)', borderRadius:12, padding:'14px 16px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#60a5fa', marginBottom:12 }}>✦ Génération intelligente</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          {[['prospectName','Nom prospect','Jean Martin'],['company','Entreprise','Acme Corp'],['jobTitle','Poste','CEO'],['goal','Objectif','RDV 20 min']].map(([k,l,p]) => (
            <div key={k}>
              <label style={lbl}>{l}</label>
              <input value={aiCfg[k]} onChange={e => setAiCfg(c => ({ ...c, [k]:e.target.value }))}
                style={{ ...inp, fontSize:12, padding:'7px 10px' }} placeholder={p} />
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:10, alignItems:'flex-end' }}>
          <div>
            <label style={lbl}>Registre</label>
            <select value={aiCfg.tone} onChange={e => setAiCfg(c => ({ ...c, tone:e.target.value }))} style={{ ...inp, fontSize:12, padding:'7px 10px' }}>
              <option value="friendly">Amical</option><option value="formal">Formel</option><option value="direct">Direct</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Langue</label>
            <select value={aiCfg.language} onChange={e => setAiCfg(c => ({ ...c, language:e.target.value }))} style={{ ...inp, fontSize:12, padding:'7px 10px' }}>
              <option value="fr">Français</option><option value="en">English</option>
            </select>
          </div>
          <button onClick={() => onGenerate(aiCfg, (s,b) => setEmail(e => ({ ...e, subject:s, body:b })))} disabled={aiLoading}
            style={{ padding:'8px 14px', background:aiLoading?'rgba(59,130,246,.4)':'linear-gradient(135deg,#3b82f6,#1d4ed8)', border:'none', borderRadius:9, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
            {aiLoading?'◌ ...':'✦ Générer'}
          </button>
        </div>
      </div>

      {/* Email form */}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[['to','Destinataire (email) *','email','contact@entreprise.com',true],['toName','Nom destinataire','text','Jean Martin',false],['fromName','Votre nom','text','',false],['fromEmail','Votre email','email','',false]].map(([k,l,t,p,req]) => (
            <div key={k}>
              <label style={lbl}>{l}</label>
              <input type={t} required={req} value={email[k]} onChange={e => setEmail(v => ({ ...v, [k]:e.target.value }))}
                style={inp} placeholder={p} />
            </div>
          ))}
        </div>
        <div>
          <label style={lbl}>Objet *</label>
          <input required value={email.subject} onChange={e => setEmail(v => ({ ...v, subject:e.target.value }))} style={inp} placeholder="Objet de l'email..." />
        </div>
        <div>
          <label style={lbl}>Message *</label>
          <textarea required value={email.body} onChange={e => setEmail(v => ({ ...v, body:e.target.value }))}
            rows={8} style={{ ...inp, resize:'none', lineHeight:1.7 }} placeholder="Corps de l'email..." />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button type="submit" disabled={sending} style={{ ...btnP, flex:1, justifyContent:'center', opacity:sending?.5:1 }}>
            {sending?'◌ Envoi en cours...':'↑ Envoyer l\'email'}
          </button>
        </div>
      </form>
    </div>
  );
});

export default function InboxPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showSend, setShowSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async (f = filter) => {
    setLoading(true);
    const res = await fetch(`/api/inbox?filter=${f}`);
    const data = await res.json();
    setLogs(data.data ?? []);
    setStats(data.stats ?? null);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleSend = useCallback(async (email) => {
    setSending(true);
    const res = await fetch('/api/email/send', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(email),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(data.demo ? data.message : 'Email envoyé avec succès');
      setShowSend(false);
      load();
    } else {
      toast.error(data.error || 'Erreur lors de l\'envoi');
    }
    setSending(false);
  }, [load]);

  const handleGenerate = useCallback(async (aiCfg, onResult) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ action:'generate', ...aiCfg }),
      });
      const data = await res.json();
      if (data.data) {
        onResult(data.data.subject, data.data.body);
        toast.success(`Généré via ${data.data.provider}`);
      } else toast.error(data.error || 'Erreur');
    } catch(e) { toast.error(e.message); }
    setAiLoading(false);
  }, []);

  const openRate = stats && Number(stats.total) > 0
    ? Math.round((Number(stats.opened) / Number(stats.total)) * 100)
    : 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#f0f9ff', letterSpacing:'-.3px' }}>◎ Boîte d'envoi</h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:4 }}>
            {stats ? `${stats.total} email(s) envoyé(s) · ${openRate}% d'ouverture` : 'Chargement...'}
          </p>
        </div>
        <button onClick={() => setShowSend(!showSend)} style={btnP}>
          {showSend ? '✕ Fermer' : '↑ Envoyer un email'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {[['Total envoyés',stats.total,'#3b82f6'],['Ouverts',stats.opened,'#4ade80'],['Taux d\'ouverture',`${openRate}%`,'#fbbf24']].map(([l,v,c]) => (
            <div key={l} style={{ ...glass, padding:18 }}>
              <div style={{ fontSize:24, fontWeight:800, color:c }}>{v}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:4, textTransform:'uppercase', letterSpacing:'.5px' }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Send form */}
      {showSend && (
        <div style={{ ...glass, padding:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#f0f9ff', marginBottom:16 }}>Nouveau message</div>
          <SendForm onSend={handleSend} sending={sending} aiLoading={aiLoading} onGenerate={handleGenerate} />
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8 }}>
        {[['all','Tous'],['sent','Envoyés'],['opened','Ouverts']].map(([k,l]) => (
          <button key={k} onClick={() => { setFilter(k); load(k); }}
            style={{ padding:'7px 14px', background:filter===k?'linear-gradient(135deg,#3b82f6,#1d4ed8)':'rgba(255,255,255,.06)', border:`0.5px solid ${filter===k?'transparent':'rgba(255,255,255,.10)'}`, borderRadius:9, color:filter===k?'#fff':'rgba(255,255,255,.6)', fontSize:12, fontWeight:filter===k?600:400, cursor:'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Log list */}
      <div style={{ ...glass, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:20 }}>
            {[1,2,3,4,5].map(i => <div key={i} style={{ height:52, background:'rgba(255,255,255,.04)', borderRadius:9, marginBottom:8 }} />)}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ fontSize:40, opacity:.3, marginBottom:12 }}>◎</div>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:13 }}>Aucun email envoyé pour l'instant</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', padding:'10px 20px', borderBottom:'0.5px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>
              {['Email / Destinataire','Statut','Date'].map(h => (
                <div key={h} style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.3)', letterSpacing:'.5px', textTransform:'uppercase' }}>{h}</div>
              ))}
            </div>
            {logs.map(log => {
              const cfg = STATUS_CFG[log.status] ?? STATUS_CFG.SENT;
              return (
                <div key={log.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', padding:'12px 20px', borderBottom:'0.5px solid rgba(255,255,255,.04)', gap:16, alignItems:'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#f0f9ff', marginBottom:2 }}>{log.subject}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>
                      {log.first_name ? `${log.first_name} ${log.last_name}` : log.to_email}
                      {log.company && ` · ${log.company}`}
                      {log.campaign_name && <span style={{ color:'#60a5fa' }}> · {log.campaign_name}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot }} />
                    <span style={{ fontSize:11, fontWeight:600, color:cfg.text }}>{cfg.label}</span>
                    {log.open_count > 0 && <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>({log.open_count}×)</span>}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', whiteSpace:'nowrap' }}>{log.sent_at ? fmt.relative(log.sent_at) : '—'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
