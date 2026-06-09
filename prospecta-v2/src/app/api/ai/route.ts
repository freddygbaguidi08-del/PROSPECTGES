// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

async function callGroq(prompt: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY manquante');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Expert copywriting B2B. Réponds UNIQUEMENT avec JSON valide, sans markdown.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY manquante');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1200, temperature: 0.7 } }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function ai(prompt: string): Promise<{ text: string; provider: string }> {
  if (process.env.GROQ_API_KEY) {
    try { return { text: await callGroq(prompt), provider: 'Groq (LLaMA 3.3)' }; }
    catch (e) { console.error('Groq failed:', e); }
  }
  if (process.env.GEMINI_API_KEY) {
    try { return { text: await callGemini(prompt), provider: 'Google Gemini' }; }
    catch (e) { console.error('Gemini failed:', e); }
  }
  return {
    text: JSON.stringify({ subject: 'Une opportunité pour {{company}}', body: 'Bonjour {{firstName}},\n\nJe me permets de vous contacter au sujet de votre activité.\n\nSeriez-vous disponible pour un échange de 20 minutes ?\n\nCordialement,\n' }),
    provider: 'Démo (ajoutez GROQ_API_KEY)',
  };
}

function parseJSON(text: string) {
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  const arr = cleaned.match(/\[[\s\S]*\]/);
  if (arr) return JSON.parse(arr[0]);
  throw new Error('Invalid JSON response');
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === 'generate') {
    const toneMap = { friendly: 'amical', formal: 'formel', direct: 'direct', creative: 'créatif' };
    const lang = body.language === 'fr' ? 'français' : 'English';
    const prompt = `Email de prospection B2B en ${lang}. Ton: ${toneMap[body.tone] || 'amical'}. Objectif: ${body.goal || 'RDV 20min'}.
Prospect: ${body.prospectName || 'Prénom'}, ${body.jobTitle || 'Directeur'} chez ${body.company || 'son entreprise'}.
Expéditeur: ${session.name}.
Utilise {{firstName}} et {{company}} comme variables.
Corps: 3 paragraphes max, CTA clair.
JSON UNIQUEMENT: {"subject":"...","body":"..."}`;

    try {
      const { text, provider } = await ai(prompt);
      const parsed = parseJSON(text);
      return NextResponse.json({ data: { ...parsed, provider } });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === 'sentiment') {
    const prompt = `Analyse ce email B2B: "${(body.text || '').slice(0, 600)}"
JSON: {"sentiment":"positive"|"neutral"|"negative","intent":"interested"|"not_interested"|"request_info"|"meeting"|"unsubscribe"|"unknown","score":0-100}`;
    try {
      const { text } = await ai(prompt);
      return NextResponse.json({ data: parseJSON(text) });
    } catch {
      return NextResponse.json({ data: { sentiment: 'neutral', intent: 'unknown', score: 50 } });
    }
  }

  if (action === 'subject_variants') {
    const prompt = `4 variantes d'objet email pour A/B test basées sur: "${body.subject}"
Approches: curiosité, bénéfice, question, urgence.
JSON tableau UNIQUEMENT: ["v1","v2","v3","v4"]`;
    try {
      const { text } = await ai(prompt);
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      return NextResponse.json({ data: match ? JSON.parse(match[0]) : [body.subject] });
    } catch {
      return NextResponse.json({ data: [body.subject] });
    }
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
