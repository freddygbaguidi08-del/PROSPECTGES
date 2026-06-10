// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { fmt, STATUS, DEAL_STAGES } from '@/lib/utils';

const glass = { background:'rgba(255,255,255,.06)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)', border:'0.5px solid rgba(255,255,255,.10)', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.4)' };

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => {
      setData(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const kpis = [
    { label:'Prospects total', value:fmt.number(Number(data?.prospects?.total??0)), sub:`Score moyen: ${data?.prospects?.avg_score??0}/100`, color:'#3b82f6' },
    { label:'Ce mois', value:fmt.number(Number(data?.prospects?.this_month??0)), sub:'Nouveaux prospects', color:'#60a5fa' },
    { label:'Campagnes actives', value:String(data?.campaigns?.running??0), sub:`${data?.campaigns?.total??0} campagnes total`, color:'#4ade80' },
    { label:'Pipeline', value:fmt.currency(Number(data?.deals?.pipeline??0)), sub:`${fmt.currency(Number(data?.deals?.won_value??0))} gagnés`, color:'#fbbf24' },
  ];

  const byStatus = Array.isArray(data?.prospectsByStatus) ? data.prospectsByStatus : [];
  const recent = Array.isArray(data?.recentProspects) ? data.recentProspects : [];
  const totalPros = Number(data?.prospects?.total??1);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, color:'#f0f9ff', letterSpacing:'-.3px' }}>◎ Analytics</h1>
        <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:4 }}>Tableau de bord de performance commerciale</p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...glass, padding:20 }}>
            {loading ? <div style={{ height:28, background:'rgba(255,255,255,.06)', borderRadius:6, marginBottom:8 }} /> : (
              <div style={{ fontSize:26, fontWeight:800, color:k.color, letterSpacing:'-.5px' }}>{k.value}</div>
            )}
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.5px', marginTop:6 }}>{k.label}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Status breakdown */}
        <div style={{ ...glass, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#f0f9ff', marginBottom:16 }}>Répartition par statut</div>
          {loading ? <div style={{ height:120, background:'rgba(255,255,255,.03)', borderRadius:9 }} /> :
            byStatus.length === 0 ? <p style={{ color:'rgba(255,255,255,.3)', fontSize:12, textAlign:'center', padding:'24px 0' }}>Aucune donnée</p> :
            byStatus.map((s,i) => {
              const pct = Math.round((Number(s.count)/totalPros)*100);
              const cfg = STATUS[s.status] ?? { label:s.status, cls:'' };
              return (
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <span className={`badge ${cfg.cls}`} style={{ fontSize:11 }}>{cfg.label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'#f0f9ff' }}>{s.count} <span style={{ color:'rgba(255,255,255,.3)', fontWeight:400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height:5, background:'rgba(255,255,255,.07)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#3b82f6,#60a5fa)', borderRadius:4, transition:'width .5s ease' }} />
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* Recent prospects */}
        <div style={{ ...glass, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#f0f9ff' }}>Derniers prospects</div>
            <a href="/prospects" style={{ fontSize:11, color:'#60a5fa', textDecoration:'none', fontWeight:600 }}>Voir tous →</a>
          </div>
          {loading ? <div style={{ height:120, background:'rgba(255,255,255,.03)', borderRadius:9 }} /> :
            recent.length === 0 ? <p style={{ color:'rgba(255,255,255,.3)', fontSize:12, textAlign:'center', padding:'24px 0' }}>Aucun prospect</p> :
            recent.map((p,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 8px', borderRadius:9, marginBottom:4 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#f0f9ff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>{p.company||'—'}</div>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:'#f0f9ff', flexShrink:0 }}>{p.score}<span style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>/100</span></div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Pipeline stages */}
      <div style={{ ...glass, padding:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#f0f9ff', marginBottom:16 }}>État du pipeline</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
          {DEAL_STAGES.map(s => (
            <div key={s.key} style={{ background:'rgba(255,255,255,.04)', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:10, padding:'12px 10px', textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.label}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{s.prob}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
