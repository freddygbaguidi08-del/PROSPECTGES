// @ts-nocheck
'use client';
import { useState } from 'react';
import { Search, Download, Building2, Globe, Mail, MapPin, Sparkles, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

const SECTORS = [
  'Marketing Digital', 'Développement Web', 'E-commerce', 'Consulting',
  'Immobilier', 'Finance & Banque', 'Santé', 'Éducation', 'Restauration',
  'Hôtellerie', 'Transport & Logistique', 'Industrie', 'Retail',
  'RH & Recrutement', 'Architecture', 'Juridique', 'Comptabilité',
  'Assurance', 'BTP & Construction', 'Informatique & SaaS',
];

const COUNTRIES = [
  'France', 'Belgique', 'Suisse', 'Canada', 'Maroc',
  'Sénégal', 'Côte d\'Ivoire', 'Bénin', 'Cameroun', 'Tunisie',
];

export default function SearchPage() {
  const [searchType, setSearchType] = useState('companies');
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [resultType, setResultType] = useState('');

  const handleSearch = async () => {
    if (searchType === 'companies' && !sector && !city && !query) {
      toast.warning('Renseignez au moins un secteur ou une ville');
      return;
    }
    if (searchType === 'prospects' && !query) {
      toast.warning('Renseignez un domaine ou nom d\'entreprise');
      return;
    }

    setLoading(true);
    setResults([]);
    setSelected(new Set());

    const params = new URLSearchParams({ q: query, sector, city, country, type: searchType });
    try {
      const res = await fetch(`/api/search/prospects?${params}`);
      const data = await res.json();
      if (data.error) { toast.error(data.error); setLoading(false); return; }
      setResults(data.data ?? []);
      setResultType(data.type);
      if (data.data?.length === 0) {
        toast.info('Aucun résultat. Essayez d\'autres critères ou configurez vos clés API.');
      } else {
        toast.success(`${data.data.length} résultat(s) trouvé(s)`);
      }
    } catch (e) {
      toast.error('Erreur de recherche: ' + e.message);
    }
    setLoading(false);
  };

  const toggleSelect = (i) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i); else next.add(i);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map((_, i) => i)));
  };

  const handleImport = async () => {
    if (selected.size === 0) { toast.warning('Sélectionnez au moins un élément'); return; }
    setImporting(true);
    try {
      const toImport = Array.from(selected).map(i => results[i]);
      const res = await fetch('/api/search/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects: toImport }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.imported} prospect(s) importé(s) · ${data.duplicates} doublon(s) ignoré(s)`);
        setSelected(new Set());
      } else {
        toast.error(data.error || 'Erreur lors de l\'import');
      }
    } catch (e) {
      toast.error('Erreur: ' + e.message);
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recherche de prospects</h1>
          <p className="text-sm text-slate-500 mt-1">Trouvez de nouveaux clients potentiels et importez-les directement</p>
        </div>
        {results.length > 0 && selected.size > 0 && (
          <button onClick={handleImport} disabled={importing} className="btn-primary">
            <Download className="w-4 h-4" />
            {importing ? 'Import...' : `Importer ${selected.size} sélectionné(s)`}
          </button>
        )}
      </div>

      {/* Search panel */}
      <div className="card p-6">
        {/* Type toggle */}
        <div className="flex gap-3 mb-6">
          {[
            { key: 'companies', icon: Building2, label: 'Entreprises', desc: 'Google Maps · Gratuit' },
            { key: 'prospects', icon: Users, label: 'Contacts & emails', desc: 'Hunter.io · 25/mois gratuit' },
          ].map(t => (
            <button key={t.key} onClick={() => setSearchType(t.key)}
              className={cn(
                'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                searchType === t.key
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm shadow-blue-100'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}>
              <div className={cn('p-2 rounded-lg', searchType === t.key ? 'bg-blue-100' : 'bg-slate-100')}>
                <t.icon className={cn('w-5 h-5', searchType === t.key ? 'text-blue-600' : 'text-slate-500')} />
              </div>
              <div>
                <p className={cn('font-semibold text-sm', searchType === t.key ? 'text-blue-700' : 'text-slate-700')}>{t.label}</p>
                <p className="text-xs text-slate-400">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {searchType === 'companies' ? (
            <>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Secteur d&apos;activité</label>
                <select value={sector} onChange={e => setSector(e.target.value)} className="input">
                  <option value="">Tous les secteurs</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Ville</label>
                <input value={city} onChange={e => setCity(e.target.value)} className="input" placeholder="Paris, Lyon..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Pays</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="input">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Domaine ou site web</label>
                <input value={query} onChange={e => setQuery(e.target.value)} className="input"
                  placeholder="exemple.com" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Secteur</label>
                <select value={sector} onChange={e => setSector(e.target.value)} className="input">
                  <option value="">Tous</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Pays</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="input">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSearch} disabled={loading} className="btn-primary px-6">
            <Search className="w-4 h-4" />
            {loading ? 'Recherche en cours...' : 'Lancer la recherche'}
          </button>
          {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              ⚡ Ajoutez <code className="font-mono">GOOGLE_MAPS_API_KEY</code> sur Vercel pour activer la recherche Google Maps
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={selected.size === results.length && results.length > 0}
                onChange={selectAll} className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
              <div>
                <span className="text-sm font-semibold text-slate-900">{results.length} résultat(s)</span>
                {selected.size > 0 && (
                  <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                    {selected.size} sélectionné(s)
                  </span>
                )}
              </div>
            </div>
            {selected.size > 0 && (
              <button onClick={handleImport} disabled={importing} className="btn-primary text-xs py-2">
                <Download className="w-3.5 h-3.5" />
                {importing ? 'Import...' : `Importer ${selected.size}`}
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-50">
            {results.map((r, i) => (
              <div key={i}
                onClick={() => toggleSelect(i)}
                className={cn(
                  'flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors',
                  selected.has(i) ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
                )}>
                <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer mt-1 shrink-0" />

                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg',
                  resultType === 'prospects' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold' : 'bg-slate-100'
                )}>
                  {resultType === 'prospects'
                    ? (r.firstName || r.company || '?')[0].toUpperCase()
                    : <Building2 className="w-5 h-5 text-slate-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  {resultType === 'prospects' ? (
                    <>
                      <p className="text-sm font-semibold text-slate-900">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.jobTitle} · {r.company}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {r.email && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                            <Mail className="w-3 h-3" /> {r.email}
                          </span>
                        )}
                        {r.confidence && (
                          <span className="text-xs text-slate-400">Fiabilité: {r.confidence}%</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{r.company}</p>
                        {r.rating && (
                          <span className="flex items-center gap-0.5 text-xs text-amber-600">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {r.rating}
                          </span>
                        )}
                      </div>
                      {r.sector && (
                        <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg font-medium mt-1">{r.sector}</span>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {r.address && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" /> {r.address}
                          </span>
                        )}
                        {r.website && (
                          <a href={r.website} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <Globe className="w-3 h-3" /> Site web
                          </a>
                        )}
                      </div>
                    </>
                  )}
                  <span className="text-xs text-slate-300 mt-1 block">via {r.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="card py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-700 text-lg">Lancez votre recherche</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Sélectionnez un secteur et une ville pour trouver des entreprises, ou un domaine pour trouver des emails
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto text-left">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1">🏢 Exemple entreprises</p>
              <p className="text-xs text-blue-600">Secteur: Marketing Digital<br />Ville: Paris · France</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 mb-1">👤 Exemple contacts</p>
              <p className="text-xs text-emerald-600">Domaine: apple.com<br />(nécessite Hunter.io)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
