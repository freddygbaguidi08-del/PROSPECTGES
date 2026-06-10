// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const label = { display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: 6, letterSpacing: '.5px', textTransform: 'uppercase' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Mot de passe : 8 caractères minimum'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur'); return; }
      router.push('/dashboard'); router.refresh();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fields = [
    { key: 'name', label: 'Votre nom', placeholder: 'Jean Dupont', type: 'text' },
    { key: 'orgName', label: 'Votre organisation', placeholder: 'NOF PROSPECT PROD', type: 'text' },
    { key: 'email', label: 'Email professionnel', placeholder: 'vous@entreprise.com', type: 'email' },
    { key: 'password', label: 'Mot de passe', placeholder: '8 caractères minimum', type: 'password' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f9ff', letterSpacing: '-.2px' }}>Créer un compte</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>Gratuit, sans carte bancaire</div>
      </div>
      {error && <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={label}>{f.label}</label>
            <input type={f.type} required value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input" placeholder={f.placeholder} />
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
          {loading ? 'Création...' : 'Créer mon compte →'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
        Déjà un compte ?{' '}
        <Link href="/login" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
      </div>
    </div>
  );
}
