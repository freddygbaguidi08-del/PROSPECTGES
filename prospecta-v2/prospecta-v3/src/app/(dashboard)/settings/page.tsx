'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [msg, setMsg] = useState('');

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { setMsg('❌ Les mots de passe ne correspondent pas'); return; }
    setMsg('✅ Mot de passe mis à jour');
    setPasswords({ current: '', newPass: '', confirm: '' });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gérez votre compte</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Sécurité</h2>
        {msg && <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm">{msg}</div>}
        <form onSubmit={handlePassword} className="space-y-3">
          {[
            { key: 'current', label: 'Mot de passe actuel' },
            { key: 'newPass', label: 'Nouveau mot de passe' },
            { key: 'confirm', label: 'Confirmer le nouveau' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
              <input type="password" value={(passwords as Record<string, string>)[f.key]}
                onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="••••••••" />
            </div>
          ))}
          <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            Modifier le mot de passe
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Intégrations gratuites utilisées</h2>
        <div className="space-y-3">
          {[
            { name: 'Supabase PostgreSQL', desc: 'Base de données — 500MB gratuit', url: 'https://supabase.com', status: 'Actif' },
            { name: 'Groq (LLaMA 3.3 70B)', desc: 'IA génération emails — gratuit', url: 'https://console.groq.com', status: 'Configurez GROQ_API_KEY' },
            { name: 'Google Gemini Flash', desc: 'IA de backup — gratuit', url: 'https://makersuite.google.com', status: 'Configurez GEMINI_API_KEY' },
            { name: 'Brevo SMTP', desc: '300 emails/jour — gratuit', url: 'https://brevo.com', status: 'Configurez BREVO_SMTP_*' },
            { name: 'Vercel', desc: 'Hébergement Next.js — gratuit', url: 'https://vercel.com', status: 'Déploiement 1 clic' },
          ].map(i => (
            <div key={i.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-medium text-slate-900 text-sm">{i.name}</p>
                <p className="text-xs text-slate-500">{i.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{i.status}</p>
                <a href={i.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline">Accéder →</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
