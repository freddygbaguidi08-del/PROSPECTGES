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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Mot de passe : 8 caractères minimum'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      router.push('/dashboard');
      router.refresh();
    } catch { setError('Erreur serveur'); }
    finally { setLoading(false); }
  };

  const fields = [
    { key: 'name', label: 'Votre nom', type: 'text', placeholder: 'Jean Dupont' },
    { key: 'orgName', label: 'Nom de votre entreprise', type: 'text', placeholder: 'Acme SAS' },
    { key: 'email', label: 'Email professionnel', type: 'email', placeholder: 'vous@entreprise.com' },
    { key: 'password', label: 'Mot de passe', type: 'password', placeholder: '8 caractères minimum' },
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Créer un compte</h1>
      <p className="text-slate-500 text-sm mb-7">Gratuit, sans carte bancaire</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
            <input type={f.type} required value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              placeholder={f.placeholder} />
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition shadow-sm shadow-blue-500/20">
          {loading ? 'Création...' : 'Créer mon compte gratuitement'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-5">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
