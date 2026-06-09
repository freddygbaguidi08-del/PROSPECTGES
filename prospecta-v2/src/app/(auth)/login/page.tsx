// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [newPassword, setNewPassword] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [userId, setUserId] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur de connexion'); return; }

      if (data.mustChangePassword) {
        setUserId(data.user.id);
        setMustChange(true);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.password.length < 8) { setError('Minimum 8 caractères'); return; }
    if (newPassword.password !== newPassword.confirm) { setError('Les mots de passe ne correspondent pas'); return; }

    setChangingPass(true); setError('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPassword.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur'); return; }
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally { setChangingPass(false); }
  };

  // Force password change screen
  if (mustChange) {
    return (
      <div>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Changement de mot de passe requis</h1>
          <p className="text-slate-500 text-sm mt-1">
            Votre administrateur vous demande de définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nouveau mot de passe</label>
            <input type="password" required minLength={8}
              value={newPassword.password}
              onChange={e => setNewPassword(p => ({ ...p, password: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Minimum 8 caractères" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmer le mot de passe</label>
            <input type="password" required
              value={newPassword.confirm}
              onChange={e => setNewPassword(p => ({ ...p, confirm: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Répétez le mot de passe" />
          </div>
          <button type="submit" disabled={changingPass}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition shadow-sm shadow-blue-500/20">
            {changingPass ? 'Mise à jour...' : 'Définir mon mot de passe'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Connexion</h1>
      <p className="text-slate-500 text-sm mb-7">Accédez à votre espace de prospection</p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              placeholder="vous@entreprise.com" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type={showPass ? 'text' : 'password'} required value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              placeholder="••••••••" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition shadow-sm shadow-blue-500/20">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">Créer un compte</Link>
      </p>
    </div>
  );
}
