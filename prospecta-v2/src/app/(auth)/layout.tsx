// @ts-nocheck
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-white tracking-tight block leading-tight">NOF PROSPECT</span>
              <span className="text-blue-400 text-sm font-bold tracking-widest">PROD</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Plateforme B2B de prospection commerciale</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
