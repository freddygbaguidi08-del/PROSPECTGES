'use client';
import { useState } from 'react';
import { Search, Plus, Download, Building2, Globe, Mail, MapPin, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  address?: string;
  phone?: string;
  sector?: string;
  source?: string;
  confidence?: number;
}

const SECTORS = [
  'Marketing Digital', 'Développement Web', 'E-commerce', 'Consulting',
  'Immobilier', 'Finance', 'Santé', 'Éducation', 'Restauration',
  'Hôtellerie', 'Transport', 'Industrie', 'Retail', 'Telecom',
  'RH & Recrutement', 'Architecture', 'Juridique', 'Comptabilité',
];

const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Sénégal', 'Côte d\'Ivoire', 'Bénin'];

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'prospects' | 'companies'>('companies');
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');

  const handleSearch = async () => {
    setLoading(true); setResults([]); setSelected(new Set());
    const params = new URLSearchParams({
      q: query, sector, city, country, type: searchType,
    });
    const res = await fetch(`/api/search/prospects?${params}`);
    const data = await res.json() as { data: SearchResult[] };
    setResults(data.data ?? []);
    setLoading(false);
  };

  const toggleSelect = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i); else next.add(i);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map((_, i) => i)));
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    const toImport = Array.from(selected).map(i => results[i]);
    const res = await fetch('/api/search/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospects: toImport }),
    });
    const data = await res.json() as { imported?: number; duplicates?: number; error?: string };
    if (data.imported !== undefined) {
      setImportResult(`✅ ${data.imported} prospect(s) importé(s) · ${data.duplicates} doublon(s)`);
      setSelected(new Set());
    } else {
      setImportResult('❌ ' + data.error);
    }
    setImporting(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recherche de prospects</h1>
        <p className="text-sm text-slate-500 mt-0.5">Trouvez de nouveaux clients potentiels et importez-les</p>
      </div>

      {/* Search panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        {/* Type toggle */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'companies', label: '🏢 Chercher des entreprises', desc: 'Via Google Maps (gratuit)' },
            { key: 'prospects', label: '👤 Chercher des emails', desc: 'Via Hunter.io (25/mois gratuit)' },
          ].map(t => (
            <button key={t.key} onClick={() => setSearchType(t.key as any)}
              className={cn('flex-1 p-3 rounded-xl border text-left transition',
                searchType === t.key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300')}>
              <p className={cn('text-sm font-semibold', searchType === t.key ? 'text-blue-700' : 'text-slate-700')}>{t.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {searchType === 'companies' ? (
            <>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Secteur d&apos;activité</label>
                <select value={sector} onChange={e => setSector(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                  <option value="">Tous les secteurs</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ville</label>
                <input value={city} onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Paris, Lyon..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pays</label>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Domaine ou site web</label>
                <input value={query} onChange={e => setQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="exemple.com ou nom d'entreprise" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Secteur</label>
                <select value={sector} onChange={e => setSector(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                  <option value="">Tous</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pays</label>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        <button onClick={handleSearch} disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
          <Search className="w-4 h-4" />
          {loading ? 'Recherche en cours...' : 'Lancer la recherche'}
        </button>

        {/* API keys info */}
        <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs font-medium text-amber-800">⚠️ Pour activer la recherche externe :</p>
          <div className="mt-1 space-y-1 text-xs text-amber-700">
            <p>• <strong>Google Maps</strong> : ajoutez <code>GOOGLE_MAPS_API_KEY</code> sur Vercel → <a href="https://console.cloud.google.com" target="_blank" className="underline">console.cloud.google.com</a> (gratuit 200$/mois)</p>
            <p>• <strong>Hunter.io</strong> : ajoutez <code>HUNTER_API_KEY</code> → <a href="https://hunter.io" target="_blank" className="underline">hunter.io</a> (25 recherches/mois gratuit)</p>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={selected.size === results.length} onChange={selectAll} className="rounded" />
              <span className="text-sm font-semibold text-slate-900">{results.length} résultat(s)</span>
              {selected.size > 0 && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                  {selected.size} sélectionné(s)
                </span>
              )}
            </div>
            {selected.size > 0 && (
              <button onClick={handleImport} disabled={importing}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition">
                <Download className="w-4 h-4" />
                {importing ? 'Import...' : `Importer ${selected.size} prospect(s)`}
              </button>
            )}
          </div>

          {importResult && (
            <div className={cn('mx-5 mt-4 p-3 rounded-xl text-sm', importResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
              {importResult}
            </div>
          )}

          <div className="divide-y divide-slate-50">
            {results.map((r, i) => (
              <div key={i} className="px-5 py-4 hover:bg-slate-50/50 transition flex items-start gap-3">
                <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} className="rounded mt-1" />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                  {searchType === 'companies' ? (
                    <Building2 className="w-5 h-5 text-slate-500" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {(r.firstName || r.company || '?')[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {searchType === 'prospects' ? (
                    <>
                      <p className="text-sm font-semibold text-slate-900">{r.firstName} {r.lastName}</p>
                      <p className="text-xs text-slate-500">{r.jobTitle} · {r.company}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {r.email && (
                          <span className="flex items-center gap-1 text-xs text-blue-600">
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
                      <p className="text-sm font-semibold text-slate-900">{r.company}</p>
                      {r.sector && <p className="text-xs text-blue-600 font-medium">{r.sector}</p>}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {r.address && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" /> {r.address}
                          </span>
                        )}
                        {r.website && (
                          <a href={r.website} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <Globe className="w-3 h-3" /> Site web
                          </a>
                        )}
                        {r.phone && (
                          <span className="text-xs text-slate-500">{r.phone}</span>
                        )}
                      </div>
                    </>
                  )}
                  {r.source && (
                    <span className="text-xs text-slate-300 mt-1 block">Source: {r.source}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 py-16 text-center">
          <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">Lancez une recherche</h3>
          <p className="text-sm text-slate-400 mt-1">Sélectionnez un secteur et une ville pour trouver des prospects</p>
        </div>
      )}
    </div>
  );
}
