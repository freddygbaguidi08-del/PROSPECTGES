// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [newPass, setNewPass] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);

  const label = { display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: 6, letterSpacing: '.5px', textTransform: 'uppercase' };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur'); return; }
      if (data.mustChangePassword) { setUserId(data.user.id); setMustChange(true); return; }
      router.push('/dashboard'); router.refresh();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (newPass.password.length < 8) { setError('Minimum 8 caractères'); return; }
    if (newPass.password !== newPass.confirm) { setError('Mots de passe différents'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, newPassword: newPass.password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur'); return; }
      router.push('/dashboard'); router.refresh();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const errorBox = error && (
    <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>
      {error}
    </div>
  );

  if (mustChange) return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f9ff' }}>Changement de mot de passe</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 6 }}>Votre administrateur vous demande de définir un nouveau mot de passe</div>
      </div>
      {errorBox}
      <form onSubmit={handleChangePass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[{ k: 'password', l: 'Nouveau mot de passe' }, { k: 'confirm', l: 'Confirmer' }].map(f => (
          <div key={f.k}>
            <label style={label}>{f.l}</label>
            <input type="password" required minLength={8} value={newPass[f.k]} onChange={e => setNewPass(p => ({ ...p, [f.k]: e.target.value }))} className="input" placeholder="••••••••" />
          </div>
        ))}
        <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
          {saving ? 'Mise à jour...' : 'Définir mon mot de passe'}
        </button>
      </form>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f9ff', letterSpacing: '-.2px' }}>Connexion</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>Accédez à votre espace de prospection</div>
      </div>
      {errorBox}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={label}>Email</label>
          <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input" placeholder="vous@entreprise.com" />
        </div>
        <div>
          <label style={label}>Mot de passe</label>
          <div style={{ position: 'relative' }}>
            <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input" placeholder="••••••••" style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)' }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
          {loading ? 'Connexion...' : 'Se connecter →'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
        Pas de compte ?{' '}
        <Link href="/register" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>Créer un compte</Link>
      </div>
    </div>
  );
}
