// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { Mail, MailOpen, Send, X, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { fmt, cn } from '@/lib/utils';

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  open_count: number;
  sent_at: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  campaign_name?: string;
}

interface Stats {
  total: string;
  opened: string;
  sent: string;
}

export default function InboxPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showSend, setShowSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sendResult, setSendResult] = useState('');

  const [email, setEmail] = useState({
    to: '', toName: '', subject: '', body: '', fromName: '', fromEmail: '',
  });
  const [aiConfig, setAiConfig] = useState({
    prospectName: '', company: '', jobTitle: '', goal: 'Obtenir un RDV de 20 minutes', tone: 'friendly', language: 'fr',
  });

  const load = async (f = filter) => {
    setLoading(true);
    const res = await fetch(`/api/inbox?filter=${f}`);
    const data = await res.json() as { data: EmailLog[]; stats: Stats };
    setLogs(data.data ?? []);
    setStats(data.stats ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setSendResult('');
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    });
    const data = await res.json() as { success?: boolean; error?: string; demo?: boolean; message?: string };
    if (data.success) {
      setSendResult(data.demo ? '✅ ' + data.message : '✅ Email envoyé avec succès !');
      setEmail({ to: '', toName: '', subject: '', body: '', fromName: '', fromEmail: '' });
      load();
    } else {
      setSendResult('❌ ' + data.error);
    }
    setSending(false);
  };

  const generateAI = async () => {
    setAiLoading(true);
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        prospectName: aiConfig.prospectName,
        company: aiConfig.company,
        jobTitle: aiConfig.jobTitle,
        goal: aiConfig.goal,
        tone: aiConfig.tone,
        language: aiConfig.language,
      }),
    });
    const data = await res.json() as { data?: { subject: string; body: string } };
    if (data.data) {
      setEmail(p => ({ ...p, subject: data.data!.subject, body: data.data!.body }));
    }
    setAiLoading(false);
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    SENT: { label: 'Envoyé', color: 'bg-blue-50 text-blue-700', icon: Mail },
    OPENED: { label: 'Ouvert', color: 'bg-emerald-50 text-emerald-700', icon: MailOpen },
    CLICKED: { label: 'Cliqué', color: 'bg-purple-50 text-purple-700', icon: MailOpen },
    BOUNCED: { label: 'Rebond', color: 'bg-red-50 text-red-600', icon: Mail },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Boîte d&apos;envoi</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats ? `${stats.total} emails · ${stats.opened} ouverts` : 'Chargement...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load()} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowSend(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            <Send className="w-4 h-4" /> Envoyer un email
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total envoyés', value: stats.total, color: 'blue' },
            { label: 'Ouverts', value: stats.opened, color: 'emerald' },
            { label: 'Taux ouverture', value: Number(stats.total) > 0 ? `${Math.round((Number(stats.opened) / Number(stats.total)) * 100)}%` : '0%', color: 'purple' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 text-${s.color}-600`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Tous' },
          { key: 'sent', label: 'Envoyés' },
          { key: 'opened', label: 'Ouverts' },
        ].map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); load(f.key); }}
            className={cn('px-3 py-1.5 rounded-xl text-sm font-medium transition',
              filter === f.key ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Email list */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-4">
                <div className="w-9 h-9 bg-slate-100 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <Mail className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">Aucun email</h3>
            <p className="text-sm text-slate-400 mt-1 mb-5">Envoyez votre premier email de prospection</p>
            <button onClick={() => setShowSend(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              Envoyer un email
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map(log => {
              const cfg = statusConfig[log.status] ?? statusConfig.SENT;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="px-5 py-4 hover:bg-slate-50/50 transition flex items-center gap-4">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', cfg.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-900 truncate">{log.subject}</p>
                      <span className={cn('shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium', cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>À: {log.first_name ? `${log.first_name} ${log.last_name}` : log.to_email}</span>
                      {log.company && <span>· {log.company}</span>}
                      {log.campaign_name && <span className="text-blue-500">· {log.campaign_name}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {log.open_count > 0 && (
                      <p className="text-xs font-medium text-emerald-600">{log.open_count} vue(s)</p>
                    )}
                    <p className="text-xs text-slate-400">{log.sent_at ? fmt.relative(log.sent_at) : '—'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send email modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Envoyer un email</h3>
              <button onClick={() => { setShowSend(false); setSendResult(''); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* AI Generator */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">Générer avec IA</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { key: 'prospectName', label: 'Nom du prospect', placeholder: 'Jean Martin' },
                    { key: 'company', label: 'Entreprise', placeholder: 'Acme Corp' },
                    { key: 'jobTitle', label: 'Poste', placeholder: 'Directeur Commercial' },
                    { key: 'goal', label: 'Objectif', placeholder: 'RDV 20 min' },
                  ].map(f => (
                    <div key={f.key} className={f.key === 'goal' ? 'col-span-2' : ''}>
                      <label className="block text-xs font-medium text-blue-800 mb-1">{f.label}</label>
                      <input value={(aiConfig as any)[f.key]}
                        onChange={e => setAiConfig(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded-lg bg-white focus:outline-none"
                        placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select value={aiConfig.tone} onChange={e => setAiConfig(p => ({ ...p, tone: e.target.value }))}
                    className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white flex-1">
                    <option value="friendly">Amical</option>
                    <option value="formal">Formel</option>
                    <option value="direct">Direct</option>
                  </select>
                  <select value={aiConfig.language} onChange={e => setAiConfig(p => ({ ...p, language: e.target.value }))}
                    className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white flex-1">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                  <button onClick={generateAI} disabled={aiLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex-1 justify-center">
                    <Sparkles className="w-3 h-3" />
                    {aiLoading ? 'Génération...' : 'Générer IA'}
                  </button>
                </div>
              </div>

              {/* Email form */}
              <form onSubmit={handleSend} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">À (email) *</label>
                    <input required type="email" value={email.to}
                      onChange={e => setEmail(p => ({ ...p, to: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="contact@entreprise.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du destinataire</label>
                    <input value={email.toName}
                      onChange={e => setEmail(p => ({ ...p, toName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Jean Martin" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Votre nom</label>
                    <input value={email.fromName}
                      onChange={e => setEmail(p => ({ ...p, fromName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Votre Nom" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Votre email</label>
                    <input type="email" value={email.fromEmail}
                      onChange={e => setEmail(p => ({ ...p, fromEmail: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="vous@entreprise.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Objet *</label>
                  <input required value={email.subject}
                    onChange={e => setEmail(p => ({ ...p, subject: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Objet de l'email..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                  <textarea required value={email.body}
                    onChange={e => setEmail(p => ({ ...p, body: e.target.value }))}
                    rows={8} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    placeholder="Corps de l'email..." />
                </div>

                {sendResult && (
                  <div className={cn('p-3 rounded-xl text-sm', sendResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                    {sendResult}
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowSend(false); setSendResult(''); }}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
                    Annuler
                  </button>
                  <button type="submit" disabled={sending}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
