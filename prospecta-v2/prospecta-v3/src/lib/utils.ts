import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const fmt = {
  date: (d: string | Date) => format(new Date(d), 'dd MMM yyyy', { locale: fr }),
  relative: (d: string | Date) => formatDistanceToNow(new Date(d), { addSuffix: true, locale: fr }),
  currency: (n: number, c = 'EUR') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c }).format(n),
  number: (n: number) => new Intl.NumberFormat('fr-FR').format(n),
  percent: (n: number) => `${n}%`,
  initials: (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
};

export const scoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 ring-emerald-200';
  if (score >= 60) return 'text-blue-700 bg-blue-50 ring-blue-200';
  if (score >= 40) return 'text-amber-700 bg-amber-50 ring-amber-200';
  return 'text-slate-500 bg-slate-100 ring-slate-200';
};

export const STATUS = {
  NEW: { label: 'Nouveau', color: 'bg-blue-100 text-blue-700' },
  CONTACTED: { label: 'Contacté', color: 'bg-amber-100 text-amber-700' },
  QUALIFIED: { label: 'Qualifié', color: 'bg-emerald-100 text-emerald-700' },
  UNQUALIFIED: { label: 'Non qualifié', color: 'bg-slate-100 text-slate-500' },
  CUSTOMER: { label: 'Client', color: 'bg-purple-100 text-purple-700' },
  CHURNED: { label: 'Churné', color: 'bg-red-100 text-red-600' },
} as Record<string, { label: string; color: string }>;

export const CAMPAIGN_STATUS = {
  DRAFT: { label: 'Brouillon', color: 'bg-slate-100 text-slate-600' },
  RUNNING: { label: 'En cours', color: 'bg-emerald-100 text-emerald-700' },
  PAUSED: { label: 'Pausé', color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Terminé', color: 'bg-blue-100 text-blue-700' },
} as Record<string, { label: string; color: string }>;

export const DEAL_STAGES = [
  { key: 'LEAD', label: 'Lead', color: 'bg-slate-100', prob: 10 },
  { key: 'QUALIFIED', label: 'Qualifié', color: 'bg-blue-100', prob: 25 },
  { key: 'PROPOSAL', label: 'Proposition', color: 'bg-amber-100', prob: 50 },
  { key: 'NEGOTIATION', label: 'Négociation', color: 'bg-orange-100', prob: 75 },
  { key: 'CLOSED_WON', label: '✓ Gagné', color: 'bg-emerald-100', prob: 100 },
  { key: 'CLOSED_LOST', label: 'Perdu', color: 'bg-red-100', prob: 0 },
];

export function calcScore(data: {
  email?: string; phone?: string; company?: string; jobTitle?: string;
  linkedinUrl?: string; country?: string; industry?: string; companySize?: string;
}): number {
  let score = 0;
  if (data.email) score += 10;
  if (data.phone) score += 8;
  if (data.company) score += 8;
  if (data.linkedinUrl) score += 6;
  if (data.country) score += 4;
  if (data.industry) score += 4;
  const title = (data.jobTitle ?? '').toLowerCase();
  const senior = ['ceo','cto','coo','cfo','vp','director','head','chief','founder','president','owner'];
  if (senior.some(k => title.includes(k))) score += 40;
  else if (title.includes('manager') || title.includes('lead')) score += 20;
  else if (title) score += 8;
  if (data.companySize && ['51-200','201-500','501-1000','1001+'].includes(data.companySize)) score += 20;
  else if (data.companySize) score += 10;
  return Math.min(100, score);
}
