'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      router.push('/dashboard');
      router.refresh();
    } catch { setError('Erreur de connexion'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Connexion</h1>
      <p className="text-slate-500 text-sm mb-7">Accédez à votre espace</p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            placeholder="vous@entreprise.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
          <input type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition shadow-sm shadow-blue-500/20">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-blue-600 font-medium hover:underline">Créer un compte</Link>
      </p>
    </div>
  );
}
