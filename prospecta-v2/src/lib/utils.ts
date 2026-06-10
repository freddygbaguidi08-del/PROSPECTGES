// @ts-nocheck
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const fmt = {
  date: (d) => format(new Date(d), 'dd MMM yyyy', { locale: fr }),
  relative: (d) => formatDistanceToNow(new Date(d), { addSuffix: true, locale: fr }),
  currency: (n, c = 'EUR') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c }).format(Number(n) || 0),
  number: (n) => new Intl.NumberFormat('fr-FR').format(Number(n) || 0),
  percent: (n) => `${n}%`,
  initials: (name) => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
};

export const scoreColor = (score) => {
  const s = Number(score) || 0;
  if (s >= 80) return 'score-high';
  if (s >= 60) return 'score-mid';
  if (s >= 40) return 'score-low';
  return 'score-zero';
};

export const STATUS = {
  NEW: { label: 'Nouveau', cls: 'status-new' },
  CONTACTED: { label: 'Contacté', cls: 'status-contacted' },
  QUALIFIED: { label: 'Qualifié', cls: 'status-qualified' },
  UNQUALIFIED: { label: 'Non qualifié', cls: 'status-unqualified' },
  CUSTOMER: { label: 'Client', cls: 'status-customer' },
  CHURNED: { label: 'Churné', cls: 'status-churned' },
} as Record<string, { label: string; cls: string }>;

export const CAMPAIGN_STATUS = {
  DRAFT: { label: 'Brouillon', cls: 'status-draft' },
  RUNNING: { label: 'En cours', cls: 'status-running' },
  PAUSED: { label: 'Pausé', cls: 'status-paused' },
  COMPLETED: { label: 'Terminé', cls: 'status-completed' },
} as Record<string, { label: string; cls: string }>;

export const DEAL_STAGES = [
  { key: 'LEAD', label: 'Lead', prob: 10 },
  { key: 'QUALIFIED', label: 'Qualifié', prob: 25 },
  { key: 'PROPOSAL', label: 'Proposition', prob: 50 },
  { key: 'NEGOTIATION', label: 'Négociation', prob: 75 },
  { key: 'CLOSED_WON', label: '✓ Gagné', prob: 100 },
  { key: 'CLOSED_LOST', label: 'Perdu', prob: 0 },
];

export const dealStageColor = (stage) => {
  const map = {
    LEAD: 'rgba(255,255,255,.08)',
    QUALIFIED: 'rgba(59,130,246,.2)',
    PROPOSAL: 'rgba(251,191,36,.15)',
    NEGOTIATION: 'rgba(249,115,22,.15)',
    CLOSED_WON: 'rgba(74,222,128,.15)',
    CLOSED_LOST: 'rgba(248,113,113,.12)',
  };
  return map[stage] || 'rgba(255,255,255,.06)';
};

export const calcScore = (data) => {
  let score = 0;
  if (data.email) score += 10;
  if (data.phone) score += 8;
  if (data.company) score += 8;
  if (data.linkedinUrl) score += 6;
  if (data.country) score += 4;
  if (data.industry) score += 4;
  const title = (data.jobTitle || '').toLowerCase();
  const senior = ['ceo','cto','coo','cfo','vp','director','head','chief','founder','president','owner'];
  if (senior.some(k => title.includes(k))) score += 40;
  else if (title.includes('manager') || title.includes('lead')) score += 20;
  else if (title) score += 8;
  if (data.companySize && ['51-200','201-500','501-1000','1001+'].includes(data.companySize)) score += 20;
  else if (data.companySize) score += 10;
  return Math.min(100, score);
};
