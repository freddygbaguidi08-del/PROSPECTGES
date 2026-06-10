// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/Toaster';

const glass = { background:'rgba(255,255,255,.06)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)', border:'0.5px solid rgba(255,255,255,.10)', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.4)' };
const inp = { width:'100%', padding:'9px 12px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, color:'#f0f9ff', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' };
const lbl = { display:'block', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.4)', marginBottom:5, letterSpacing:'.8px', textTransform:'uppercase' };
const btnP = { padding:'9px 20px', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' };

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name:'', email:'', orgName:'' });
  const [pass, setPass] = useState({ current:'', newPass:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/login').then(r => r.json()).then(d => {
      if (d.user) setProfile({ name:d.user.name||'', email:d.user.email||'', orgName:d.user.orgName||'' });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    toast.info('Profil mis à jour (fonctionnalité à connecter)');
    setSaving(false);
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (pass.newPass.length < 8) { toast.warning('Minimum 8 caractères'); return; }
    if (pass.newPass !== pass.confirm) { toast.warning('Les mots de passe ne correspondent pas'); return; }
    setSavingPass(true);
    const res = await fetch('/api/auth/change-password', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ currentPassword:pass.current, newPassword:pass.newPass }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success('Mot de passe modifié avec succès');
      setPass({ current:'', newPass:'', confirm:'' });
    } else toast.error(data.error || 'Erreur');
    setSavingPass(false);
  };

  const Section = ({ title, children }) => (
    <div style={{ ...glass, padding:24 }}>
      <div style={{ fontSize:14, fontWeight:700, color:'#f0f9ff', marginBottom:20, paddingBottom:12, borderBottom:'0.5px solid rgba(255,255,255,.08)' }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:600 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, color:'#f0f9ff', letterSpacing:'-.3px' }}>⚙ Paramètres</h1>
        <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:4 }}>Gérez votre compte et vos préférences</p>
      </div>

      {/* Profile */}
      <Section title="◈ Informations du compte">
        <form onSubmit={handleSaveProfile} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {loading ? (
            <div style={{ height:80, background:'rgba(255,255,255,.04)', borderRadius:9 }} />
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Nom complet</label>
                  <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name:e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email:e.target.value }))} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Organisation</label>
                <input value={profile.orgName} onChange={e => setProfile(p => ({ ...p, orgName:e.target.value }))} style={inp} />
              </div>
            </>
          )}
          <button type="submit" disabled={saving || loading} style={{ ...btnP, alignSelf:'flex-start', opacity:(saving||loading)?.5:1 }}>
            {saving?'◌ Sauvegarde...':'Sauvegarder le profil'}
          </button>
        </form>
      </Section>

      {/* Password */}
      <Section title="◈ Sécurité · Mot de passe">
        <form onSubmit={handleChangePass} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[['current','Mot de passe actuel'],['newPass','Nouveau mot de passe'],['confirm','Confirmer le nouveau']].map(([k,l]) => (
            <div key={k}>
              <label style={lbl}>{l}</label>
              <input type="password" value={pass[k]} onChange={e => setPass(p => ({ ...p, [k]:e.target.value }))}
                style={inp} placeholder="••••••••" />
            </div>
          ))}
          <button type="submit" disabled={savingPass} style={{ ...btnP, alignSelf:'flex-start', background:'linear-gradient(135deg,#6366f1,#4f46e5)', opacity:savingPass?.5:1 }}>
            {savingPass?'◌ Mise à jour...':'Changer le mot de passe'}
          </button>
        </form>
      </Section>

      {/* Info */}
      <div style={{ ...glass, padding:20, background:'rgba(59,130,246,.06)', border:'1px solid rgba(59,130,246,.15)' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#60a5fa', marginBottom:8 }}>◈ NOF PROSPECT PROD</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', lineHeight:1.6 }}>
          Plateforme B2B de prospection commerciale · Version 1.0<br />
          Stack : Next.js 14 · Supabase · Groq AI · Brevo
        </div>
      </div>
    </div>
  );
}
