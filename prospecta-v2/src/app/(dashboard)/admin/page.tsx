// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { Users, Mail, TrendingUp, Shield, Trash2, ChevronDown, Plus, Edit2, X, Key, RefreshCw } from 'lucide-react';
import { fmt, cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

const ROLES = ['ADMIN', 'USER', 'VIEWER'];
const roleColors = {
  ADMIN: 'bg-red-100 text-red-700',
  USER: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-slate-100 text-slate-600',
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'USER', orgName: '', mustChangePassword: true };

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'USER' });
  const [resetPassword, setResetPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setUsers(data.data?.users ?? []);
    setStats(data.data?.globalStats ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.warning('Nom, email et mot de passe requis'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`✅ Utilisateur ${form.name} créé`);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      load();
    } else {
      toast.error(data.error || 'Erreur');
    }
    setSaving(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: editUser.id, action: 'update', ...editForm }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Utilisateur mis à jour');
      setEditUser(null);
      load();
    } else {
      toast.error(data.error || 'Erreur');
    }
    setSaving(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetPassword || resetPassword.length < 8) { toast.warning('Minimum 8 caractères'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetUser.id, action: 'reset_password', newPassword: resetPassword }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Mot de passe réinitialisé — l\'utilisateur devra le changer');
      setResetUser(null);
      setResetPassword('');
    } else {
      toast.error(data.error || 'Erreur');
    }
    setSaving(false);
  };

  const handleAction = async (userId, action, extra = {}) => {
    const labels = { delete: 'Supprimer', force_password_change: 'Forcer changement MDP', change_role: 'Changer le rôle' };
    if (action === 'delete' && !window.confirm('Supprimer cet utilisateur et toutes ses données ?')) return;

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    const data = await res.json();
    if (data.success) { toast.success(data.message); load(); }
    else toast.error(data.error || 'Erreur');
  };

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Shield className="w-12 h-12 text-red-300 mx-auto mb-3" />
        <h2 className="font-bold text-slate-900 text-lg">Accès refusé</h2>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Espace Admin</h1>
            <p className="text-sm text-slate-500">Gestion des utilisateurs · NOF PROSPECT PROD</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load()} className="btn-secondary p-2.5">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Créer un utilisateur
          </button>
        </div>
      </div>

      {/* Global stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Utilisateurs', value: stats.total_users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Prospects', value: stats.total_prospects, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Campagnes', value: stats.total_campaigns, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Emails', value: stats.total_emails, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Deals gagnés', value: stats.total_deals_won, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{fmt.number(Number(s.value))}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Utilisateurs ({users.length})</h2>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Utilisateur', 'Organisation', 'Rôle', 'Prospects', 'Emails', 'Inscrit le', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            {u.must_change_password && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">MDP requis</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm">{u.org_name}</td>
                    <td className="px-4 py-3.5">
                      <div className="relative group/role">
                        <button className={cn('badge cursor-pointer hover:opacity-80 flex items-center gap-1', roleColors[u.role] ?? 'bg-slate-100 text-slate-600')}>
                          {u.role} <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute left-0 top-8 bg-white rounded-xl shadow-xl border border-slate-200 z-20 py-1 w-28 hidden group-hover/role:block">
                          {ROLES.map(r => (
                            <button key={r} onClick={() => handleAction(u.id, 'change_role', { role: r })}
                              className={cn('w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition', u.role === r ? 'font-bold text-blue-600' : 'text-slate-700')}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-600">{u.prospects_count}</td>
                    <td className="px-4 py-3.5 text-center text-slate-600">{u.emails_count}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{fmt.date(u.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditUser(u); setEditForm({ name: u.name, email: u.email, role: u.role }); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setResetUser(u); setResetPassword(''); }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Réinitialiser MDP">
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleAction(u.id, 'force_password_change')}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Forcer changement MDP">
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleAction(u.id, 'delete')}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Roles info */}
      <div className="card p-5 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-3">Rôles & permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { role: 'ADMIN', desc: 'Accès complet + espace admin + gestion des utilisateurs', color: 'border-red-200 bg-red-50' },
            { role: 'USER', desc: 'Accès complet à toutes les fonctionnalités de prospection', color: 'border-blue-200 bg-blue-50' },
            { role: 'VIEWER', desc: 'Lecture seule — ne peut pas créer ni modifier', color: 'border-slate-200 bg-white' },
          ].map(r => (
            <div key={r.role} className={cn('rounded-xl border p-3', r.color)}>
              <span className={cn('badge mb-2', roleColors[r.role])}>{r.role}</span>
              <p className="text-xs text-slate-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Créer un utilisateur</h3>
                <p className="text-sm text-slate-500 mt-0.5">Les identifiants seront envoyés à l&apos;utilisateur</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { key: 'name', label: 'Nom complet *', type: 'text', placeholder: 'Jean Dupont' },
                { key: 'email', label: 'Email *', type: 'email', placeholder: 'jean@entreprise.com' },
                { key: 'password', label: 'Mot de passe temporaire *', type: 'password', placeholder: 'Minimum 8 caractères' },
                { key: 'orgName', label: 'Organisation', type: 'text', placeholder: 'NOF PROSPECT PROD' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="input" placeholder={f.placeholder} required={f.label.includes('*')} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Rôle</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer">
                <input type="checkbox" checked={form.mustChangePassword}
                  onChange={e => setForm(p => ({ ...p, mustChangePassword: e.target.checked }))}
                  className="w-4 h-4 rounded accent-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Forcer le changement de mot de passe</p>
                  <p className="text-xs text-amber-600">L&apos;utilisateur devra changer son MDP à la première connexion</p>
                </div>
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Création...' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 text-lg">Modifier — {editUser.name}</h3>
              <button onClick={() => setEditUser(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              {[
                { key: 'name', label: 'Nom complet', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{f.label}</label>
                  <input type={f.type} value={editForm[f.key]} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} className="input" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Rôle</label>
                <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className="input">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditUser(null)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 text-lg">Réinitialiser MDP</h3>
              <button onClick={() => setResetUser(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Définissez un nouveau mot de passe temporaire pour <strong>{resetUser.name}</strong>. L&apos;utilisateur devra le changer à sa prochaine connexion.
            </p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nouveau mot de passe</label>
                <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                  className="input" placeholder="Minimum 8 caractères" required minLength={8} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setResetUser(null)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center bg-amber-600 hover:bg-amber-700">
                  {saving ? '...' : 'Réinitialiser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
