'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (toasts: Toast[]) => void;

// Global toast state
let toasts: Toast[] = [];
const listeners: ToastListener[] = [];

const notify = () => listeners.forEach(l => l([...toasts]));

export const toast = {
  success: (message: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, message, type: 'success', duration }];
    notify();
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); notify(); }, duration);
  },
  error: (message: string, duration = 5000) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, message, type: 'error', duration }];
    notify();
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); notify(); }, duration);
  },
  warning: (message: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, message, type: 'warning', duration }];
    notify();
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); notify(); }, duration);
  },
  info: (message: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, message, type: 'info', duration }];
    notify();
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); notify(); }, duration);
  },
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export function Toaster() {
  const [activeToasts, setActiveToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast[]) => setActiveToasts(t);
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {activeToasts.map(t => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-sm pointer-events-auto',
              'animate-in slide-in-from-right-full duration-300',
              styles[t.type]
            )}
          >
            <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconStyles[t.type])} />
            <p className="text-sm font-medium flex-1 leading-relaxed">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
