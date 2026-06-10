// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

async function callGroq(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY non définie sur Vercel');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1500,
      temperature: 0.72,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq ${res.status}: ${txt.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY non définie');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1500, temperature: 0.72 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseJSON(text) {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const obj = cleaned.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  const arr = cleaned.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]); } catch {} }
  throw new Error('Réponse IA non parsable');
}

async function runAI(systemPrompt, userPrompt) {
  // Try Groq first
  try {
    const text = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    return { text, provider: 'Groq LLaMA 3.3 70B' };
  } catch (e) {
    console.error('[AI] Groq error:', e.message);
  }

  // Fallback Gemini
  try {
    const text = await callGemini(`${systemPrompt}\n\n${userPrompt}`);
    return { text, provider: 'Google Gemini 1.5' };
  } catch (e) {
    console.error('[AI] Gemini error:', e.message);
  }

  // Static demo fallback
  return {
    text: JSON.stringify({
      subject: 'Une proposition pour {{company}}',
      body: 'Bonjour {{firstName}},\n\nJe me permets de vous contacter concernant votre activité.\n\nNous accompagnons des entreprises comme {{company}} dans leur développement commercial. Auriez-vous 20 minutes cette semaine pour en discuter ?\n\nCordialement,',
    }),
    provider: 'Modèle de démonstration',
  };
}

export async function POST(req) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Corps invalide' }, { status: 400 }); }

  const { action } = body;

  if (action === 'generate') {
    const {
      prospectName = '',
      company = 'votre entreprise',
      jobTitle = 'Directeur',
      goal = 'Obtenir un rendez-vous de 20 minutes',
      tone = 'friendly',
      language = 'fr',
    } = body;

    const toneMap = {
      friendly: 'amical, chaleureux, humain',
      formal: 'formel, professionnel, courtois',
      direct: 'direct, concis, percutant',
      creative: 'original, créatif, mémorable',
    };

    const isEN = language === 'en';
    const lang = isEN ? 'English' : 'français';
    const senderName = session.name;

    const systemPrompt = isEN
      ? 'You are a senior B2B sales copywriter. You write compelling, highly personalized cold emails that get responses. Reply ONLY with valid JSON, no markdown, no extra text.'
      : 'Tu es un expert en copywriting B2B. Tu rédiges des emails de prospection percutants et personnalisés qui obtiennent des réponses. Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans texte avant ou après.';

    const userPrompt = isEN
      ? `Write a cold outreach email in English.
Tone: ${toneMap[tone] || tone}
Goal: ${goal}
Prospect: ${prospectName || 'First Last'}, ${jobTitle} at ${company}
Sender: ${senderName}

Rules:
- Subject: short, compelling, no spam words
- Body: max 3 short paragraphs
- Use {{firstName}} for first name, {{company}} for company
- One clear CTA at the end
- Sound human, not AI-generated

Reply with ONLY this JSON: {"subject":"...","body":"..."}`
      : `Rédige un email de prospection B2B en ${lang}.
Registre: ${toneMap[tone] || tone}
Objectif: ${goal}
Prospect: ${prospectName || 'Prénom Nom'}, ${jobTitle} chez ${company}
Expéditeur: ${senderName}

Règles:
- Objet: court, accrocheur, sans mots spam
- Corps: 3 paragraphes maximum, personnalisé
- Utilise {{firstName}} pour le prénom, {{company}} pour l'entreprise
- Un seul CTA clair à la fin
- Naturel, pas générique, pas de tournures IA

Réponds UNIQUEMENT avec ce JSON: {"subject":"...","body":"..."}`;

    try {
      const { text, provider } = await runAI(systemPrompt, userPrompt);
      const parsed = parseJSON(text);
      return NextResponse.json({ data: { subject: parsed.subject, body: parsed.body, provider } });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === 'sentiment') {
    const { text = '' } = body;
    const sys = 'Analyse le sentiment et l\'intention de réponses B2B. JSON uniquement.';
    const usr = `Email: "${text.slice(0, 800)}"\nJSON: {"sentiment":"positive"|"neutral"|"negative","intent":"interested"|"not_interested"|"meeting"|"request_info"|"unsubscribe"|"unknown","score":0-100}`;
    try {
      const { text: result } = await runAI(sys, usr);
      return NextResponse.json({ data: parseJSON(result) });
    } catch {
      return NextResponse.json({ data: { sentiment: 'neutral', intent: 'unknown', score: 50 } });
    }
  }

  if (action === 'subject_variants') {
    const { subject = '' } = body;
    const sys = 'Expert copywriting email B2B. JSON uniquement.';
    const usr = `Génère 4 variantes d'objet pour A/B test basées sur: "${subject}"\nApproches: curiosité, bénéfice, question, urgence.\nJSON tableau UNIQUEMENT: ["v1","v2","v3","v4"]`;
    try {
      const { text: result } = await runAI(sys, usr);
      const cleaned = result.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      return NextResponse.json({ data: match ? JSON.parse(match[0]) : [subject] });
    } catch {
      return NextResponse.json({ data: [subject] });
    }
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
