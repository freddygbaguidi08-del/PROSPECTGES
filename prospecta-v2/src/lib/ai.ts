// @ts-nocheck
export async function generateEmail(opts: {
  prospectName: string;
  company: string;
  jobTitle: string;
  senderName: string;
  goal: string;
  tone: string;
  language: string;
}): Promise<{ subject: string; body: string; provider: string }> {
  const prompt = `Write a B2B cold email in ${opts.language === 'fr' ? 'French' : 'English'}.
Tone: ${opts.tone}. Goal: ${opts.goal}.
Prospect: ${opts.prospectName}, ${opts.jobTitle} at ${opts.company}.
Sender: ${opts.senderName}.
Return ONLY valid JSON: {"subject": "...", "body": "..."}
Body max 4 short paragraphs. Use {{firstName}} for personalization.`;

  // Try Groq first
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { choices: Array<{ message: { content: string } }> };
        const text = data.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(text) as { subject: string; body: string };
        return { ...parsed, provider: 'Groq (LLaMA 3.3)' };
      }
    } catch { /* fallback */ }
  }

  // Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
        const text = data.candidates[0].content.parts[0].text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(text) as { subject: string; body: string };
        return { ...parsed, provider: 'Google Gemini' };
      }
    } catch { /* fallback */ }
  }

  // Demo fallback
  return {
    subject: `Une idée pour ${opts.company}`,
    body: `Bonjour {{firstName}},\n\nJe me permets de vous contacter car ${opts.goal}.\n\nSeriez-vous disponible pour un échange de 20 minutes ?\n\nCordialement,\n${opts.senderName}`,
    provider: 'Demo (configurez GROQ_API_KEY)',
  };
}

export async function analyzeSentiment(text: string): Promise<{
  sentiment: string; intent: string; score: number;
}> {
  const prompt = `Analyze this email reply sentiment. Return ONLY JSON:
{"sentiment":"positive"|"neutral"|"negative","intent":"interested"|"not_interested"|"request_info"|"meeting"|"unknown","score":0-100}
Email: ${text.slice(0, 500)}`;

  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 100 }),
      });
      if (res.ok) {
        const data = await res.json() as { choices: Array<{ message: { content: string } }> };
        return JSON.parse(data.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim()) as { sentiment: string; intent: string; score: number };
      }
    } catch { /* fallback */ }
  }

  return { sentiment: 'neutral', intent: 'unknown', score: 50 };
}
