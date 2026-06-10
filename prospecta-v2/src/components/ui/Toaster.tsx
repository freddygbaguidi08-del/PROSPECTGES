// @ts-nocheck
'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast { id: string; message: string; type: ToastType; }

let toasts: Toast[] = [];
const listeners: Array<(t: Toast[]) => void> = [];
const notify = () => listeners.forEach(l => l([...toasts]));

export const toast = {
  success: (message: string, ms = 4000) => add(message, 'success', ms),
  error: (message: string, ms = 5000) => add(message, 'error', ms),
  warning: (message: string, ms = 4000) => add(message, 'warning', ms),
  info: (message: string, ms = 4000) => add(message, 'info', ms),
};

function add(message: string, type: ToastType, ms: number) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => { toasts = toasts.filter(t => t.id !== id); notify(); }, ms);
}

const iconMap = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const colorMap = {
  success: { bg: 'rgba(74,222,128,.12)', border: 'rgba(74,222,128,.3)', icon: '#4ade80' },
  error: { bg: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.3)', icon: '#f87171' },
  warning: { bg: 'rgba(251,191,36,.12)', border: 'rgba(251,191,36,.3)', icon: '#fbbf24' },
  info: { bg: 'rgba(59,130,246,.12)', border: 'rgba(59,130,246,.3)', icon: '#60a5fa' },
};

export function Toaster() {
  const [active, setActive] = useState<Toast[]>([]);
  useEffect(() => {
    const fn = (t: Toast[]) => setActive(t);
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1); };
  }, []);

  const dismiss = useCallback((id: string) => { toasts = toasts.filter(t => t.id !== id); notify(); }, []);

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360, pointerEvents: 'none' }}>
      {active.map(t => {
        const Icon = iconMap[t.type];
        const c = colorMap[t.type];
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 14px',
            background: c.bg,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,.5)',
            pointerEvents: 'all',
            animation: 'slideInRight .3s ease-out',
          }}>
            <Icon style={{ width: 16, height: 16, color: c.icon, marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#f0f9ff', flex: 1, lineHeight: '1.5' }}>{t.message}</p>
            <button onClick={() => dismiss(t.id)} style={{ color: 'rgba(255,255,255,.4)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
