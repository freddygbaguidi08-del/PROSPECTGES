// @ts-nocheck
import { SpaceBackground } from '@/components/ui/SpaceBackground';

export default function AuthLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>
      <SpaceBackground />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
            boxShadow: '0 8px 32px rgba(59,130,246,.4)',
          }}>⚡</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f9ff', letterSpacing: '-.2px' }}>NOF PROSPECT</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', letterSpacing: '3px', marginTop: 2 }}>PROD</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 8 }}>Plateforme B2B de prospection commerciale</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,.06)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '0.5px solid rgba(255,255,255,.10)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,.4), 0 1px 0 rgba(255,255,255,.08) inset',
          padding: 32,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
