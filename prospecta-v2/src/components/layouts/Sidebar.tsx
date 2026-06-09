// @ts-nocheck
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Mail, Kanban, BarChart3, Settings, LogOut, Inbox, Search, Shield, Zap } from 'lucide-react';
import { cn, fmt } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/prospects', label: 'Prospects', icon: Users },
  { href: '/search', label: 'Recherche', icon: Search },
  { href: '/campaigns', label: 'Campagnes', icon: Mail },
  { href: '/inbox', label: "Boîte d'envoi", icon: Inbox },
  { href: '/pipeline', label: 'Pipeline CRM', icon: Kanban },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-60 bg-slate-950 flex flex-col h-full shrink-0 border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-tight leading-tight block">NOF PROSPECT</span>
            <span className="text-blue-400 text-xs font-semibold tracking-widest">PROD</span>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2 truncate">{user?.orgName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Admin link */}
        {user?.role === 'ADMIN' && (
          <div className="pt-3 mt-2 border-t border-slate-800">
            <Link href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/admin')
                  ? 'bg-red-600 text-white'
                  : 'text-red-400 hover:text-white hover:bg-red-900/30'
              )}>
              <Shield className="w-4 h-4 shrink-0" />
              Espace Admin
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name ? fmt.initials(user.name) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role || 'USER'}</p>
          </div>
          <button onClick={logout} className="text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100" title="Déconnexion">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
