// @ts-nocheck
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fmt } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', emoji: '⚡' },
  { href: '/prospects', label: 'Prospects', emoji: '👥' },
  { href: '/search', label: 'Recherche', emoji: '🔍' },
  { href: '/campaigns', label: 'Campagnes', emoji: '📧' },
  { href: '/inbox', label: "Envois", emoji: '📤' },
  { href: '/pipeline', label: 'Pipeline', emoji: '💼' },
  { href: '/analytics', label: 'Analytics', emoji: '📊' },
  { href: '/settings', label: 'Paramètres', emoji: '⚙️' },
];

export function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/login'); router.refresh();
  };

  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: 'rgba(255,255,255,.04)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderRight: '0.5px solid rgba(255,255,255,.08)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '0.5px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 4px 12px rgba(59,130,246,.35)',
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f9ff', letterSpacing: '-.2px', lineHeight: 1.2 }}>NOF PROSPECT</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#60a5fa', letterSpacing: '2px' }}>PROD</div>
          </div>
        </div>
        {user?.orgName && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.orgName}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ href, label, emoji }) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: active ? 600 : 400,
              color: active ? '#f0f9ff' : 'rgba(255,255,255,.5)',
              background: active ? 'rgba(59,130,246,.25)' : 'transparent',
              border: active ? '0.5px solid rgba(59,130,246,.35)' : '0.5px solid transparent',
              textDecoration: 'none',
              transition: 'all 150ms ease',
              letterSpacing: '-.2px',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#f0f9ff'; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.5)'; } }}
            >
              <span style={{ fontSize: 15 }}>{emoji}</span>
              {label}
            </Link>
          );
        })}

        {/* Admin */}
        {user?.role === 'ADMIN' && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '8px 4px' }} />
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: pathname.startsWith('/admin') ? 600 : 400,
              color: pathname.startsWith('/admin') ? '#f87171' : 'rgba(248,113,113,.6)',
              background: pathname.startsWith('/admin') ? 'rgba(248,113,113,.15)' : 'transparent',
              border: pathname.startsWith('/admin') ? '0.5px solid rgba(248,113,113,.3)' : '0.5px solid transparent',
              textDecoration: 'none',
              transition: 'all 150ms ease',
            }}>
              <span style={{ fontSize: 15 }}>🛡️</span>
              Espace Admin
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div style={{ padding: '8px', borderTop: '0.5px solid rgba(255,255,255,.06)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 10,
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 30, height: 30, flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            {user?.name ? fmt.initials(user.name) : 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f9ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{user?.role || 'USER'}</div>
          </div>
          <button onClick={logout} title="Déconnexion" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.25)', fontSize: 14, padding: 2, transition: 'color 150ms' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.25)'}
          >✕</button>
        </div>
      </div>
    </aside>
  );
}
