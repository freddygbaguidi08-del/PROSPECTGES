// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

async function callGroq(messages, maxTokens = 1200) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY non configurée sur Vercel');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(prompt, maxTokens = 1200) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY non configurée');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function generateAI(systemPrompt, userPrompt) {
  // Try Groq first
  if (process.env.GROQ_API_KEY) {
    try {
      const text = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
      return { text, provider: 'Groq (LLaMA 3.3 70B)' };
    } catch (e) {
      console.error('[AI] Groq failed:', e.message);
    }
  }

  // Fallback Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await callGemini(`${systemPrompt}\n\n${userPrompt}`);
      return { text, provider: 'Google Gemini' };
    } catch (e) {
      console.error('[AI] Gemini failed:', e.message);
    }
  }

  // Demo fallback
  return {
    text: JSON.stringify({
      subject: `Collaboration avec {{company}}`,
      body: `Bonjour {{firstName}},\n\nJe me permets de vous contacter concernant votre activité dans le secteur.\n\nNous accompagnons des entreprises comme la vôtre à améliorer leurs résultats commerciaux. Seriez-vous disponible pour un échange de 20 minutes ?\n\nCordialement,`,
    }),
    provider: 'Démo — ajoutez GROQ_API_KEY sur Vercel pour activer l\'IA',
  };
}

function extractJSON(text) {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  // Try direct parse
  try { return JSON.parse(cleaned); } catch {}
  
  // Try to find JSON object
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch {} }
  
  // Try to find JSON array
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }
  
  throw new Error('Impossible de parser la réponse IA');
}

export async function POST(req) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 }); }

  const { action } = body;

  // ─── Generate email ───────────────────────────────────────
  if (action === 'generate') {
    const {
      prospectName = 'Prénom Nom',
      company = 'votre entreprise',
      jobTitle = 'Directeur',
      goal = 'Obtenir un RDV de 20 minutes',
      tone = 'friendly',
      language = 'fr',
    } = body;

    const toneLabels = {
      friendly: 'amical et chaleureux',
      formal: 'formel et professionnel',
      direct: 'direct et percutant',
      creative: 'créatif et original',
    };

    const systemPrompt = language === 'fr'
      ? `Tu es un expert en copywriting B2B francophone. Tu rédiges des emails de prospection percutants, personnalisés et efficaces. Tu réponds TOUJOURS et UNIQUEMENT avec un objet JSON valide, sans markdown, sans explication, sans texte avant ou après le JSON.`
      : `You are a B2B copywriting expert. You write compelling, personalized prospecting emails. You ALWAYS respond with valid JSON only, no markdown, no explanation.`;

    const lang = language === 'fr' ? 'français' : 'English';
    const userPrompt = `Génère un email de prospection B2B en ${lang}.
Ton: ${toneLabels[tone] || tone}
Objectif: ${goal}
Prospect: ${prospectName}, ${jobTitle} chez ${company}
Expéditeur: ${session.name}

Règles:
- Objet: court, accrocheur, sans mots spam
- Corps: 3 paragraphes maximum, personnalisé
- Utilise {{firstName}} pour le prénom, {{company}} pour l'entreprise
- CTA clair et unique
- Naturel, pas générique

Réponds UNIQUEMENT avec ce JSON sans aucun autre texte:
{"subject":"...","body":"..."}`;

    try {
      const { text, provider } = await generateAI(systemPrompt, userPrompt);
      const parsed = extractJSON(text);
      return NextResponse.json({ data: { subject: parsed.subject, body: parsed.body, provider } });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ─── Sentiment analysis ───────────────────────────────────
  if (action === 'sentiment') {
    const { text = '' } = body;

    const systemPrompt = 'Tu es un assistant commercial B2B. Tu analyses les emails de réponse pour détecter le sentiment et l\'intention. Tu réponds UNIQUEMENT avec du JSON valide.';
    const userPrompt = `Analyse cet email de réponse B2B:
"${text.slice(0, 800)}"

Réponds UNIQUEMENT avec ce JSON:
{"sentiment":"positive"|"neutral"|"negative","intent":"interested"|"not_interested"|"request_info"|"meeting"|"unsubscribe"|"unknown","score":0-100}`;

    try {
      const { text: result } = await generateAI(systemPrompt, userPrompt);
      const parsed = extractJSON(result);
      return NextResponse.json({ data: parsed });
    } catch {
      return NextResponse.json({ data: { sentiment: 'neutral', intent: 'unknown', score: 50 } });
    }
  }

  // ─── Subject variants ─────────────────────────────────────
  if (action === 'subject_variants') {
    const { subject = '' } = body;

    const systemPrompt = 'Tu es un expert en copywriting email B2B. Tu génères des variantes d\'objets d\'emails pour A/B testing. Tu réponds UNIQUEMENT avec du JSON valide.';
    const userPrompt = `Génère 4 variantes d'objet email pour A/B testing basées sur: "${subject}"
Approches différentes: curiosité, bénéfice concret, question, urgence.
Réponds UNIQUEMENT avec un tableau JSON: ["variante1","variante2","variante3","variante4"]`;

    try {
      const { text: result } = await generateAI(systemPrompt, userPrompt);
      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      const variants = match ? JSON.parse(match[0]) : [subject];
      return NextResponse.json({ data: variants });
    } catch {
      return NextResponse.json({ data: [subject] });
    }
  }

  return NextResponse.json({ error: 'Action inconnue. Actions disponibles: generate, sentiment, subject_variants' }, { status: 400 });
}
